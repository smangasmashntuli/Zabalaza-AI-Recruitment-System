from fastapi import APIRouter
from . import auth, jobs, candidates, matches, uploads, generative, intelligence

router = APIRouter()

# Most child routers already define their own prefix/tags.
router.include_router(auth.router)
router.include_router(jobs.router)
router.include_router(candidates.router)
router.include_router(matches.router)
router.include_router(uploads.router)
router.include_router(generative.router, prefix="/generative", tags=["generative"])
router.include_router(intelligence.router)

__all__ = ["router"]

__all__.extend([
    "auth",
    "jobs",
    "candidates",
    "matches",
    "uploads",
    "generative",
    "intelligence"
])