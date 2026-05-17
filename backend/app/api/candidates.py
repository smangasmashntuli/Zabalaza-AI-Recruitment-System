from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import logging
from ..core.dependencies import get_db, get_current_active_user
from ..models import User, Candidate, Application, Job, ApplicationStatus
from ..schemas import (
    Candidate as CandidateSchema,
    CandidateUpdate,
    Application as ApplicationSchema,
    ApplicationCreate,
    JobMatch,
    MatchesResponse,
    CareerPathResponse,
    ChatRequest,
)
from ..config import settings
from ..services.ai_service import ai_service

router = APIRouter(prefix="/candidates", tags=["candidates"])
logger = logging.getLogger(__name__)


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

    candidate_dict["projects"] = []
    candidate_dict["languages"] = []
    candidate_dict["extraction_report"] = None

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

    candidate_dict["projects"] = []
    candidate_dict["languages"] = []
    candidate_dict["extraction_report"] = None

    # Keep original JSON strings
    candidate_dict["skills"] = candidate.skills
    candidate_dict["education"] = candidate.education
    candidate_dict["work_experience"] = candidate.work_experience

    return candidate_dict


@router.get("/me/matches", response_model=MatchesResponse)
def get_job_matches(
    top_k: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered job matches for current candidate.

    Returns a structured response with `items` (list of JobMatch) and `insights` which
    contains a conversational suggestion when matches are missing or low.
    """
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

    # Enhance matches with LLM-powered explanations
    items = []
    if matches:
        for match in matches:
            # Try to get Gemini-powered match explanation
            match_explanation = match.get('match_explanation', 'Good match for your profile')
            try:
                job_id = match.get('job_id')
                job = next((j for j in jobs if j.id == job_id), None)
                if job:
                    job_dict_full = {
                        'title': job.title,
                        'description': job.description,
                        'requirements': job.requirements,
                        'requirements_list': getattr(job, 'requirements_list', []),
                    }
                    match_explanation = ai_service.generate_match_explanation(
                        job_dict_full,
                        candidate_dict,
                        match.get('match_score', 0)
                    )
            except Exception as e:
                # If LLM fails, use the fallback explanation
                pass

            items.append({
                'job_id': match.get('job_id'),
                'job_title': match.get('job_title', 'Position'),
                'match_score': match.get('match_score', 0),
                'match_explanation': match_explanation,
                'skill_gaps': match.get('skill_gaps', []),
                'strengths': match.get('strengths', []),
                'job_details': match.get('job_details', {})
            })

    # If no strong matches, provide conversational guidance and suggested alternatives
    insights = None
    career_path = None

    # Determine if matches are below similarity threshold
    try:
        threshold = float(getattr(settings, 'SIMILARITY_THRESHOLD', 0.6))
    except Exception:
        threshold = 0.6

    if not items:
        insights = (
            "We couldn't find close matches for your profile. "
            "Consider adding more technical skills, uploading relevant certificates, or broadening your location or role preferences. "
            "Below are some alternative job postings you can review."
        )
        # Get career path suggestions
        try:
            career_path = ai_service.generate_career_path(candidate_dict)
        except Exception:
            career_path = None

        # Suggest some alternatives (first N active jobs) with low match score so UI can display them
        suggested = []
        for job in jobs[: min(5, len(jobs))]:
            suggested.append({
                'job_id': job.id,
                'job_title': job.title,
                'match_score': 0.0,
                'match_explanation': 'Suggested alternative — broaden your criteria',
                'job_details': {
                    'description': job.description,
                    'location': job.location,
                    'job_type': job.job_type if hasattr(job, 'job_type') else None,
                    'salary_min': getattr(job, 'salary_min', None),
                    'salary_max': getattr(job, 'salary_max', None),
                }
            })
        items = suggested
    else:
        # If matches exist but average score is low, add an insight message and suggest career path development
        try:
            avg_score = sum(m.get('match_score', 0) for m in items) / max(1, len(items))
            if avg_score < threshold:
                insights = (
                    f"The average match score for your top {len(items)} recommendations is {avg_score:.2%}. "
                    "Consider enhancing your profile (skills, certificates, experience details) to improve matches."
                )
                # Get career path suggestions when matches are low
                try:
                    career_path = ai_service.generate_career_path(candidate_dict)
                except Exception:
                    pass
        except Exception:
            insights = None

    return {
        'items': items,
        'insights': insights,
        'career_path': career_path
    }


@router.get("/me/career-path", response_model=CareerPathResponse)
def get_career_path(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered career path recommendations for the current candidate."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    # Get candidate data
    candidate_dict = {
        'skills': candidate.skills,
        'experience_years': candidate.experience_years,
        'education': candidate.education,
        'work_experience': candidate.work_experience,
        'profile_summary': candidate.profile_summary,
    }

    try:
        career_path = ai_service.generate_career_path(candidate_dict)
        return {
            'career_path': career_path,
            'learning_recommendations': [],  # Can be enhanced later
            'next_roles': []  # Can be enhanced later
        }
    except Exception as e:
        logger.error(f"Error generating career path: {e}")
        return {
            'career_path': "We could not generate career recommendations at this time. Please try again later.",
            'learning_recommendations': [],
            'next_roles': []
        }


@router.post("/me/interview-tips")
def get_interview_tips(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get interview preparation tips for a specific job."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    try:
        from ..services.gemini_service import get_gemini_service
        gemini_service = get_gemini_service()
        
        work_exp = candidate.work_experience
        if isinstance(work_exp, str):
            try:
                work_exp = json.loads(work_exp)
            except:
                work_exp = []
        
        exp_summary = "; ".join([str(e)[:50] for e in work_exp[:3]]) if isinstance(work_exp, list) else str(work_exp)[:100]
        
        tips = gemini_service.generate_interview_tips(
            job_title=job.title,
            job_description=job.description,
            candidate_experience=exp_summary
        )
        
        return {'interview_tips': tips}
    except Exception as e:
        logger.error(f"Error generating interview tips: {e}")
        return {'interview_tips': 'Please research this role and prepare answers to common interview questions.'}


@router.post("/me/cv-optimization")
def get_cv_optimization_tips(
    section: str,  # e.g., "summary", "skills", "experience"
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI suggestions to optimize a CV section."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )

    try:
        from ..services.gemini_service import get_gemini_service
        gemini_service = get_gemini_service()
        
        section_text = ""
        if section == "summary":
            section_text = candidate.profile_summary or ""
        elif section == "skills":
            section_text = candidate.skills or ""
        elif section == "experience":
            section_text = candidate.work_experience or ""
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown section: {section}. Valid sections: summary, skills, experience"
            )

        if not section_text:
            return {'optimized_text': "", 'message': f'No {section} found in your profile'}

        optimized = gemini_service.optimize_cv_section(
            section_name=section,
            current_text=section_text
        )
        
        return {'optimized_text': optimized}
    except Exception as e:
        logger.error(f"Error optimizing CV section: {e}")
        return {'optimized_text': "", 'message': 'Could not optimize section at this time'}


@router.post("/me/applications")
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


@router.get("/me/match-analysis")
def get_match_analysis(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed match analysis for a specific job."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        from ..services.gemini_service import get_gemini_service
        gemini = get_gemini_service()
        
        candidate_skills = []
        try:
            candidate_skills = json.loads(candidate.skills) if candidate.skills else []
        except:
            candidate_skills = []
        
        job_requirements = []
        try:
            job_requirements = json.loads(job.requirements) if job.requirements else []
        except:
            job_requirements = [job.requirements] if job.requirements else []

        match_score = 0.0
        if candidate.embedding and job.embedding:
            try:
                from ..services.matching_engine import MatchingEngine
                engine = MatchingEngine()
                candidate_emb = json.loads(candidate.embedding)
                job_emb = json.loads(job.embedding)
                match_score = engine.calculate_similarity(candidate_emb, job_emb)
            except:
                match_score = 0.0

        analysis = gemini.analyze_match_details(
            job_title=job.title,
            job_description=job.description,
            job_requirements=job_requirements,
            candidate_skills=candidate_skills,
            candidate_experience=candidate.resume_text[:300] if candidate.resume_text else "",
            match_score=match_score
        )
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing match: {e}")
        return {
            "summary": "Analysis temporarily unavailable",
            "strengths": [],
            "gaps": [],
            "recommendations": ""
        }


@router.get("/me/resume-tailoring")
def get_resume_tailoring(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get resume tailoring suggestions for a specific job."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        from ..services.gemini_service import get_gemini_service
        gemini = get_gemini_service()
        
        suggestions = gemini.get_resume_tailoring_suggestions(
            job_title=job.title,
            job_description=job.description,
            current_resume=candidate.resume_text[:500] if candidate.resume_text else candidate.profile_summary or ""
        )
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Error getting resume tailoring: {e}")
        return {"suggestions": "Tailoring suggestions not available"}


@router.get("/me/profile-improvement")
def get_profile_improvement(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get tips to improve profile and stand out."""
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    try:
        from ..services.gemini_service import get_gemini_service
        gemini = get_gemini_service()
        
        skills = []
        try:
            skills = json.loads(candidate.skills) if candidate.skills else []
        except:
            skills = []

        tips = gemini.get_profile_improvement_tips(
            current_skills=skills,
            experience_years=candidate.experience_years or 0,
            current_title=candidate.title or "Professional",
            job_market_focus="tech"  # Can be parameterized
        )
        return {"improvements": tips}
    except Exception as e:
        logger.error(f"Error getting improvement tips: {e}")
        return {"improvements": "Improvement tips not available"}


@router.post("/me/chat")
def chat_with_gemini(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Chat with Gemini career advisor."""
    try:
        logger.info(f"💬 Chat request from user {current_user.id}: '{request.message[:50]}'")
        
        from ..services.gemini_service import get_gemini_service
        gemini = get_gemini_service()
        
        # Verify Gemini is enabled
        if not gemini.enabled:
            logger.warning(f"⚠️ Gemini not enabled for user {current_user.id}")
            return {
                "response": "AI features are currently unavailable. Please check your Gemini API key configuration."
            }
        
        # Call Gemini service with optional context
        response = gemini.chat(request.message, request.history, context=getattr(request, 'context', None))

        if not response or not response.strip():
            logger.warning(f"⚠️ Empty response from Gemini for user {current_user.id}")
            return {
                "response": "I couldn't generate a response. Please try again."
            }
        
        logger.info(f"✅ Chat response sent to user {current_user.id}")
        return {"response": response}
        
    except Exception as e:
        logger.error(f"❌ Error in chat endpoint: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "response": "An error occurred while processing your message. Please try again."
        }


@router.post("/me/button-context")
def get_button_context(
    button_request: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get orchestrated context for a button click in JobPortal.
    
    Combines ML model insights + Gemini LLM for intelligent analysis.
    Used when user clicks: Match Details, Interview Tips, Tailor Resume, Help Stand Out
    """
    try:
        button_type = button_request.get('button_type', 'match_details')
        job_id = button_request.get('job_id')
        
        if not job_id:
            raise HTTPException(status_code=400, detail="job_id is required")
        
        # Get candidate and job
        candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate profile not found")
        
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get orchestrator
        from ..services.orchestrator_service import get_orchestrator
        orchestrator = get_orchestrator(ai_service)
        
        # Prepare candidate data
        candidate_data = {
            "id": candidate.id,
            "title": candidate.title or "",
            "skills": [],
            "experience_years": candidate.experience_years or 0,
            "education": candidate.education or "",
            "years_of_experience": candidate.experience_years or 0,
        }
        
        # Parse skills
        try:
            skills_json = json.loads(candidate.skills) if candidate.skills else []
            candidate_data["skills"] = skills_json if isinstance(skills_json, list) else []
        except:
            candidate_data["skills"] = []
        
        # Prepare job data
        job_data = {
            "id": job.id,
            "job_id": job.id,
            "title": job.title,
            "description": job.description or "",
            "requirements": [],
            "company": getattr(job, 'company', 'Unknown Company')
        }
        
        # Parse requirements
        try:
            reqs_json = json.loads(job.requirements) if job.requirements else []
            job_data["requirements"] = reqs_json if isinstance(reqs_json, list) else []
        except:
            job_data["requirements"] = []
        
        # Get ML insights if available
        ml_insights = {}
        if candidate.embedding and job.embedding:
            try:
                candidate_emb = json.loads(candidate.embedding)
                job_emb = json.loads(job.embedding)
                from ..services.matching_engine import MatchingEngine
                engine = MatchingEngine()
                match_score = engine.calculate_similarity(candidate_emb, job_emb)
                ml_insights['match_score'] = match_score
            except:
                ml_insights['match_score'] = 0.0
        
        # Get orchestrated context
        context = orchestrator.analyze_button_context(
            button_type=button_type,
            job_data=job_data,
            candidate_data=candidate_data,
            ml_insights=ml_insights
        )
        
        logger.info(f"✅ Button context generated for {button_type} on job {job_id}")
        return context
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating button context: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            "button_type": "error",
            "context": "Unable to generate context. Please try again.",
            "query": "",
            "error": str(e)
        }
