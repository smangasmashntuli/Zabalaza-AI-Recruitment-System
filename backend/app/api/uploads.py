from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import json
from datetime import datetime
from ..core.dependencies import get_db, get_current_active_user, validate_file_type
from ..models import User, Candidate
from ..schemas import Candidate as CandidateSchema
from ..services.ai_service import ai_service
from ..config import settings

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/resume", response_model=CandidateSchema)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload and parse resume using AI."""
    # Validate file type
    validate_file_type(file)

    # Get candidate profile
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    # Read file content
    file_content = await file.read()

    # Check file size
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size is {settings.MAX_FILE_SIZE} bytes"
        )

    # Parse resume using AI
    parsed_data = ai_service.parse_resume(file_content, file.content_type)

    if not parsed_data.get('success'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=parsed_data.get('error', 'Failed to parse resume')
        )

    # Save file
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"resume_{current_user.id}_{timestamp}{file_extension}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    # Update candidate profile with parsed data
    candidate.resume_path = file_path
    candidate.resume_text = parsed_data.get('resume_text', '')
    candidate.skills = json.dumps(parsed_data.get('skills', []))
    candidate.experience_years = parsed_data.get('experience_years', 0.0)
    candidate.education = json.dumps(parsed_data.get('education', []))
    candidate.work_experience = json.dumps(parsed_data.get('work_experience', []))
    candidate.certifications = json.dumps(parsed_data.get('certifications', []))

    if parsed_data.get('location'):
        candidate.location = parsed_data.get('location')

    if parsed_data.get('title'):
        candidate.title = parsed_data.get('title')

    # Update phone if found and not already set
    if parsed_data.get('phone'):
        candidate.phone = parsed_data.get('phone')

    if parsed_data.get('first_name'):
        current_user.first_name = parsed_data.get('first_name')
    if parsed_data.get('last_name'):
        current_user.last_name = parsed_data.get('last_name')

    full_name = parsed_data.get('full_name')
    if full_name:
        current_user.full_name = full_name

    # Generate embedding for the candidate
    candidate_dict = {
        'resume_text': candidate.resume_text,
        'skills': candidate.skills,
        'experience_years': candidate.experience_years,
        'education': candidate.education,
        'work_experience': candidate.work_experience,
        'location': candidate.location,
    }

    embedding = ai_service.generate_candidate_embedding(candidate_dict)
    candidate.embedding = json.dumps(embedding)

    # Generate AI profile summary
    profile_summary = ai_service.generate_profile_summary(candidate_dict)
    candidate.profile_summary = profile_summary

    db.commit()
    db.refresh(candidate)

    return candidate

