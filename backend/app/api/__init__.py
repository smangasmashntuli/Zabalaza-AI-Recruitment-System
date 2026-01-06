from fastapi import APIRouter
from . import auth, jobs, candidates, matches, uploads

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
router.include_router(candidates.router, prefix="/candidates", tags=["candidates"])
router.include_router(matches.router, prefix="/matches", tags=["matching"])
router.include_router(uploads.router, prefix="/uploads", tags=["file-uploads"])

__all__ = ["router"]

__all__.extend([
    "auth",
    "jobs",
    "candidates",
    "matches",
    "uploads"
])