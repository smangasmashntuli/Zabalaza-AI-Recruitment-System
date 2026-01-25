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

    # Convert to dict and add user info
    candidate_dict = {
        "id": candidate.id,
        "user_id": candidate.user_id,
        "email": current_user.email,
        "first_name": current_user.first_name or "",
        "last_name": current_user.last_name or "",
        "phone": candidate.phone,
        "location": candidate.location,
        "title": candidate.title,
        "bio": candidate.bio,
        "website": candidate.website,
        "linkedin": candidate.linkedin,
        "github": candidate.github,
        "experience_years": candidate.experience_years,
        "resume_path": candidate.resume_path,
        "resume_text": candidate.resume_text,
        "profile_summary": candidate.profile_summary,
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at,
    }

    # Parse JSON fields
    try:
        candidate_dict["skills_list"] = json.loads(candidate.skills) if candidate.skills else []
    except:
        candidate_dict["skills_list"] = []

    try:
        candidate_dict["education_list"] = json.loads(candidate.education) if candidate.education else []
    except:
        candidate_dict["education_list"] = []

    try:
        candidate_dict["work_experience_list"] = json.loads(candidate.work_experience) if candidate.work_experience else []
    except:
        candidate_dict["work_experience_list"] = []

    try:
        candidate_dict["certifications"] = json.loads(candidate.certifications) if candidate.certifications else []
    except:
        candidate_dict["certifications"] = []

    # Keep original JSON strings for backward compatibility
    candidate_dict["skills"] = candidate.skills
    candidate_dict["education"] = candidate.education
    candidate_dict["work_experience"] = candidate.work_experience

    return candidate_dict


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

    # Update user fields
    user = db.query(User).filter(User.id == current_user.id).first()
    if candidate_data.first_name is not None:
        user.first_name = candidate_data.first_name
    if candidate_data.last_name is not None:
        user.last_name = candidate_data.last_name
        user.full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()

    # Update candidate fields
    update_data = candidate_data.dict(exclude_unset=True)

    # Handle structured data - convert lists to JSON strings
    if 'skills' in update_data and update_data['skills'] is not None:
        candidate.skills = json.dumps(update_data['skills'])
        del update_data['skills']

    if 'education' in update_data and update_data['education'] is not None:
        candidate.education = json.dumps([edu.dict() for edu in update_data['education']])
        del update_data['education']

    if 'work_experience' in update_data and update_data['work_experience'] is not None:
        candidate.work_experience = json.dumps([exp.dict() for exp in update_data['work_experience']])
        del update_data['work_experience']

    if 'certifications' in update_data and update_data['certifications'] is not None:
        candidate.certifications = json.dumps([cert.dict() for cert in update_data['certifications']])
        del update_data['certifications']

    # Update simple fields
    for field in ['title', 'bio', 'phone', 'location', 'website', 'linkedin', 'github', 'experience_years']:
        if field in update_data and update_data[field] is not None:
            setattr(candidate, field, update_data[field])

    # Regenerate embedding and summary if profile changed
    try:
        candidate_dict = {
            'resume_text': candidate.resume_text or '',
            'skills': candidate.skills or '[]',
            'experience_years': candidate.experience_years or 0,
            'education': candidate.education or '[]',
            'work_experience': candidate.work_experience or '[]'
        }

        embedding = ai_service.generate_candidate_embedding(candidate_dict)
        candidate.embedding = json.dumps(embedding)

        summary = ai_service.generate_profile_summary(candidate_dict)
        candidate.profile_summary = summary
    except Exception as e:
        print(f"Error generating embedding/summary: {e}")
        # Continue even if AI service fails

    db.commit()
    db.refresh(candidate)
    db.refresh(user)

    # Return the same format as get_my_profile
    candidate_dict = {
        "id": candidate.id,
        "user_id": candidate.user_id,
        "email": user.email,
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "phone": candidate.phone,
        "location": candidate.location,
        "title": candidate.title,
        "bio": candidate.bio,
        "website": candidate.website,
        "linkedin": candidate.linkedin,
        "github": candidate.github,
        "experience_years": candidate.experience_years,
        "resume_path": candidate.resume_path,
        "resume_text": candidate.resume_text,
        "profile_summary": candidate.profile_summary,
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at,
    }

    # Parse JSON fields
    try:
        candidate_dict["skills_list"] = json.loads(candidate.skills) if candidate.skills else []
    except:
        candidate_dict["skills_list"] = []

    try:
        candidate_dict["education_list"] = json.loads(candidate.education) if candidate.education else []
    except:
        candidate_dict["education_list"] = []

    try:
        candidate_dict["work_experience_list"] = json.loads(candidate.work_experience) if candidate.work_experience else []
    except:
        candidate_dict["work_experience_list"] = []

    try:
        candidate_dict["certifications"] = json.loads(candidate.certifications) if candidate.certifications else []
    except:
        candidate_dict["certifications"] = []

    # Keep original JSON strings
    candidate_dict["skills"] = candidate.skills
    candidate_dict["education"] = candidate.education
    candidate_dict["work_experience"] = candidate.work_experience

    return candidate_dict


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

