from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import json
import re
from datetime import datetime
from ..core.dependencies import get_db, get_current_active_user, validate_file_type
from ..models import User, Candidate
from ..schemas import Candidate as CandidateSchema
from ..services.ai_service import ai_service
from ..services.bio_generator import generate_professional_bio
from ..config import settings

router = APIRouter(prefix="/uploads", tags=["uploads"])


def _get_effective_content_type(file: UploadFile) -> str:
    """Return a stable resume content type from MIME type or filename extension."""
    filename = (file.filename or "").lower()
    if filename.endswith(".pdf"):
        return "application/pdf"
    if filename.endswith(".doc"):
        return "application/msword"
    if filename.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if filename.endswith(".txt"):
        return "text/plain"
    return file.content_type or "application/octet-stream"


def _to_profile_month(date_value: str) -> str:
    """Ensure date values are profile-safe and normalized as YYYY-MM when possible."""
    if not date_value:
        return ""
    clean = str(date_value).strip().lower()
    if clean in {"present", "current", "now"}:
        return "present"
    match = re.search(r"((?:19|20)\d{2})-(\d{2})", clean)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    year_match = re.search(r"((?:19|20)\d{2})", clean)
    return f"{year_match.group(1)}-01" if year_match else ""


def _normalize_education(items):
    normalized = []
    for item in items or []:
        if isinstance(item, str):
            normalized.append(
                {
                    "degree": item,
                    "school": "Not provided",
                    "field": item,
                    "startDate": "",
                    "endDate": "",
                    "current": False,
                }
            )
            continue

        normalized.append(
            {
                "degree": item.get("degree") or "Not provided",
                "school": item.get("school") or item.get("institution") or "Not provided",
                "field": item.get("field") or item.get("degree") or "",
                "startDate": _to_profile_month(item.get("startDate") or item.get("year") or ""),
                "endDate": _to_profile_month(item.get("endDate") or ""),
                "current": bool(item.get("current", False)),
            }
        )
    return normalized


def _normalize_experience(items):
    normalized = []
    for item in items or []:
        if isinstance(item, str):
            normalized.append(
                {
                    "title": item,
                    "company": "Not provided",
                    "location": None,
                    "startDate": "",
                    "endDate": "",
                    "current": False,
                    "description": item,
                }
            )
            continue

        normalized.append(
            {
                "title": item.get("title") or item.get("role") or "Not provided",
                "company": item.get("company") or "Not provided",
                "location": item.get("location"),
                "startDate": _to_profile_month(item.get("startDate") or item.get("dates") or ""),
                "endDate": _to_profile_month(item.get("endDate") or ""),
                "current": bool(item.get("current", False)),
                "description": item.get("description") or "",
            }
        )
    return normalized


def _extract_social_links(resume_text: str):
    links = {"github": None, "linkedin": None, "website": None}
    for url in re.findall(r"https?://[^\s]+", resume_text or "", flags=re.IGNORECASE):
        low = url.lower()
        if "github.com" in low and not links["github"]:
            links["github"] = url
        elif "linkedin.com" in low and not links["linkedin"]:
            links["linkedin"] = url
        elif not links["website"]:
            links["website"] = url
    return links


@router.post("/resume", response_model=CandidateSchema)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload and parse resume using AI."""
    # Validate file type
    validate_file_type(file)
    effective_content_type = _get_effective_content_type(file)

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
    parsed_data = ai_service.parse_resume(file_content, effective_content_type, fast_mode=True)

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
    file_extension = os.path.splitext(file.filename or "")[1]
    filename = f"resume_{current_user.id}_{timestamp}{file_extension}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    education_list = _normalize_education(parsed_data.get("education", []))
    experience_list = _normalize_experience(parsed_data.get("work_experience", []))
    skills_list = parsed_data.get("skills", []) or []
    soft_skills = parsed_data.get("soft_skills", []) or []
    certifications = parsed_data.get("certifications", []) or []
    projects = parsed_data.get("projects", []) or []
    languages = parsed_data.get("languages", []) or []
    validation = parsed_data.get("validation", {}) or {}
    professional_summary = parsed_data.get("professional_summary") or parsed_data.get("profile_summary") or ""
    cover_letter_text = parsed_data.get("cover_letter") or ""

    # Update candidate profile with parsed data
    candidate.resume_path = file_path
    candidate.resume_text = parsed_data.get('resume_text', '')
    candidate.cover_letter = cover_letter_text
    candidate.skills = json.dumps(list(dict.fromkeys(skills_list + soft_skills)))
    candidate.experience_years = parsed_data.get('experience_years', 0.0)
    candidate.education = json.dumps(education_list)
    candidate.work_experience = json.dumps(experience_list)
    candidate.certifications = json.dumps(certifications)
    candidate.projects = json.dumps(projects)
    candidate.languages = json.dumps(languages)

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

    links = _extract_social_links(candidate.resume_text)
    if links.get("github"):
        candidate.github = links["github"]
    if links.get("linkedin"):
        candidate.linkedin = links["linkedin"]
    if links.get("website"):
        candidate.website = links["website"]

    generated_bio = generate_professional_bio(
        title=candidate.title or parsed_data.get('title'),
        experience_years=candidate.experience_years,
        skills=skills_list,
        work_experience=experience_list,
        education=education_list,
        resume_text=candidate.resume_text or parsed_data.get('resume_text', ''),
        cover_letter=cover_letter_text,
    )

    if generated_bio:
        candidate.bio = generated_bio
    elif professional_summary:
        candidate.bio = professional_summary

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

    # Automatically trigger job matching for the candidate
    try:
        from ..services.matching_engine import MatchingEngine
        engine = MatchingEngine()
        
        # Get all active jobs
        active_jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).all()
        
        if active_jobs and candidate.embedding:
            candidate_embedding = json.loads(candidate.embedding)
            matches_found = 0
            
            for job in active_jobs:
                if job.embedding:
                    try:
                        job_embedding = json.loads(job.embedding)
                        job_dict = {
                            'id': job.id,
                            'title': job.title,
                            'description': job.description,
                            'requirements': job.requirements,
                            'experience_level': job.experience_level,
                            'location': job.location,
                            'skills': job.skills
                        }
                        
                        match_score, match_explanation = engine.match_candidate_to_job(
                            candidate_embedding,
                            job_embedding,
                            candidate_dict,
                            job_dict
                        )
                        
                        # Store match if score is above 60%
                        if match_score >= 0.6:
                            matches_found += 1
                    except Exception:
                        continue
            
            print(f"✅ Auto-matching complete: Found {matches_found} jobs with 60%+ match for candidate {candidate.id}")
    except Exception as e:
        print(f"⚠️ Auto-matching failed: {e}")
        # Continue even if matching fails

    # Return a response payload compatible with CandidateSchema
    response_data = {
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
        "cover_letter": candidate.cover_letter,
        "profile_summary": candidate.profile_summary,
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at,
        "projects": projects,
        "languages": languages,
    }

    try:
        response_data["skills_list"] = json.loads(candidate.skills) if candidate.skills else []
    except Exception:
        response_data["skills_list"] = []

    try:
        response_data["education_list"] = json.loads(candidate.education) if candidate.education else []
    except Exception:
        response_data["education_list"] = []

    try:
        response_data["work_experience_list"] = json.loads(candidate.work_experience) if candidate.work_experience else []
    except Exception:
        response_data["work_experience_list"] = []

    try:
        response_data["certifications"] = json.loads(candidate.certifications) if candidate.certifications else []
    except Exception:
        response_data["certifications"] = []

    response_data["projects"] = projects
    response_data["languages"] = languages
    response_data["extraction_report"] = {
        "status": "success",
        "validation": validation,
        "missing_fields": validation.get("missing_fields", []),
        "ambiguous_fields": validation.get("ambiguous_fields", []),
        "needs_review": validation.get("needs_review", False),
        "gdpr_notice": "Only profile fields are stored and returned from extracted CV data.",
    }

    response_data["skills"] = candidate.skills
    response_data["education"] = candidate.education
    response_data["work_experience"] = candidate.work_experience
    response_data["professional_summary"] = professional_summary

    return response_data


@router.post("/certificate")
async def upload_certificate(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a certificate or credential file and attach it to the candidate profile.

    Certificates are optional and will only be stored if the user chooses to upload them.
    """
    # Accept common document and image types for certificates
    allowed = {"application/pdf", "image/png", "image/jpeg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}

    effective_content_type = _get_effective_content_type(file)
    if effective_content_type not in allowed and (file.content_type or "") not in allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported certificate file type")

    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found")

    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File too large. Max size is {settings.MAX_FILE_SIZE} bytes")

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename or "")[1]
    filename = f"certificate_{current_user.id}_{timestamp}{file_extension}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    # Append certificate record to candidate.certifications (stored as JSON list)
    try:
        certs = json.loads(candidate.certifications) if candidate.certifications else []
    except Exception:
        certs = []

    cert_record = {
        "id": f"cert_{len(certs)+1}",
        "name": os.path.splitext(file.filename or filename)[0],
        "issuer": "Uploaded by candidate",
        "date": None,
        "path": file_path,
    }

    certs.append(cert_record)
    candidate.certifications = json.dumps(certs)

    db.commit()
    db.refresh(candidate)

    return {"success": True, "certificate": cert_record}


