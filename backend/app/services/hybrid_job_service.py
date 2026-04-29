"""Hybrid job search service.

This service merges internal jobs and external jobs into one ranked list.
External sources are optional and degrade gracefully if API keys are missing
or an upstream request fails.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode
from urllib.request import urlopen, Request

from sqlalchemy.orm import Session

from ..config import settings
from ..models import Application, Job, JobStatus


@dataclass
class _RankedJob:
    job: Dict[str, Any]
    score: float
    source: str = "internal"


class HybridJobService:
    """Hybrid job search across internal DB and optional external sources."""

    def __init__(self, db: Session):
        self.db = db

    def search_jobs(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        remote_only: bool = False,
        salary_min: Optional[float] = None,
        salary_max: Optional[float] = None,
        page: int = 1,
        limit: int = 20,
        include_external: bool = True,
        candidate_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Return a unified job search result set.

        The current implementation prioritizes internal jobs and keeps the
        shape easy for the frontend to consume. External sources can be added
        later without changing the endpoint contract.
        """

        internal_ranked = self._fetch_internal_jobs(
            query=query,
            location=location,
            job_type=job_type,
            experience_level=experience_level,
            remote_only=remote_only,
            salary_min=salary_min,
            salary_max=salary_max,
        )

        external_ranked: List[_RankedJob] = []
        source_status: Dict[str, Any] = {
            "internal": {"enabled": True, "count": len(internal_ranked)},
            "adzuna": {"enabled": self._is_adzuna_enabled(include_external), "count": 0, "error": None},
            "usajobs": {"enabled": self._is_usajobs_enabled(include_external), "count": 0, "error": None},
        }

        if include_external and self._is_adzuna_enabled(include_external):
            try:
                adzuna_jobs = self._fetch_adzuna_jobs(
                    query=query,
                    location=location,
                    job_type=job_type,
                    salary_min=salary_min,
                    salary_max=salary_max,
                    page=page,
                    limit=min(limit, settings.EXTERNAL_JOB_LIMIT),
                )
                for job in adzuna_jobs:
                    score = self._score_external_job(job, query=query, location=location, job_type=job_type)
                    external_ranked.append(_RankedJob(job=job, score=score, source="adzuna"))
                source_status["adzuna"]["count"] = len(external_ranked)
            except Exception as exc:  # pragma: no cover - defensive fallback
                source_status["adzuna"]["error"] = str(exc)

        # USAJobs integration
        if include_external and self._is_usajobs_enabled(include_external):
            try:
                usajobs_jobs = self._fetch_usajobs_jobs(
                    query=query,
                    location=location,
                    job_type=job_type,
                    salary_min=salary_min,
                    salary_max=salary_max,
                    page=page,
                    limit=min(limit, settings.EXTERNAL_JOB_LIMIT),
                )
                for job in usajobs_jobs:
                    score = self._score_external_job(job, query=query, location=location, job_type=job_type)
                    external_ranked.append(_RankedJob(job=job, score=score, source="usajobs"))
                source_status["usajobs"]["count"] = len([j for j in external_ranked if j.source == 'usajobs'])
            except Exception as exc:  # pragma: no cover - defensive fallback
                source_status["usajobs"]["error"] = str(exc)

        combined = [*internal_ranked, *external_ranked]
        combined.sort(key=lambda item: item.score, reverse=True)

        start = max(page - 1, 0) * limit
        end = start + limit
        paginated = combined[start:end]

        jobs_payload = []
        for item in paginated:
            payload = dict(item.job)
            payload["score"] = round(item.score, 4)
            payload["source"] = item.source
            jobs_payload.append(payload)

        return {
            "items": jobs_payload,
            "page": page,
            "limit": limit,
            "total": len(combined),
            "external_included": bool(include_external),
            "candidate_id": candidate_id,
            "sources": source_status,
        }

    def get_job_detail(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed job information for internal jobs.

        Supports job IDs like "internal_123" and plain numeric IDs.
        External job IDs currently return None until an adapter is added.
        """

        if job_id.startswith("adzuna_"):
            return None

        internal_id = self._extract_internal_id(job_id)
        if internal_id is None:
            return None

        job = self.db.query(Job).filter(Job.id == internal_id).first()
        if not job:
            return None

        return self._serialize_internal_job(job, score=1.0, source="internal", include_applications=True)

    def get_job_statistics(self) -> Dict[str, Any]:
        """Return basic market statistics based on internal data."""

        total_jobs = self.db.query(Job).count()
        active_jobs = self.db.query(Job).filter(Job.status == JobStatus.ACTIVE).count()
        draft_jobs = self.db.query(Job).filter(Job.status == JobStatus.DRAFT).count()
        closed_jobs = self.db.query(Job).filter(Job.status == JobStatus.CLOSED).count()
        application_count = self.db.query(Application).count()

        adzuna_enabled = bool(settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY)
        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "draft_jobs": draft_jobs,
            "closed_jobs": closed_jobs,
            "applications": application_count,
            "external_sources_enabled": 1 if adzuna_enabled else 0,
            "internal_only": not adzuna_enabled,
        }

    def _fetch_internal_jobs(
        self,
        query: Optional[str],
        location: Optional[str],
        job_type: Optional[str],
        experience_level: Optional[str],
        remote_only: bool,
        salary_min: Optional[float],
        salary_max: Optional[float],
    ) -> List[_RankedJob]:
        internal_jobs = self.db.query(Job).all()
        ranked_jobs: List[_RankedJob] = []
        for job in internal_jobs:
            score = self._score_job(
                job=job,
                query=query,
                location=location,
                job_type=job_type,
                experience_level=experience_level,
                remote_only=remote_only,
                salary_min=salary_min,
                salary_max=salary_max,
            )
            score *= settings.INTERNAL_JOB_WEIGHT
            payload = self._serialize_internal_job(job, score=score, source="internal")
            ranked_jobs.append(_RankedJob(job=payload, score=score, source="internal"))
        return ranked_jobs

    def _is_adzuna_enabled(self, include_external: bool) -> bool:
        if not include_external:
            return False
        if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
            return False
        enabled_sources = {item.strip().lower() for item in settings.ENABLED_JOB_SOURCES.split(",") if item.strip()}
        return "adzuna" in enabled_sources or not enabled_sources

    def _is_usajobs_enabled(self, include_external: bool) -> bool:
        if not include_external:
            return False
        if not settings.USAJOBS_API_KEY:
            return False
        enabled_sources = {item.strip().lower() for item in settings.ENABLED_JOB_SOURCES.split(",") if item.strip()}
        return "usajobs" in enabled_sources or not enabled_sources

    def _fetch_adzuna_jobs(
        self,
        query: Optional[str],
        location: Optional[str],
        job_type: Optional[str],
        salary_min: Optional[float],
        salary_max: Optional[float],
        page: int,
        limit: int,
    ) -> List[Dict[str, Any]]:
        base_url = f"https://api.adzuna.com/v1/api/jobs/{settings.ADZUNA_COUNTRY}/search/{page}"
        params: Dict[str, Any] = {
            "app_id": settings.ADZUNA_APP_ID,
            "app_key": settings.ADZUNA_APP_KEY,
            "results_per_page": max(1, min(limit, settings.EXTERNAL_JOB_LIMIT)),
            "content-type": "application/json",
            "sort_by": "date",
        }

        if query:
            params["what"] = query
        if location:
            params["where"] = location
        if salary_min is not None:
            params["salary_min"] = int(salary_min)
        if salary_max is not None:
            params["salary_max"] = int(salary_max)

        normalized_job_type = (job_type or "").strip().lower()
        if normalized_job_type == "full-time":
            params["full_time"] = 1
        elif normalized_job_type == "part-time":
            params["full_time"] = 0
        elif normalized_job_type == "contract":
            params["contract"] = 1

        url = f"{base_url}?{urlencode(params)}"
        with urlopen(url, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))

        results = payload.get("results", []) if isinstance(payload, dict) else []
        return [self._normalize_adzuna_job(item) for item in results]

    def _fetch_usajobs_jobs(
        self,
        query: Optional[str],
        location: Optional[str],
        job_type: Optional[str],
        salary_min: Optional[float],
        salary_max: Optional[float],
        page: int,
        limit: int,
    ) -> List[Dict[str, Any]]:
        """Fetch jobs from USAJobs API and normalize results.

        This implementation is defensive: USAJobs responses vary, so we
        extract common fields when present.
        """
        base_url = "https://data.usajobs.gov/api/search"
        params: Dict[str, Any] = {
            "ResultsPerPage": max(1, min(limit, settings.EXTERNAL_JOB_LIMIT)),
            "Page": max(1, page),
        }

        if query:
            params["Keyword"] = query
        if location:
            params["LocationName"] = location

        url = f"{base_url}?{urlencode(params)}"

        headers = {
            # USAJobs requires a contact User-Agent (email) and API key header
            "User-Agent": settings.USAJOBS_USER_EMAIL or "no-reply@example.com",
            "Authorization-Key": settings.USAJOBS_API_KEY,
        }

        req = Request(url, headers=headers)
        with urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))

        items = []
        # The USAJobs API wraps results in SearchResult > SearchResultItems
        search_result = payload.get("SearchResult") if isinstance(payload, dict) else None
        results = []
        if isinstance(search_result, dict):
            results = search_result.get("SearchResultItems", []) or []

        for item in results:
            try:
                norm = self._normalize_usajobs_job(item)
                items.append(norm)
            except Exception:
                # Skip malformed entries
                continue

        return items

    def _normalize_usajobs_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        # raw is expected to be an object with 'MatchedObjectDescriptor' inside
        descriptor = raw.get("MatchedObjectDescriptor") if isinstance(raw, dict) else {}

        usajobs_id = descriptor.get("PositionID") or descriptor.get("MatchedObjectId") or descriptor.get("PositionURI") or "unknown"

        # Title/company
        title = descriptor.get("PositionTitle") or "Untitled role"
        company = descriptor.get("OrganizationName") or "US Government"

        # Description: try common locations in the payload
        description = descriptor.get("UserArea", {}).get("Details", {}).get("JobSummary") or descriptor.get("PositionURI") or "No description provided."

        # Locations
        locations = descriptor.get("PositionLocation", []) or []
        if isinstance(locations, list) and len(locations) > 0:
            location_name = locations[0].get("LocationName") or locations[0].get("Location", "")
        else:
            location_name = "Remote"

        # Salary (USAJobs may provide PositionRemuneration list)
        salary_min = None
        salary_max = None
        remuneration = descriptor.get("PositionRemuneration") or []
        if isinstance(remuneration, list) and remuneration:
            try:
                rem = remuneration[0]
                min_range = rem.get("MinimumRange")
                max_range = rem.get("MaximumRange")
                if min_range is not None:
                    salary_min = float(min_range)
                if max_range is not None:
                    salary_max = float(max_range)
            except Exception:
                salary_min = None
                salary_max = None

        # Apply url
        apply_url = None
        apply_uris = descriptor.get("ApplyURI") or []
        if isinstance(apply_uris, list) and apply_uris:
            apply_url = apply_uris[0]
        else:
            apply_url = descriptor.get("PositionURI")

        published_iso = self._normalize_timestamp(descriptor.get("PublicationStartDate") or descriptor.get("PositionStartDate"))

        return {
            "id": f"usajobs_{usajobs_id}",
            "job_id": None,
            "source": "usajobs",
            "title": title,
            "company": company,
            "description": description,
            "requirements": description,
            "location": location_name,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "job_type": None,
            "experience_level": None,
            "status": "active",
            "recruiter_id": None,
            "created_at": published_iso,
            "updated_at": published_iso,
            "apply_url": apply_url,
            "external": True,
            "can_apply_internal": False,
        }

    def _normalize_adzuna_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        adzuna_id = str(raw.get("id") or raw.get("adref") or raw.get("redirect_url") or "unknown")
        salary_min = raw.get("salary_min")
        salary_max = raw.get("salary_max")
        location_obj = raw.get("location") or {}
        company_obj = raw.get("company") or {}

        published_iso = self._normalize_timestamp(raw.get("created"))
        job_type = "Full-time"
        contract_time = (raw.get("contract_time") or "").strip()
        contract_type = (raw.get("contract_type") or "").strip()
        if contract_time:
            job_type = contract_time.replace("_", " ").title()
        elif contract_type:
            job_type = contract_type.replace("_", " ").title()

        return {
            "id": f"adzuna_{adzuna_id}",
            "job_id": None,
            "source": "adzuna",
            "title": raw.get("title") or "Untitled role",
            "company": company_obj.get("display_name") or "External Company",
            "description": raw.get("description") or "No description provided.",
            "requirements": raw.get("description") or "No requirements provided.",
            "location": location_obj.get("display_name") or raw.get("location", {}).get("area", [None])[0] or "Remote",
            "salary_min": salary_min,
            "salary_max": salary_max,
            "job_type": job_type,
            "experience_level": None,
            "status": "active",
            "recruiter_id": None,
            "created_at": published_iso,
            "updated_at": published_iso,
            "apply_url": raw.get("redirect_url"),
            "external": True,
            "can_apply_internal": False,
        }

    def _score_external_job(
        self,
        job: Dict[str, Any],
        query: Optional[str],
        location: Optional[str],
        job_type: Optional[str],
    ) -> float:
        score = 1.0
        if query:
            haystack = " ".join([
                str(job.get("title") or ""),
                str(job.get("description") or ""),
                str(job.get("company") or ""),
            ]).lower()
            for token in query.lower().split():
                if token in haystack:
                    score += 0.5

        if location and job.get("location"):
            if location.lower() in str(job["location"]).lower():
                score += 0.5

        if job_type and job.get("job_type"):
            if job_type.lower() in str(job["job_type"]).lower():
                score += 0.3

        return score

    def _score_job(
        self,
        job: Job,
        query: Optional[str],
        location: Optional[str],
        job_type: Optional[str],
        experience_level: Optional[str],
        remote_only: bool,
        salary_min: Optional[float],
        salary_max: Optional[float],
    ) -> float:
        score = 0.0

        if job.status == JobStatus.ACTIVE:
            score += 2.0
        elif job.status == JobStatus.DRAFT:
            score += 0.25

        if query:
            haystack = " ".join(
                filter(
                    None,
                    [job.title, job.description, job.requirements, job.location, job.job_type, job.experience_level],
                )
            ).lower()
            for term in query.lower().split():
                if term in haystack:
                    score += 1.0

        if location and job.location:
            if location.lower() in job.location.lower():
                score += 1.0

        if job_type and job.job_type:
            if job_type.lower() == job.job_type.lower():
                score += 0.75

        if experience_level and job.experience_level:
            if experience_level.lower() == job.experience_level.lower():
                score += 0.75

        if remote_only and job.location:
            if "remote" in job.location.lower():
                score += 0.5
            else:
                score -= 1.0

        if salary_min is not None:
            if job.salary_max is not None and job.salary_max >= salary_min:
                score += 0.5
            elif job.salary_min is not None and job.salary_min >= salary_min:
                score += 0.5

        if salary_max is not None:
            if job.salary_min is not None and job.salary_min <= salary_max:
                score += 0.5
            elif job.salary_max is not None and job.salary_max <= salary_max:
                score += 0.5

        return score

    def _serialize_internal_job(
        self,
        job: Job,
        score: float,
        source: str,
        include_applications: bool = False,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "id": f"internal_{job.id}",
            "job_id": job.id,
            "source": source,
            "score": round(score, 4),
            "title": job.title,
            "company": job.recruiter.full_name if job.recruiter else "Company",
            "description": job.description,
            "requirements": job.requirements,
            "location": job.location,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "job_type": job.job_type,
            "experience_level": job.experience_level,
            "status": job.status.value if hasattr(job.status, "value") else str(job.status),
            "recruiter_id": job.recruiter_id,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None,
            "apply_url": None,
            "external": False,
            "can_apply_internal": True,
        }

        if include_applications:
            payload["application_count"] = len(job.applications)

        return payload

    @staticmethod
    def _extract_internal_id(job_id: str) -> Optional[int]:
        if not job_id:
            return None
        if job_id.startswith("internal_"):
            job_id = job_id.split("internal_", 1)[1]
        try:
            return int(job_id)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _normalize_timestamp(raw_value: Optional[str]) -> str:
        if not raw_value:
            return datetime.now(timezone.utc).isoformat()
        cleaned = str(raw_value).replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(cleaned).isoformat()
        except ValueError:
            return datetime.now(timezone.utc).isoformat()

