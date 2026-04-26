from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api import auth, jobs, candidates, uploads, matches
from .config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Job Recruitment System with ML-based candidate-job matching",
    version="1.0.0"
)

# Local dev origins for the React client.
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(candidates.router, prefix=settings.API_V1_STR)
app.include_router(uploads.router, prefix=settings.API_V1_STR)
app.include_router(matches.router, prefix=settings.API_V1_STR)


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
    """Health check endpoint."""
    return {"status": "healthy"}

