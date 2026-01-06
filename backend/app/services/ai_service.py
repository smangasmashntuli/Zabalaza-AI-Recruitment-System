from typing import Dict, List
from .resume_parser import ResumeParser
from .matching_engine import MatchingEngine


class AIService:
    """Central AI service that coordinates all AI/ML operations."""

    def __init__(self):
        self.resume_parser = ResumeParser()
        self.matching_engine = MatchingEngine()

    def parse_resume(self, file_content: bytes, file_type: str) -> Dict:
        """Parse resume using AI."""
        return self.resume_parser.parse(file_content, file_type)

    def generate_candidate_embedding(self, candidate_data: Dict) -> List[float]:
        """Generate embedding for candidate profile."""
        text = self.matching_engine.create_candidate_embedding_text(candidate_data)
        return self.matching_engine.generate_embedding(text)

    def generate_job_embedding(self, job_data: Dict) -> List[float]:
        """Generate embedding for job posting."""
        text = self.matching_engine.create_job_embedding_text(job_data)
        return self.matching_engine.generate_embedding(text)

    def match_candidate_to_job(
        self,
        candidate_embedding: List[float],
        job_embedding: List[float],
        candidate_data: Dict,
        job_data: Dict
    ) -> tuple:
        """Match a candidate to a specific job."""
        return self.matching_engine.match_candidate_to_job(
            candidate_embedding,
            job_embedding,
            candidate_data,
            job_data
        )

    def find_matching_jobs(
        self,
        candidate_embedding: List[float],
        jobs: List[Dict],
        candidate_data: Dict,
        top_k: int = 10
    ) -> List[Dict]:
        """Find best matching jobs for a candidate."""
        return self.matching_engine.find_best_matches(
            candidate_embedding,
            jobs,
            candidate_data,
            top_k
        )

    def generate_profile_summary(self, candidate_data: Dict) -> str:
        """Generate AI summary of candidate profile."""
        skills = candidate_data.get('skills', [])
        if isinstance(skills, str):
            import json
            try:
                skills = json.loads(skills)
            except:
                skills = []

        exp_years = candidate_data.get('experience_years', 0)
        education = candidate_data.get('education', [])

        summary_parts = []

        if exp_years > 0:
            if exp_years < 2:
                summary_parts.append(f"Entry-level professional with {exp_years} year(s) of experience")
            elif exp_years < 5:
                summary_parts.append(f"Mid-level professional with {exp_years} years of experience")
            else:
                summary_parts.append(f"Senior professional with {exp_years}+ years of experience")

        if skills:
            top_skills = skills[:5] if len(skills) > 5 else skills
            summary_parts.append(f"skilled in {', '.join(str(s) for s in top_skills)}")

        if education:
            summary_parts.append(f"with educational background in relevant fields")

        return ". ".join(summary_parts) + "." if summary_parts else "Professional seeking opportunities."


# Global AI service instance
ai_service = AIService()

