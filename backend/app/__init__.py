__version__ = "1.0.0"
__author__ = ""
__author_email__ = ""

import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
MODELS_DIR = BASE_DIR.parent.parent / "ml_models"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

from .main import app
from .database import engine, SessionLocal, Base
from .config import settings

__all__ = [
    "app",
    "SessionLocal",
    "engine",
    "Base",
    "settings",
    "logger",
    "UPLOAD_DIR",
    "MODELS_DIR"
]

# Package initialization message
logger.info(f"AI Recruitment System v{__version__} initialized")
logger.info(f"Base directory: {BASE_DIR}")
logger.info(f"Upload directory: {UPLOAD_DIR}")