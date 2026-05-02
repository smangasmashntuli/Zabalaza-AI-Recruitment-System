from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class WorkExperience(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    location: Optional[str] = None
    startDate: str
    endDate: Optional[str] = None
    current: bool = False
    description: Optional[str] = None


class Education(BaseModel):
    id: Optional[str] = None
    degree: str
    school: str
    field: Optional[str] = None
    startDate: str
    endDate: Optional[str] = None
    current: bool = False


class Certification(BaseModel):
    id: Optional[str] = None
    name: str
    issuer: str
    date: Optional[str] = None


class CandidateBase(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[float] = None


class CandidateCreate(CandidateBase):
    user_id: int


class CandidateUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[float] = None
    education: Optional[List[Education]] = None
    work_experience: Optional[List[WorkExperience]] = None
    certifications: Optional[List[Certification]] = None


class CandidateInDBBase(CandidateBase):
    id: int
    user_id: int
    resume_path: Optional[str] = None
    resume_text: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    work_experience: Optional[str] = None
    profile_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Candidate(CandidateInDBBase):
    # Additional fields for frontend
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None

    # These will be parsed from JSON strings
    skills_list: Optional[List[str]] = None
    education_list: Optional[List[Education]] = None
    work_experience_list: Optional[List[WorkExperience]] = None
    certifications: Optional[List[Certification]] = None


class ApplicationBase(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    cover_letter: Optional[str] = None


class ApplicationInDBBase(ApplicationBase):
    id: int
    candidate_id: int
    status: str
    match_score: Optional[float] = None
    match_explanation: Optional[str] = None
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Application(ApplicationInDBBase):
    pass


class JobMatch(BaseModel):
    job_id: int
    job_title: str
    match_score: float
    match_explanation: str
    job_details: Optional[Dict[str, Any]] = None
    skill_gaps: Optional[List[str]] = None  # Skills candidate lacks but job requires
    strengths: Optional[List[str]] = None   # Matching strengths


class MatchesResponse(BaseModel):
    items: List[JobMatch]
    insights: Optional[str] = None
    career_path: Optional[str] = None  # Career development suggestions


class CareerPathResponse(BaseModel):
    career_path: str
    learning_recommendations: Optional[List[str]] = None
    next_roles: Optional[List[str]] = None


