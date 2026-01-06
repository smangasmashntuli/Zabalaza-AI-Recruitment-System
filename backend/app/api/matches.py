from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from ..core.dependencies import get_db, get_current_recruiter_user
from ..models import User, Job, Candidate, Application
from ..schemas import JobMatch
from ..services.ai_service import ai_service

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/job/{job_id}/candidates", response_model=List[dict])
def get_matching_candidates_for_job(
    job_id: int,
    top_k: int = 10,
    current_user: User = Depends(get_current_recruiter_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered candidate matches for a specific job (Recruiter/Admin only)."""
    # Get job
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if user owns the job or is admin
    if job.recruiter_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view matches for this job"
        )

    if not job.embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job embedding not available"
        )

    # Get all candidates with embeddings
    candidates = db.query(Candidate).filter(Candidate.embedding.isnot(None)).all()

    if not candidates:
        return []

    # Get job data
    job_dict = {
        'id': job.id,
        'title': job.title,
        'description': job.description,
        'requirements': job.requirements,
        'experience_level': job.experience_level,
        'location': job.location,
        'skills': job.skills
    }

    job_embedding = json.loads(job.embedding)

    # Calculate matches for each candidate
    matches = []
    for candidate in candidates:
        try:
            candidate_embedding = json.loads(candidate.embedding)

            candidate_dict = {
                'resume_text': candidate.resume_text,
                'skills': candidate.skills,
                'experience_years': candidate.experience_years,
                'education': candidate.education,
                'work_experience': candidate.work_experience
            }

            score, explanation = ai_service.match_candidate_to_job(
                candidate_embedding,
                job_embedding,
                candidate_dict,
                job_dict
            )

            # Check if already applied
            application = db.query(Application).filter(
                Application.job_id == job_id,
                Application.candidate_id == candidate.id
            ).first()

            matches.append({
                'candidate_id': candidate.id,
                'user_id': candidate.user_id,
                'match_score': score,
                'match_explanation': explanation,
                'phone': candidate.phone,
                'location': candidate.location,
                'experience_years': candidate.experience_years,
                'profile_summary': candidate.profile_summary,
                'has_applied': application is not None,
                'application_status': application.status.value if application else None
            })
        except Exception as e:
            print(f"Error matching candidate {candidate.id}: {e}")
            continue

    # Sort by match score descending
    matches.sort(key=lambda x: x['match_score'], reverse=True)

    return matches[:top_k]


@router.get("/applications/job/{job_id}", response_model=List[dict])
def get_job_applications_with_scores(
    job_id: int,
    current_user: User = Depends(get_current_recruiter_user),
    db: Session = Depends(get_db)
):
    """Get all applications for a job with AI match scores (Recruiter/Admin only)."""
    # Get job
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if user owns the job or is admin
    if job.recruiter_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view applications for this job"
        )

    # Get all applications for the job
    applications = db.query(Application).filter(Application.job_id == job_id).all()

    result = []
    for app in applications:
        candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
        if candidate:
            result.append({
                'application_id': app.id,
                'candidate_id': candidate.id,
                'user_id': candidate.user_id,
                'status': app.status.value,
                'match_score': app.match_score,
                'match_explanation': app.match_explanation,
                'cover_letter': app.cover_letter,
                'applied_at': app.applied_at,
                'candidate_info': {
                    'phone': candidate.phone,
                    'location': candidate.location,
                    'experience_years': candidate.experience_years,
                    'profile_summary': candidate.profile_summary,
                    'resume_path': candidate.resume_path
                }
            })

    # Sort by match score descending
    result.sort(key=lambda x: x['match_score'] or 0, reverse=True)

    return result


@router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    new_status: str,
    current_user: User = Depends(get_current_recruiter_user),
    db: Session = Depends(get_db)
):
    """Update application status (Recruiter/Admin only)."""
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Get job to verify ownership
    job = db.query(Job).filter(Job.id == application.job_id).first()

    if job.recruiter_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this application"
        )

    # Update status
    try:
        from ..models import ApplicationStatus
        application.status = ApplicationStatus(new_status)
        db.commit()

        return {
            "message": "Application status updated successfully",
            "application_id": application_id,
            "new_status": new_status
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status value"
        )

