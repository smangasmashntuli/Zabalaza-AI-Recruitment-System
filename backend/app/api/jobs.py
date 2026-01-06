from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from ..core.dependencies import get_db, get_current_active_user, get_current_recruiter_user
from ..models import User, Job, JobStatus
from ..schemas import Job as JobSchema, JobCreate, JobUpdate, JobWithApplications
from ..services.ai_service import ai_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/", response_model=JobSchema, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_recruiter_user),
    db: Session = Depends(get_db)
):
    """Create a new job posting (Recruiter/Admin only)."""
    # Create job
    job = Job(
        title=job_data.title,
        description=job_data.description,
        requirements=job_data.requirements,
        location=job_data.location,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
        job_type=job_data.job_type,
        experience_level=job_data.experience_level,
        recruiter_id=current_user.id,
        status=JobStatus.DRAFT
    )

    # Generate AI embedding for the job
    job_dict = {
        'title': job.title,
        'description': job.description,
        'requirements': job.requirements,
        'experience_level': job.experience_level,
        'location': job.location
    }

    embedding = ai_service.generate_job_embedding(job_dict)
    job.embedding = json.dumps(embedding)

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get("/", response_model=List[JobSchema])
def get_jobs(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get all job postings."""
    query = db.query(Job)

    if status:
        try:
            job_status = JobStatus(status)
            query = query.filter(Job.status == job_status)
        except ValueError:
            pass

    jobs = query.offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=JobSchema)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific job by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return job


@router.put("/{job_id}", response_model=JobSchema)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_recruiter_user),
    db: Session = Depends(get_db)
):
    """Update a job posting."""
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
            detail="Not authorized to update this job"
        )

    # Update fields
    update_data = job_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    # Regenerate embedding if content changed
    if any(field in update_data for field in ['title', 'description', 'requirements']):
        job_dict = {
            'title': job.title,
            'description': job.description,
            'requirements': job.requirements,
            'experience_level': job.experience_level,
            'location': job.location
        }
        embedding = ai_service.generate_job_embedding(job_dict)
        job.embedding = json.dumps(embedding)

    db.commit()
    db.refresh(job)

    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_recruiter_user),
    db: Session = Depends(get_db)
):
    """Delete a job posting."""
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
            detail="Not authorized to delete this job"
        )

    db.delete(job)
    db.commit()

    return None


@router.get("/my/jobs", response_model=List[JobWithApplications])
def get_my_jobs(
    current_user: User = Depends(get_current_recruiter_user),
    db: Session = Depends(get_db)
):
    """Get jobs posted by current recruiter."""
    jobs = db.query(Job).filter(Job.recruiter_id == current_user.id).all()

    # Add application count
    result = []
    for job in jobs:
        job_dict = job.__dict__.copy()
        job_dict['application_count'] = len(job.applications)
        result.append(job_dict)

    return result

