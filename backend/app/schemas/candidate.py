from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class CandidateBase(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[float] = None


class CandidateCreate(CandidateBase):
    user_id: int


class CandidateUpdate(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[float] = None
    education: Optional[str] = None
    work_experience: Optional[str] = None


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
    pass


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

