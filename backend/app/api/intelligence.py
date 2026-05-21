from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.dependencies import get_current_active_user, get_db
from ..models import Candidate, User
from ..services.hybrid_job_service import HybridJobService

router = APIRouter(prefix="/intelligence", tags=["intelligence"])
logger = logging.getLogger(__name__)


def _safe_json_list(value: Any) -> list:
    try:
        if value is None:
            return []
        if isinstance(value, list):
            return value
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


@router.get("/discover")
def get_discover_intelligence(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return CV-grounded discovery data for the dashboard discover tab.

    This combines live internal/external job market signals, profile-derived
    career intelligence, and optional AI commentary.
    """
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    skills = _safe_json_list(candidate.skills)
    work_experience = _safe_json_list(candidate.work_experience)
    education = _safe_json_list(candidate.education)
    projects = _safe_json_list(candidate.projects)
    languages = _safe_json_list(candidate.languages)

    candidate_data = {
        "title": candidate.title or current_user.full_name or current_user.username,
        "skills": skills,
        "years_of_experience": candidate.experience_years or 0,
        "education": education,
        "work_experience": work_experience,
        "projects": projects,
        "languages": languages,
        "profile_summary": candidate.profile_summary or candidate.bio or "",
    }

    market_stats: Dict[str, Any] = {}
    active_jobs = []
    try:
        hybrid_service = HybridJobService(db)
        market_stats = hybrid_service.get_job_statistics()
    except Exception as exc:
        logger.warning("Could not load market stats: %s", exc)

    # Live job list for insight aggregation
    try:
        from ..models import Job, JobStatus
        active_jobs = db.query(Job).filter(Job.status == JobStatus.ACTIVE).all()
    except Exception:
        active_jobs = []

    def _pick_domain(skills_list, title_text):
        joined = " ".join(skills_list).lower() + f" {title_text or ''}".lower()
        if any(token in joined for token in ["react", "vue", "angular", "frontend", "ui", "ux"]):
            return "frontend"
        if any(token in joined for token in ["node", "django", "flask", "fastapi", "backend", "api", "python", "java"]):
            return "backend"
        if any(token in joined for token in ["data", "analytics", "sql", "power bi", "tableau", "pandas", "numpy"]):
            return "data"
        if any(token in joined for token in ["devops", "docker", "kubernetes", "terraform", "ci/cd", "aws", "azure", "gcp"]):
            return "devops"
        if any(token in joined for token in ["product", "project", "scrum", "agile"]):
            return "product"
        return "software"

    def _next_roles_for(domain, years):
        if domain == "frontend":
            return ["Frontend Developer", "UI Engineer", "Senior Frontend Developer"] if years < 5 else ["Lead Frontend Engineer", "Product Engineer", "Engineering Lead"]
        if domain == "backend":
            return ["Backend Developer", "Full Stack Developer", "Software Engineer"] if years < 5 else ["Senior Backend Engineer", "Platform Engineer", "Tech Lead"]
        if domain == "data":
            return ["Data Analyst", "BI Analyst", "Data Engineer"] if years < 5 else ["Senior Data Analyst", "Analytics Engineer", "Data Lead"]
        if domain == "devops":
            return ["DevOps Engineer", "Cloud Engineer", "Platform Engineer"] if years < 5 else ["Senior DevOps Engineer", "SRE Engineer", "Infrastructure Lead"]
        if domain == "product":
            return ["Project Coordinator", "Product Analyst", "Product Manager"] if years < 5 else ["Senior Product Manager", "Program Manager", "Delivery Lead"]
        return ["Software Engineer", "Full Stack Developer", "Technical Specialist"] if years < 5 else ["Senior Software Engineer", "Solutions Architect", "Engineering Lead"]

    def _trending_skills_for(domain):
        base = ["System Design", "AI Integration", "Cloud Fundamentals", "GitHub Actions", "Security Basics"]
        domain_map = {
            "frontend": ["TypeScript", "Next.js", "Testing Library", "Accessibility"],
            "backend": ["PostgreSQL", "Docker", "API Design", "Microservices"],
            "data": ["SQL Optimization", "dbt", "Power BI", "Prompt Engineering"],
            "devops": ["Kubernetes", "Terraform", "Observability", "SRE Practices"],
            "product": ["Roadmapping", "Stakeholder Management", "Analytics", "A/B Testing"],
            "software": ["TypeScript", "Cloud Deployment", "Testing", "AI-assisted Development"],
        }
        return base + domain_map.get(domain, domain_map["software"])

    def _safe_json(value):
        if value is None:
            return []
        if isinstance(value, list):
            return value
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []

    job_skills = []
    companies = []
    for job in active_jobs:
        if getattr(job, "company", None):
            companies.append(job.company)
        job_skills.extend(_safe_json(job.skills))
        job_skills.extend(_safe_json(job.requirements))

    domain = _pick_domain(skills, candidate_data["title"])
    next_roles = _next_roles_for(domain, candidate_data["years_of_experience"])
    trending_skills = []
    candidate_skill_set = {str(skill).lower() for skill in skills}
    for skill in _trending_skills_for(domain) + [str(skill) for skill in job_skills if skill]:
        if skill and skill.lower() not in candidate_skill_set and skill not in trending_skills:
            trending_skills.append(skill)
        if len(trending_skills) >= 8:
            break

    if not trending_skills:
        trending_skills = _trending_skills_for(domain)[:5]

    top_companies = []
    for company in companies:
        if company and company not in top_companies:
            top_companies.append(company)
        if len(top_companies) >= 6:
            break

    if not top_companies:
        top_companies = ["Top local employers will appear as jobs are added"]

    missing_profile_points = []
    if not skills:
        missing_profile_points.append("Add more skills from your CV and LinkedIn profile.")
    if not work_experience:
        missing_profile_points.append("Add work experience so we can map seniority and role fit.")
    if not projects:
        missing_profile_points.append("Add projects to demonstrate practical experience.")
    if not education:
        missing_profile_points.append("Add education details to strengthen qualification matching.")

    profile_gap_text = missing_profile_points or ["Your profile looks balanced. Keep it updated with new projects and achievements."]

    job_recommendation_titles = []
    for job in active_jobs[:5]:
        if getattr(job, "title", None):
            job_recommendation_titles.append(job.title)

    discover_insights = {
        "career_path": {
            "title": "Your Career Path",
            "current_role": candidate_data["title"],
            "next_roles": next_roles,
            "timeline": "12-24 months between progression",
            "key_skills_needed": trending_skills[:5],
        },
        "job_suggestions": {
            "title": "Jobs for You",
            "description": "Live job matches from your current profile and market signals.",
            "query_for_gemini": f"Target roles such as {', '.join(next_roles[:3])} based on your profile.",
            "jobs": job_recommendation_titles,
        },
        "high_paying_paths": {
            "title": "Highest Earning Paths",
            "description": "Career paths with higher earning potential for your current background.",
            "query_for_gemini": f"Based on {candidate_data['title']} and {candidate_data['years_of_experience']} years of experience, suggest high-paying paths.",
        },
        "trending_skills": {
            "title": "Trending Skills (2026)",
            "description": "Most in-demand skills in your field right now",
            "skills": trending_skills,
        },
        "cv_improvements": {
            "title": "Improve Your Profile",
            "description": "AI-generated profile optimization suggestions",
            "tips": profile_gap_text,
        },
        "industry_trends": {
            "title": "Industry Trends",
            "description": "Live market signals based on the jobs currently in the system.",
            "highlights": [
                f"{market_stats.get('active_jobs', 0)} active jobs in the platform",
                f"{market_stats.get('total_jobs', 0)} total jobs tracked",
                f"{len(top_companies)} companies appearing in live jobs",
            ],
        },
        "top_companies": top_companies,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    news_key = None
    try:
        from ..config import settings
        news_key = getattr(settings, "NEWSAPI_KEY", "")
    except Exception:
        news_key = None

    news_items = []
    if news_key:
        # Optional NewsAPI hook. Keep it best-effort so the app still works without a news key.
        try:
            import urllib.parse
            import urllib.request

            topic = (candidate.title or "technology").split()[0].lower()
            url = "https://newsapi.org/v2/everything?" + urllib.parse.urlencode(
                {
                    "q": topic,
                    "language": "en",
                    "pageSize": 5,
                    "sortBy": "publishedAt",
                    "apiKey": news_key,
                }
            )
            with urllib.request.urlopen(url, timeout=8) as response:
                payload = json.loads(response.read().decode("utf-8", errors="ignore"))
                for article in payload.get("articles", [])[:5]:
                    news_items.append(
                        {
                            "title": article.get("title"),
                            "source": article.get("source", {}).get("name"),
                            "url": article.get("url"),
                            "published_at": article.get("publishedAt"),
                        }
                    )
        except Exception as exc:
            logger.warning("News fetch failed: %s", exc)

    return {
        "candidate": {
            "title": candidate_data["title"],
            "skills": skills,
            "years_of_experience": candidate_data["years_of_experience"],
        },
        "market_stats": market_stats,
        "discover": discover_insights,
        "news": news_items,
        "news_supported": bool(news_key),
        "news_note": (
            "Live news requires a NewsAPI key or another news provider API."
            if not news_key
            else "Live news feed enabled."
        ),
    }




