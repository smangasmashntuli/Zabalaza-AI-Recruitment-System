"""
Gemini LLM service for intelligent explanations, career insights, and CV optimization.

This service provides the "intelligence + personality layer" on top of:
- Resume parsing (already done by ResumeParser)
- Embeddings (already done by MatchingEngine)
- Job matching (already done by MatchingEngine)

The LLM adds:
1. Match explanations (WHY a job fits)
2. Career path intelligence (learning recommendations)
3. Smart job reasoning (semantic analysis of fit)
4. CV optimization suggestions (improve sections)
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. Gemini LLM features will be disabled.")


class GeminiService:
    """LLM-powered intelligence layer using Google Gemini."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"):
        """
        Initialize Gemini service.

        Args:
            api_key: Gemini API key (if None, uses GEMINI_API_KEY env var)
            model: Model name (default: gemini-1.5-flash)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model
        self.enabled = GEMINI_AVAILABLE and bool(self.api_key)

        if self.enabled:
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(model_name=self.model_name)
            logger.info(f"✅ Gemini service initialized with model: {self.model_name}")
        else:
            self.client = None
            logger.warning("⚠️ Gemini service disabled (API key missing or library not installed)")

    def generate_match_explanation(
        self,
        job_title: str,
        job_description: str,
        job_requirements: List[str],
        candidate_summary: str,
        candidate_skills: List[str],
        candidate_experience_years: float,
        match_score: float
    ) -> str:
        """
        Generate a human-friendly explanation of why a job matches a candidate.

        Returns explanation like:
        "You're a strong fit because your React + Node experience aligns with 78% of required skills..."

        Args:
            job_title: Title of the job
            job_description: Job description
            job_requirements: List of job requirements/skills
            candidate_summary: Candidate's profile summary
            candidate_skills: List of candidate's skills
            candidate_experience_years: Years of experience
            match_score: Similarity score (0-1)

        Returns:
            str: Human-readable explanation
        """
        if not self.enabled:
            return self._fallback_match_explanation(
                job_title, match_score, candidate_skills, job_requirements
            )

        try:
            prompt = f"""
You are a career advisor explaining job matches to candidates. Keep response concise (1-2 sentences).

Job: {job_title}
Job requirements: {', '.join(job_requirements[:5])}
Job description: {job_description[:300]}

Candidate profile: {candidate_summary}
Candidate skills: {', '.join(candidate_skills[:8])}
Years of experience: {candidate_experience_years}
Match score: {match_score:.0%}

Explain in 1-2 sentences why this is a good match. Focus on:
- Skill overlap (specific mention of matching skills)
- Relevant experience
- Growth potential

Be encouraging but honest. Never mention the match score percentage.
"""
            response = self.client.generate_content(prompt)
            explanation = response.text.strip()
            return explanation if explanation else self._fallback_match_explanation(
                job_title, match_score, candidate_skills, job_requirements
            )
        except Exception as e:
            logger.error(f"❌ Error generating match explanation: {e}")
            return self._fallback_match_explanation(
                job_title, match_score, candidate_skills, job_requirements
            )

    def _fallback_match_explanation(
        self,
        job_title: str,
        match_score: float,
        candidate_skills: List[str],
        job_requirements: List[str]
    ) -> str:
        """Fallback explanation if Gemini is unavailable."""
        if not candidate_skills or not job_requirements:
            return f"{job_title} matches your profile."

        matching_skills = [s for s in candidate_skills if any(s.lower() in r.lower() or r.lower() in s.lower() for r in job_requirements)]
        if matching_skills:
            skills_text = ", ".join(matching_skills[:3])
            return f"Good fit: your skills in {skills_text} align well with this role."
        return f"{job_title} matches your background and experience."

    def generate_career_path(
        self,
        candidate_summary: str,
        current_skills: List[str],
        experience_years: float,
        target_roles: Optional[List[str]] = None
    ) -> str:
        """
        Generate career path + learning recommendations.

        Examples:
        "Based on your backend experience, you could transition into DevOps within 6 months..."

        Args:
            candidate_summary: Candidate's profile summary
            current_skills: List of current skills
            experience_years: Years of experience
            target_roles: Roles the candidate is interested in (optional)

        Returns:
            str: Career path recommendation
        """
        if not self.enabled:
            return self._fallback_career_path(current_skills, experience_years)

        try:
            prompt = f"""
You are a career coach. Provide actionable career path advice in 2-3 sentences.

Candidate profile: {candidate_summary}
Current skills: {', '.join(current_skills[:10])}
Years of experience: {experience_years}
{f'Interested in: {", ".join(target_roles[:3])}' if target_roles else ''}

Based on this profile:
1. Suggest ONE realistic next step in their career (e.g., DevOps, Data Engineering, Product Management)
2. Recommend 2-3 skills they should learn to make that transition
3. Estimate timeframe (e.g., "within 6 months")

Keep response actionable and specific.
"""
            response = self.client.generate_content(prompt)
            advice = response.text.strip()
            return advice if advice else self._fallback_career_path(current_skills, experience_years)
        except Exception as e:
            logger.error(f"❌ Error generating career path: {e}")
            return self._fallback_career_path(current_skills, experience_years)

    def _fallback_career_path(self, current_skills: List[str], experience_years: float) -> str:
        """Fallback career path if Gemini is unavailable."""
        if experience_years < 2:
            return "Focus on building depth in your current domain and contributing to impactful projects."
        elif experience_years < 5:
            return "Consider specializing or moving into a senior individual contributor or team lead role."
        else:
            return "You're well-positioned for senior/leadership roles or specialization in emerging technologies."

    def optimize_cv_section(
        self,
        section_name: str,
        current_text: str,
        job_target: Optional[str] = None
    ) -> str:
        """
        Optimize a CV section (summary, skills, experience, etc.).

        Args:
            section_name: e.g., "summary", "skills", "experience"
            current_text: Current section text
            job_target: Optional target job title for ATS/keyword optimization

        Returns:
            str: Optimized text
        """
        if not self.enabled:
            return current_text

        try:
            prompt = f"""
You are a resume optimization expert. Improve this CV section concisely (stay under 150 words).

Section: {section_name}
Current text: {current_text}
{f'Target role: {job_target}' if job_target else ''}

Improve the text by:
1. Using strong action verbs
2. Quantifying impact where possible
3. Making it ATS-friendly (clear keywords, avoid graphics)
4. Keeping it concise and impactful

Return ONLY the improved text, no explanations.
"""
            response = self.client.generate_content(prompt)
            optimized = response.text.strip()
            return optimized if optimized else current_text
        except Exception as e:
            logger.error(f"❌ Error optimizing CV section: {e}")
            return current_text

    def reason_about_job_fit(
        self,
        job_title: str,
        job_description: str,
        required_skills: List[str],
        candidate_skills: List[str],
        candidate_experience_summary: str
    ) -> Dict[str, any]:
        """
        Perform semantic reasoning about job fit.

        Beyond cosine similarity, provide nuanced reasoning like:
        "This job requires leadership experience — user has only IC roles → medium fit"

        Args:
            job_title: Job title
            job_description: Job description
            required_skills: List of required skills
            candidate_skills: List of candidate's skills
            candidate_experience_summary: Summary of candidate's experience

        Returns:
            Dict with keys: reasoning, skill_gaps, strengths, recommendation
        """
        if not self.enabled:
            return self._fallback_job_fit_reasoning(
                candidate_skills, required_skills
            )

        try:
            prompt = f"""
Analyze job fit for a candidate. Return JSON with keys: reasoning (1-2 sentences), skill_gaps (list), strengths (list), recommendation (good/medium/poor).

Job: {job_title}
Description: {job_description[:300]}
Required skills: {', '.join(required_skills[:8])}

Candidate experience: {candidate_experience_summary}
Candidate skills: {', '.join(candidate_skills[:10])}

Return JSON (no markdown, just raw JSON):
{{
  "reasoning": "string",
  "skill_gaps": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "recommendation": "good|medium|poor"
}}
"""
            response = self.client.generate_content(prompt)
            try:
                result = json.loads(response.text)
                return result
            except json.JSONDecodeError:
                return self._fallback_job_fit_reasoning(candidate_skills, required_skills)
        except Exception as e:
            logger.error(f"❌ Error reasoning about job fit: {e}")
            return self._fallback_job_fit_reasoning(candidate_skills, required_skills)

    def _fallback_job_fit_reasoning(
        self, candidate_skills: List[str], required_skills: List[str]
    ) -> Dict[str, any]:
        """Fallback reasoning if Gemini is unavailable."""
        matching = [s for s in candidate_skills if s in required_skills]
        gaps = [s for s in required_skills if s not in candidate_skills]
        recommendation = "good" if len(matching) >= len(required_skills) * 0.7 else "medium"

        return {
            "reasoning": f"You match {len(matching)}/{len(required_skills)} required skills.",
            "skill_gaps": gaps[:3],
            "strengths": matching[:3],
            "recommendation": recommendation
        }

    def generate_interview_tips(
        self,
        job_title: str,
        job_description: str,
        candidate_experience: str
    ) -> str:
        """
        Generate interview preparation tips.

        Args:
            job_title: Target job title
            job_description: Job description
            candidate_experience: Candidate's background

        Returns:
            str: Interview tips
        """
        if not self.enabled:
            return "Research the company and practice common interview questions."

        try:
            prompt = f"""
Give 3 concise interview tips for a candidate preparing for: {job_title}

Job description: {job_description[:300]}
Candidate background: {candidate_experience}

Tips should be:
1. Specific to the role (mention relevant skills/technologies)
2. Actionable (what to prepare/practice)
3. Based on the job description

Keep each tip to 1-2 sentences. Number them 1-3.
"""
            response = self.client.generate_content(prompt)
            tips = response.text.strip()
            return tips if tips else "Research the company and practice common interview questions."
        except Exception as e:
            logger.error(f"❌ Error generating interview tips: {e}")
            return "Research the company and practice common interview questions."

    def summarize_for_recruiter(
        self,
        candidate_summary: str,
        skills: List[str],
        experience_years: float,
        top_achievements: Optional[List[str]] = None
    ) -> str:
        """
        Generate a concise recruiter-facing summary.

        Args:
            candidate_summary: Candidate's self-summary
            skills: List of skills
            experience_years: Years of experience
            top_achievements: Notable achievements (optional)

        Returns:
            str: Recruiter-facing summary
        """
        if not self.enabled:
            return candidate_summary

        try:
            prompt = f"""
Create a 2-3 sentence recruiting pitch for this candidate:

Years of experience: {experience_years}
Skills: {', '.join(skills[:12])}
Self-summary: {candidate_summary}
{f'Achievements: {", ".join(top_achievements[:3])}' if top_achievements else ''}

The pitch should:
1. Lead with value (not role history)
2. Highlight rare/valuable skills
3. Be memorable and concise

Return ONLY the 2-3 sentence pitch.
"""
            response = self.client.generate_content(prompt)
            pitch = response.text.strip()
            return pitch if pitch else candidate_summary
        except Exception as e:
            logger.error(f"❌ Error summarizing for recruiter: {e}")
            return candidate_summary

    def analyze_match_details(
        self,
        job_title: str,
        job_description: str,
        job_requirements: List[str],
        candidate_skills: List[str],
        candidate_experience: str,
        match_score: float
    ) -> Dict:
        """Generate detailed match analysis with strengths and gaps."""
        if not self.enabled:
            return {
                "summary": "Match analysis not available",
                "strengths": [],
                "gaps": [],
                "recommendations": ""
            }

        try:
            prompt = f"""
Analyze the match between this candidate and job in detail.

Job: {job_title}
Requirements: {', '.join(job_requirements[:8])}
Description: {job_description[:400]}

Candidate Skills: {', '.join(candidate_skills[:10])}
Experience: {candidate_experience[:300]}
Match Score: {match_score:.0%}

Return a JSON object with exactly this format (no markdown):
{{
  "summary": "1-2 sentence overall assessment",
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "recommendations": "Specific actions to improve chances"
}}
"""
            response = self.client.generate_content(prompt)
            try:
                result = json.loads(response.text)
                return result
            except:
                return {
                    "summary": response.text[:200],
                    "strengths": [],
                    "gaps": [],
                    "recommendations": ""
                }
        except Exception as e:
            logger.error(f"❌ Error analyzing match details: {e}")
            return {
                "summary": "Analysis error",
                "strengths": [],
                "gaps": [],
                "recommendations": ""
            }

    def get_resume_tailoring_suggestions(
        self,
        job_title: str,
        job_description: str,
        current_resume: str
    ) -> str:
        """Get specific suggestions to tailor resume for this job."""
        if not self.enabled:
            return "Resume tailoring suggestions not available."

        try:
            prompt = f"""
Help this candidate tailor their resume for the following job. Provide specific, actionable suggestions.

Target Job: {job_title}
Job Description: {job_description[:400]}

Current Resume Summary:
{current_resume[:500]}

Provide 3-4 specific bullet points on how to tailor the resume. Focus on:
1. Keywords from job description to include
2. Experience to highlight
3. Achievements to reframe
4. Skills to emphasize

Keep suggestions concise and actionable.
"""
            response = self.client.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"❌ Error getting resume tailoring suggestions: {e}")
            return "Could not generate suggestions at this time."

    def get_profile_improvement_tips(
        self,
        current_skills: List[str],
        experience_years: float,
        current_title: str,
        job_market_focus: str = "general"
    ) -> str:
        """Get tips to improve profile and stand out."""
        if not self.enabled:
            return "Profile improvement tips not available."

        try:
            prompt = f"""
As a career coach, provide specific, actionable tips to help this candidate stand out in the {job_market_focus} job market.

Current Profile:
- Title: {current_title}
- Years of experience: {experience_years}
- Current skills: {', '.join(current_skills[:12])}

Provide 4-5 specific tips that include:
1. Skills to develop
2. Certifications or learning opportunities
3. Projects or experience to build
4. Networking or visibility strategies
5. Portfolio or GitHub improvements

Be specific and practical.
"""
            response = self.client.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"❌ Error getting profile improvement tips: {e}")
            return "Could not generate tips at this time."

    def chat(self, user_message: str, conversation_history: Optional[List[Dict]] = None) -> str:
        """Have a conversational chat with the LLM."""
        if not self.enabled:
            return "Chat feature is not available at this time."

        try:
            # Build context from history
            messages = []
            if conversation_history:
                context = "\n".join([
                    f"User: {msg['user']}\nAssistant: {msg['assistant']}"
                    for msg in conversation_history[-3:]  # Last 3 exchanges
                ])
            else:
                context = ""

            full_prompt = f"""
You are a helpful career advisor chatbot. Be friendly, conversational, and specific.
Answer questions about job search, career development, resume building, and interview prep.

{f'Previous conversation:{context}' if context else 'This is the start of the conversation.'}

User: {user_message}

Provide a helpful, concise response (under 300 words).
"""
            response = self.client.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"❌ Error in chat: {e}")
            return "I'm having trouble responding right now. Please try again."

# Global Gemini service instance
def create_gemini_service() -> GeminiService:
    """Factory function to create Gemini service with settings."""
    from ..config import settings
    return GeminiService(
        api_key=settings.GEMINI_API_KEY,
        model=settings.GEMINI_MODEL
    )


gemini_service = None  # Lazy initialization


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service (lazy singleton)."""
    global gemini_service
    if gemini_service is None:
        gemini_service = create_gemini_service()
    return gemini_service

