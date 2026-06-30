from typing import Dict, List, Optional
import json
import re

from .resume_parser import ResumeParser
from .matching_engine import MatchingEngine
from .gemini_service import get_gemini_service


class AIService:
    """Central AI service that coordinates all AI/ML operations."""

    def __init__(self):
        self.resume_parser = ResumeParser()
        self.matching_engine = MatchingEngine()
        # Lazy initialize Gemini service for LLM refinement and enhancements
        try:
            self.gemini_service = get_gemini_service()
        except Exception:
            self.gemini_service = None

    def generate_candidate_summary(self, candidate_dict: Dict, job_dict: Dict, match_score: float) -> str:
        """Generate a concise summary of the candidate for recruiters.
        
        Focuses on candidate's strengths and experience rather than just the match score.
        """
        try:
            # Extract key information
            skills = []
            try:
                skills = json.loads(candidate_dict.get('skills', '[]')) if isinstance(candidate_dict.get('skills'), str) else candidate_dict.get('skills', [])
            except:
                skills = []
            
            experience_years = candidate_dict.get('experience_years', 0)
            resume_text = candidate_dict.get('resume_text', '')[:500]
            
            # Get candidate name from resume text
            name = "This candidate"
            name_match = re.search(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', resume_text, re.MULTILINE)
            if name_match:
                name = name_match.group(1)
            
            # Extract job title from candidate profile
            title = candidate_dict.get('title', 'Professional')
            
            # Build summary
            summary_parts = []
            
            # Experience summary
            if experience_years > 0:
                summary_parts.append(f"{name} has {experience_years:.1f} years of experience")
            else:
                summary_parts.append(f"{name} is an aspiring {title.lower()}")
            
            # Skills highlight
            if skills:
                top_skills = skills[:5]
                summary_parts.append(f"with expertise in {', '.join(top_skills)}")
            
            # Education
            try:
                education = json.loads(candidate_dict.get('education', '[]')) if isinstance(candidate_dict.get('education'), str) else candidate_dict.get('education', [])
                if education and isinstance(education, list) and len(education) > 0:
                    highest_edu = education[0]
                    degree = highest_edu.get('degree', '')
                    if degree:
                        summary_parts.append(f"holds a {degree}")
            except:
                pass
            
            # Match context
            match_pct = int(match_score * 100)
            if match_pct >= 70:
                summary_parts.append(f"and demonstrates strong alignment with this role ({match_pct}% match)")
            elif match_pct >= 50:
                summary_parts.append(f"with potential for this position ({match_pct}% match)")
            else:
                summary_parts.append(f"and may benefit from additional training for this role ({match_pct}% match)")
            
            summary = ". ".join(summary_parts) + "."
            
            # Keep it concise (max 200 chars)
            if len(summary) > 200:
                summary = summary[:197] + "..."
            
            return summary
            
        except Exception as e:
            print(f"Error generating candidate summary: {e}")
            return f"Candidate profile available. Match score: {int(match_score * 100)}%"

    def parse_resume(self, file_content: bytes, file_type: str, fast_mode: bool = True) -> Dict:
        """Parse resume and optionally refine with LLM.

        fast_mode=True keeps upload latency low for profile auto-fill.
        """
        parsed = self.resume_parser.parse(file_content, file_type)
        if not parsed or not parsed.get("success"):
            return parsed

        if fast_mode:
            return parsed

        try:
            llm_data = self.llm_refine(parsed.get("resume_text", ""))
        except Exception:
            llm_data = {}

        parsed_skills = parsed.get("skills", []) or []
        llm_skills = llm_data.get("skills", []) or []
        merged = []
        for skill in parsed_skills + llm_skills:
            if not skill:
                continue
            if skill not in merged:
                merged.append(skill)
        parsed["skills"] = merged

        parsed["education"] = llm_data.get("education") or parsed.get("education")
        parsed["work_experience"] = llm_data.get("work_experience") or parsed.get("work_experience")

        if llm_data.get("projects"):
            parsed["projects"] = llm_data.get("projects")
        if llm_data.get("languages"):
            parsed["languages"] = llm_data.get("languages")

        return parsed

    def llm_refine(self, resume_text: str) -> Dict:
        """
        Use the Gemini LLM to refine and extract structured resume data.

        Returns JSON with keys: skills (list), education (list of objects), work_experience (list of objects)
        """
        result = {}
        if not resume_text or not self.gemini_service or not getattr(self.gemini_service, "enabled", False):
            return result

        try:
            prompt = f"""
Extract structured data from this resume. Return only valid JSON.

Required keys:
- skills: list of strings
- education: list of objects with keys (degree, school, field, startDate, endDate)
- work_experience: list of objects with keys (title, company, startDate, endDate, description)

Optional keys:
- projects: list of objects with keys (name, link, type)
- languages: list of objects with keys (name, proficiency)

Resume:\n{resume_text}

Return JSON only (no markdown).
"""
            response = self.gemini_service.client.generate_content(prompt)
            if not response or not hasattr(response, 'text'):
                return {}
            text = response.text.strip()

            try:
                parsed = json.loads(text)
                return parsed
            except Exception:
                start = text.find('{')
                end = text.rfind('}')
                if start != -1 and end != -1 and end > start:
                    try:
                        parsed = json.loads(text[start:end+1])
                        return parsed
                    except Exception:
                        return {}
                return {}
        except Exception:
            return {}

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
        if getattr(self.gemini_service, "enabled", False) and skills:
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
