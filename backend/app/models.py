from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from .database import Base


def utc_now():
    """Get current UTC time."""
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    RECRUITER = "recruiter"
    CANDIDATE = "candidate"


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    ON_HOLD = "on_hold"


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    REJECTED = "rejected"
    ACCEPTED = "accepted"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.CANDIDATE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    jobs = relationship("Job", back_populates="recruiter")
    candidate_profile = relationship("Candidate", back_populates="user", uselist=False)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    location = Column(String(255))
    salary_min = Column(Float)
    salary_max = Column(Float)
    job_type = Column(String(50))  # full-time, part-time, contract, etc.
    experience_level = Column(String(50))  # entry, mid, senior
    status = Column(Enum(JobStatus), default=JobStatus.DRAFT)
    recruiter_id = Column(Integer, ForeignKey("users.id"))

    # AI/ML fields
    embedding = Column(Text)  # JSON string of job description embedding
    skills = Column(Text)  # JSON array of required skills

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    recruiter = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    # Personal Info
    phone = Column(String(20))
    location = Column(String(255))

    # Professional Info
    resume_path = Column(String(500))
    resume_text = Column(Text)
    skills = Column(Text)  # JSON array of skills
    experience_years = Column(Float)
    education = Column(Text)  # JSON array of education
    work_experience = Column(Text)  # JSON array of work experience

    # AI/ML fields
    embedding = Column(Text)  # JSON string of resume embedding
    profile_summary = Column(Text)  # AI-generated summary

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)

    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    cover_letter = Column(Text)

    # AI/ML fields
    match_score = Column(Float)  # AI-calculated match score (0-1)
    match_explanation = Column(Text)  # AI explanation of the match

    applied_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")

