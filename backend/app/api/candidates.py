from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from ..core.dependencies import get_db, get_current_active_user
from ..models import User, Candidate, Application, Job, ApplicationStatus
from ..schemas import (
    Candidate as CandidateSchema,
    CandidateUpdate,
    Application as ApplicationSchema,
    ApplicationCreate,
    JobMatch
)
from ..services.ai_service import ai_service

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("/me", response_model=CandidateSchema)
def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current candidate's profile."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    return candidate


@router.put("/me", response_model=CandidateSchema)
def update_my_profile(
    candidate_data: CandidateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current candidate's profile."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    # Update fields
    update_data = candidate_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(candidate, field, value)

    # Regenerate embedding and summary if profile changed
    candidate_dict = {
        'resume_text': candidate.resume_text,
        'skills': candidate.skills,
        'experience_years': candidate.experience_years,
        'education': candidate.education,
        'work_experience': candidate.work_experience
    }

    embedding = ai_service.generate_candidate_embedding(candidate_dict)
    candidate.embedding = json.dumps(embedding)

    summary = ai_service.generate_profile_summary(candidate_dict)
    candidate.profile_summary = summary

    db.commit()
    db.refresh(candidate)

    return candidate


@router.get("/me/matches", response_model=List[JobMatch])
def get_job_matches(
    top_k: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered job matches for current candidate."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    if not candidate.embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a resume first to get job matches"
        )

    # Get active jobs
    jobs = db.query(Job).filter(Job.status == "active").all()

    if not jobs:
        return []

    # Convert to dict format
    jobs_dict = []
    for job in jobs:
        job_dict = {
            'id': job.id,
            'title': job.title,
            'description': job.description,
            'requirements': job.requirements,
            'experience_level': job.experience_level,
            'location': job.location,
            'embedding': job.embedding,
            'skills': job.skills
        }
        jobs_dict.append(job_dict)

    # Get candidate data
    candidate_dict = {
        'resume_text': candidate.resume_text,
        'skills': candidate.skills,
        'experience_years': candidate.experience_years,
        'education': candidate.education,
        'work_experience': candidate.work_experience
    }

    candidate_embedding = json.loads(candidate.embedding)

    # Find matches using AI
    matches = ai_service.find_matching_jobs(
        candidate_embedding,
        jobs_dict,
        candidate_dict,
        top_k
    )

    return matches


@router.post("/me/applications", response_model=ApplicationSchema, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply for a job."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    # Check if job exists
    job = db.query(Job).filter(Job.id == application_data.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if already applied
    existing_application = db.query(Application).filter(
        Application.candidate_id == candidate.id,
        Application.job_id == application_data.job_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already applied for this job"
        )

    # Calculate match score using AI
    match_score = 0.0
    match_explanation = "No matching data available"

    if candidate.embedding and job.embedding:
        candidate_embedding = json.loads(candidate.embedding)
        job_embedding = json.loads(job.embedding)

        candidate_dict = {
            'skills': candidate.skills,
            'experience_years': candidate.experience_years,
            'education': candidate.education
        }

        job_dict = {
            'title': job.title,
            'description': job.description,
            'requirements': job.requirements,
            'experience_level': job.experience_level,
            'skills': job.skills
        }

        match_score, match_explanation = ai_service.match_candidate_to_job(
            candidate_embedding,
            job_embedding,
            candidate_dict,
            job_dict
        )

    # Create application
    application = Application(
        job_id=application_data.job_id,
        candidate_id=candidate.id,
        cover_letter=application_data.cover_letter,
        status=ApplicationStatus.PENDING,
        match_score=match_score,
        match_explanation=match_explanation
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@router.get("/me/applications", response_model=List[ApplicationSchema])
def get_my_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all applications submitted by current candidate."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    applications = db.query(Application).filter(
        Application.candidate_id == candidate.id
    ).all()

    return applications

