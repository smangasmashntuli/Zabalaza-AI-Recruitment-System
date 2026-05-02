from typing import Dict, List, Optional
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
        """
        Generate AI summary of candidate profile.
        Uses Gemini LLM if available, falls back to heuristic-based summary.
        """
        skills = candidate_data.get('skills', [])
        if isinstance(skills, str):
            import json
            try:
                skills = json.loads(skills)
            except:
                skills = []

        exp_years = candidate_data.get('experience_years', 0)
        education = candidate_data.get('education', [])

        # Heuristic-based summary (fallback)
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

        heuristic_summary = ". ".join(summary_parts) + "." if summary_parts else "Professional seeking opportunities."

        # Try to enhance with Gemini if available
        if self.gemini_service.enabled and skills:
            try:
                work_exp = candidate_data.get('work_experience', [])
                work_summary = "; ".join([str(e)[:50] for e in work_exp[:2]]) if isinstance(work_exp, list) else str(work_exp)[:100]
                
                from ..config import settings
                # Use Gemini to generate a more engaging summary
                prompt = f"""Create a 1-2 sentence professional summary for this candidate:

Experience: {exp_years} years
Top skills: {', '.join(skills[:8])}
Work background: {work_summary}
Education: {', '.join(education[:3]) if isinstance(education, list) else str(education)[:100]}

Generate a compelling, concise summary highlighting their unique value. Keep it under 50 words."""
                
                response = self.gemini_service.client.generate_content(prompt)
                enhanced_summary = response.text.strip()
                return enhanced_summary if enhanced_summary else heuristic_summary
            except Exception as e:
                # If Gemini fails, just use heuristic
                return heuristic_summary

        return heuristic_summary

    def generate_match_explanation(
        self,
        job_data: Dict,
        candidate_data: Dict,
        match_score: float
    ) -> str:
        """
        Generate LLM-powered explanation of why a job matches a candidate.
        
        Args:
            job_data: Job posting data
            candidate_data: Candidate profile data
            match_score: Similarity score (0-1)
            
        Returns:
            str: Human-friendly explanation
        """
        skills = candidate_data.get('skills', [])
        if isinstance(skills, str):
            import json
            try:
                skills = json.loads(skills)
            except:
                skills = []

        job_requirements = job_data.get('requirements_list', [])
        if isinstance(job_requirements, str):
            import json
            try:
                job_requirements = json.loads(job_requirements)
            except:
                job_requirements = []

        return self.gemini_service.generate_match_explanation(
            job_title=job_data.get('title', 'Position'),
            job_description=job_data.get('description', ''),
            job_requirements=job_requirements,
            candidate_summary=candidate_data.get('profile_summary', ''),
            candidate_skills=skills,
            candidate_experience_years=candidate_data.get('experience_years', 0),
            match_score=match_score
        )

    def generate_career_path(self, candidate_data: Dict, target_roles: Optional[List[str]] = None) -> str:
        """
        Generate career path + learning recommendations using Gemini.
        
        Args:
            candidate_data: Candidate profile data
            target_roles: Roles candidate is interested in (optional)
            
        Returns:
            str: Career path recommendation
        """
        skills = candidate_data.get('skills', [])
        if isinstance(skills, str):
            import json
            try:
                skills = json.loads(skills)
            except:
                skills = []

        return self.gemini_service.generate_career_path(
            candidate_summary=candidate_data.get('profile_summary', ''),
            current_skills=skills,
            experience_years=candidate_data.get('experience_years', 0),
            target_roles=target_roles
        )

    def reason_about_job_fit(
        self,
        job_data: Dict,
        candidate_data: Dict
    ) -> Dict:
        """
        Perform semantic reasoning about job fit using Gemini.
        
        Returns dict with: reasoning, skill_gaps, strengths, recommendation
        """
        skills = candidate_data.get('skills', [])
        if isinstance(skills, str):
            import json
            try:
                skills = json.loads(skills)
            except:
                skills = []

        job_requirements = job_data.get('requirements_list', [])
        if isinstance(job_requirements, str):
            import json
            try:
                job_requirements = json.loads(job_requirements)
            except:
                job_requirements = []

        work_exp = candidate_data.get('work_experience', [])
        if isinstance(work_exp, list):
            exp_summary = "; ".join([str(e)[:50] for e in work_exp[:3]])
        else:
            exp_summary = str(work_exp)[:100]

        return self.gemini_service.reason_about_job_fit(
            job_title=job_data.get('title', 'Position'),
            job_description=job_data.get('description', ''),
            required_skills=job_requirements,
            candidate_skills=skills,
            candidate_experience_summary=exp_summary
        )


# Global AI service instance
ai_service = AIService()

