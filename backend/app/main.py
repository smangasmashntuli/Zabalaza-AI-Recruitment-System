from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
import os
import logging
from dotenv import load_dotenv

# Load .env at app startup (CRITICAL for Gemini API key)
load_dotenv()

from .database import engine, Base
from .api import router as api_router
from .config import settings

logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)


def _ensure_candidate_cover_letter_column():
    """Add the cover_letter column if it doesn't already exist."""
    try:
        inspector = inspect(engine)
        columns = {column.get('name') for column in inspector.get_columns('candidates')}
        if 'cover_letter' not in columns:
            with engine.begin() as connection:
                connection.execute(text('ALTER TABLE candidates ADD COLUMN cover_letter TEXT NULL'))
    except Exception:
        # Safe fallback: if migration fails, the app still boots and existing fields keep working.
        pass


_ensure_candidate_cover_letter_column()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Job Recruitment System with ML-based candidate-job matching",
    version="1.0.0"
)

# Local dev origins for the React client, plus flexible regex for other dev ports
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
env_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
allowed_origins = list(dict.fromkeys(default_origins + env_origins))

# Configure CORS - MUST be added before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Include all API routers under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to AI Job Recruitment System API",
        "version": "1.0.0",
        "docs": "/docs",
        "features": [
            "AI-powered resume parsing",
            "Semantic job-candidate matching",
            "Automated profile analysis",
            "Smart job recommendations"
        ]
    }


@app.get("/health")
def health_check():
    """Health check endpoint - includes LLM service status."""
    from .services.gemini_service import get_gemini_service
    
    gemini_svc = get_gemini_service()
    llm_enabled = gemini_svc and getattr(gemini_svc, "enabled", False)
    
    return {
        "status": "healthy",
        "services": {
            "llm": {
                "available": llm_enabled,
                "model": getattr(gemini_svc, "model_name", "unknown") if gemini_svc else "not-initialized",
                "api_key_present": bool(os.getenv("GEMINI_API_KEY", "").strip())
            }
        }
    }

