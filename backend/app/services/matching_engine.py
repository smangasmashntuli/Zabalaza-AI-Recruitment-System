import json
import re
from typing import Dict, List, Set, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from ..config import settings


class MatchingEngine:
    """Hybrid job matching using semantic similarity plus structured profile scoring."""

    def __init__(self):
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.degree_keywords = {
            "phd": {"phd", "doctorate"},
            "masters": {"master", "mba", "msc", "m.s.", "m.a."},
            "bachelors": {"bachelor", "bsc", "b.s.", "b.a.", "bcom"},
            "diploma": {"diploma", "associate"},
        }

    def generate_embedding(self, text: str) -> List[float]:
        embedding = self.model.encode(text)
        return embedding.tolist()

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        emb1 = np.array(embedding1).reshape(1, -1)
        emb2 = np.array(embedding2).reshape(1, -1)
        return float(cosine_similarity(emb1, emb2)[0][0])

    def create_job_embedding_text(self, job: Dict) -> str:
        text_parts = [
            f"Job Title: {job.get('title', '')}",
            f"Description: {job.get('description', '')}",
            f"Requirements: {job.get('requirements', '')}",
            f"Experience Level: {job.get('experience_level', '')}",
            f"Location: {job.get('location', '')}",
        ]
        if job.get("skills"):
            skills = job["skills"] if isinstance(job["skills"], str) else json.dumps(job["skills"])
            text_parts.append(f"Required Skills: {skills}")
        return " | ".join(text_parts)

    def create_candidate_embedding_text(self, candidate: Dict) -> str:
        text_parts = []
        if candidate.get("resume_text"):
            text_parts.append(candidate["resume_text"][:1200])
        if candidate.get("skills"):
            skills = candidate["skills"] if isinstance(candidate["skills"], str) else json.dumps(candidate["skills"])
            text_parts.append(f"Skills: {skills}")
        if candidate.get("experience_years") is not None:
            text_parts.append(f"Experience: {candidate['experience_years']} years")
        if candidate.get("education"):
            education = candidate["education"] if isinstance(candidate["education"], str) else json.dumps(candidate["education"])
            text_parts.append(f"Education: {education}")
        if candidate.get("work_experience"):
            work_exp = candidate["work_experience"] if isinstance(candidate["work_experience"], str) else json.dumps(candidate["work_experience"])
            text_parts.append(f"Work Experience: {work_exp}")
        return " | ".join(text_parts)

    def _normalize_list(self, value) -> List:
        if not value:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        return []

    def _extract_candidate_skills(self, candidate_data: Dict) -> Set[str]:
        skills = self._normalize_list(candidate_data.get("skills"))
        return {str(skill).strip().lower() for skill in skills if str(skill).strip()}

    def _extract_job_skills(self, job_data: Dict) -> Set[str]:
        skills = self._normalize_list(job_data.get("skills"))
        if skills:
            return {str(skill).strip().lower() for skill in skills if str(skill).strip()}

        combined_text = f"{job_data.get('title', '')} {job_data.get('requirements', '')} {job_data.get('description', '')}".lower()
        inferred = set()
        for candidate_skill in self._extract_candidate_skills({"skills": settings.__dict__.get("skill_keywords", [])}):
            if candidate_skill in combined_text:
                inferred.add(candidate_skill)
        return inferred

    def _extract_highest_degree_rank(self, candidate_data: Dict) -> int:
        education_entries = self._normalize_list(candidate_data.get("education"))
        highest = 0
        for entry in education_entries:
            text = json.dumps(entry).lower() if isinstance(entry, dict) else str(entry).lower()
            if any(keyword in text for keyword in self.degree_keywords["phd"]):
                highest = max(highest, 4)
            elif any(keyword in text for keyword in self.degree_keywords["masters"]):
                highest = max(highest, 3)
            elif any(keyword in text for keyword in self.degree_keywords["bachelors"]):
                highest = max(highest, 2)
            elif any(keyword in text for keyword in self.degree_keywords["diploma"]):
                highest = max(highest, 1)
        return highest

    def _extract_required_degree_rank(self, job_data: Dict) -> int:
        text = f"{job_data.get('requirements', '')} {job_data.get('description', '')}".lower()
        if any(keyword in text for keyword in self.degree_keywords["phd"]):
            return 4
        if any(keyword in text for keyword in self.degree_keywords["masters"]):
            return 3
        if any(keyword in text for keyword in self.degree_keywords["bachelors"]):
            return 2
        if any(keyword in text for keyword in self.degree_keywords["diploma"]):
            return 1
        return 0

    def _score_experience(self, candidate_data: Dict, job_data: Dict) -> Tuple[float, str]:
        candidate_exp = float(candidate_data.get("experience_years") or 0)
        job_exp_level = str(job_data.get("experience_level") or "").lower().strip()

        if not job_exp_level:
            return 0.6, "Experience requirement not specified"
        if job_exp_level == "entry":
            return (1.0, "Experience aligns with entry-level role") if candidate_exp <= 2 else (0.7, "More experienced than entry-level target")
        if job_exp_level == "mid":
            return (1.0, "Experience aligns with mid-level role") if 2 <= candidate_exp <= 6 else (0.55, "Experience partially aligns with mid-level role")
        if job_exp_level == "senior":
            return (1.0, "Experience aligns with senior role") if candidate_exp >= 5 else (0.3, "Experience below senior expectation")
        return 0.6, "Experience level could not be classified"

    def _score_skills(self, candidate_data: Dict, job_data: Dict) -> Tuple[float, str]:
        candidate_skills = self._extract_candidate_skills(candidate_data)
        job_skills = self._normalize_list(job_data.get("skills"))
        job_skill_set = {str(skill).strip().lower() for skill in job_skills if str(skill).strip()}

        if not job_skill_set:
            text = f"{job_data.get('title', '')} {job_data.get('requirements', '')} {job_data.get('description', '')}".lower()
            job_skill_set = {skill for skill in candidate_skills if skill in text}

        if not candidate_skills:
            return 0.0, "No candidate skills available yet"
        if not job_skill_set:
            return 0.5, "Job skills not explicitly listed"

        overlap = sorted(candidate_skills.intersection(job_skill_set))
        ratio = len(overlap) / max(len(job_skill_set), 1)
        explanation = f"Matching skills: {', '.join(overlap[:5])}" if overlap else "No direct skill overlap found"
        return ratio, explanation

    def _score_education(self, candidate_data: Dict, job_data: Dict) -> Tuple[float, str]:
        candidate_rank = self._extract_highest_degree_rank(candidate_data)
        required_rank = self._extract_required_degree_rank(job_data)

        if required_rank == 0:
            return 0.6, "Education requirement not specified"
        if candidate_rank >= required_rank:
            return 1.0, "Education meets stated requirement"
        if candidate_rank == 0:
            return 0.0, "No education information available"
        return 0.35, "Education appears below stated requirement"

    def _score_location(self, candidate_data: Dict, job_data: Dict) -> Tuple[float, str]:
        candidate_location = str(candidate_data.get("location") or "").strip().lower()
        job_location = str(job_data.get("location") or "").strip().lower()

        if not job_location or "remote" in job_location:
            return 1.0, "Location is remote-friendly"
        if not candidate_location:
            return 0.5, "Candidate location not available"
        if candidate_location in job_location or job_location in candidate_location:
            return 1.0, "Location aligns with job"
        return 0.4, "Location may require relocation"

    def match_candidate_to_job(
        self,
        candidate_embedding: List[float],
        job_embedding: List[float],
        candidate_data: Dict,
        job_data: Dict,
    ) -> Tuple[float, str]:
        semantic_score = self.calculate_similarity(candidate_embedding, job_embedding)
        skills_score, skills_reason = self._score_skills(candidate_data, job_data)
        experience_score, experience_reason = self._score_experience(candidate_data, job_data)
        education_score, education_reason = self._score_education(candidate_data, job_data)
        location_score, location_reason = self._score_location(candidate_data, job_data)

        final_score = (
            semantic_score * 0.40
            + skills_score * 0.25
            + experience_score * 0.20
            + education_score * 0.10
            + location_score * 0.05
        )

        explanation_parts = [
            f"Semantic fit: {semantic_score:.0%}",
            skills_reason,
            experience_reason,
            education_reason,
            location_reason,
        ]

        if final_score >= 0.8:
            explanation_parts.insert(0, "Excellent match")
        elif final_score >= 0.6:
            explanation_parts.insert(0, "Good match")
        elif final_score >= 0.4:
            explanation_parts.insert(0, "Moderate match")
        else:
            explanation_parts.insert(0, "Low match")

        return min(final_score, 1.0), ". ".join(part for part in explanation_parts if part)

    def find_best_matches(
        self,
        candidate_embedding: List[float],
        jobs: List[Dict],
        candidate_data: Dict,
        top_k: int = 10,
    ) -> List[Dict]:
        matches = []

        for job in jobs:
            if not job.get("embedding"):
                continue

            try:
                job_embedding = json.loads(job["embedding"])
                score, explanation = self.match_candidate_to_job(
                    candidate_embedding,
                    job_embedding,
                    candidate_data,
                    job,
                )
                if score >= settings.SIMILARITY_THRESHOLD:
                    matches.append({
                        "job_id": job["id"],
                        "job_title": job["title"],
                        "match_score": score,
                        "match_explanation": explanation,
                        "job_details": job,
                    })
            except Exception as exc:
                print(f"Error matching job {job.get('id')}: {exc}")

        matches.sort(key=lambda item: item["match_score"], reverse=True)
        return matches[:top_k]
