from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..models import JobStatus


class JobBase(BaseModel):
    title: str
    description: str
    requirements: str
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    status: Optional[JobStatus] = None


class JobInDBBase(JobBase):
    id: int
    status: JobStatus
    recruiter_id: int
    skills: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Job(JobInDBBase):
    pass


class JobWithApplications(JobInDBBase):
    application_count: Optional[int] = None

