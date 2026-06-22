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
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

#print("GEMINI KEY:", API_KEY)

# Optional local text-generation support via Hugging Face transformers
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    TRANSFORMERS_AVAILABLE = True
except Exception:
    TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)

genai = None
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. Gemini LLM features will be disabled.")


class GeminiService:
    """LLM-powered intelligence layer using Google Gemini."""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        """
        Initialize Gemini service.

        Args:
            api_key: Gemini API key (if None, uses GEMINI_API_KEY env var)
            model: Model name (default: gemini-2.5-flash)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = model
        
        # DEBUG: Log what we're reading
        logger.info(f"🔍 DEBUG: GEMINI_API_KEY from env: {bool(os.getenv('GEMINI_API_KEY'))}")
        logger.info(f"🔍 DEBUG: GEMINI_AVAILABLE: {GEMINI_AVAILABLE}")
        logger.info(f"🔍 DEBUG: api_key provided to __init__: {bool(api_key)}")
        logger.info(f"🔍 DEBUG: Final api_key length: {len(self.api_key)} chars")
        
        self.enabled = GEMINI_AVAILABLE and bool(self.api_key)

        if self.enabled:
            try:
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(model_name=self.model_name)
                logger.info(f"✅ Gemini service initialized with model: {self.model_name}")
            except Exception as e:
                logger.error(f"❌ Gemini initialization failed: {type(e).__name__}: {e}")
                self.enabled = False
                self.client = None
        else:
            self.client = None
            logger.warning(f"⚠️ Gemini service disabled:")
            logger.warning(f"   - GEMINI_AVAILABLE: {GEMINI_AVAILABLE}")
            logger.warning(f"   - API key present: {bool(self.api_key)}")
            logger.warning(f"   - API key length: {len(self.api_key)}")

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
            logger.error(f"Error generating match explanation: {e}")
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
    ) -> Dict[str, Any]:
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
    ) -> Dict[str, Any]:
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
            # Provide a useful heuristic fallback
            matching_skills = []
            missing_skills = []
            if candidate_skills:
                req_lower = [r.lower() for r in job_requirements]
                for skill in candidate_skills:
                    skill_lower = skill.lower()
                    if any(skill_lower in req or req in skill_lower for req in req_lower):
                        matching_skills.append(skill)
                    else:
                        missing_skills.append(skill)
            match_pct = int(match_score * 100)
            strengths = matching_skills[:3] if matching_skills else ["Your profile matches the job domain"]
            gaps = missing_skills[:2] if missing_skills else ["Add more specific job-related keywords to your profile"]
            return {
                "summary": f"Your profile shows a {match_pct}% match with {job_title}. "
                           f"You have {len(matching_skills)} matching skills out of {len(job_requirements)} requirements. "
                           f"Strengthening your profile with more targeted keywords and experience could improve your match.",
                "strengths": strengths,
                "gaps": gaps,
                "recommendations": "Update your profile with relevant skills and experience for this role."
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
            # Heuristic fallback on error too
            matching_skills = [s for s in candidate_skills if any(s.lower() in r.lower() or r.lower() in s.lower() for r in job_requirements)]
            return {
                "summary": f"Match assessment for {job_title}. Based on skill overlap, we found {len(matching_skills)} matching areas.",
                "strengths": matching_skills[:3] or ["Domain alignment"],
                "gaps": [r for r in job_requirements[:3] if not any(s.lower() in r.lower() for s in candidate_skills)],
                "recommendations": "Consider highlighting transferable skills and relevant experience in your application."
            }

    def get_resume_tailoring_suggestions(
        self,
        job_title: str,
        job_description: str,
        current_resume: str
    ) -> str:
        """Get specific suggestions to tailor resume for this job."""
        if not self.enabled:
            # Provide useful heuristic fallback
            return f"""Here are some tips to tailor your resume for {job_title}:

1. **Keywords**: Review the job description and incorporate relevant keywords and phrases throughout your resume.
2. **Highlight Experience**: Focus on experience that directly relates to the responsibilities mentioned in the job description.
3. **Skills Section**: Ensure your skills section reflects the skills listed in the job requirements.
4. **Achievements**: Quantify your achievements with metrics where possible (e.g., "improved efficiency by 20%").
5. **ATS Optimization**: Use standard section headings (Experience, Education, Skills) and avoid graphics/tables.

Upload your resume to get personalized suggestions."""

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

    def analyze_cv_for_job(
        self,
        job_title: str,
        job_description: str,
        job_requirements: str,
        cv_text: str,
        candidate_skills: List[str],
        candidate_experience: List[Dict]
    ) -> Dict[str, Any]:
        """
        Analyze a CV against a specific job and return structured feedback for recruiters.

        Returns dict with: headline, summary, strengths, gaps, seniority_fit, notable_signal
        """
        if not self.enabled:
            return {
                "headline": "CV analysis unavailable",
                "summary": "LLM analysis is not available. Please review the match score and candidate profile manually.",
                "strengths": candidate_skills[:3] if candidate_skills else [],
                "gaps": [],
                "seniority_fit": "Unable to assess",
                "notable_signal": ""
            }

        try:
            exp_summary = "; ".join([str(e)[:50] for e in candidate_experience[:2]]) if isinstance(candidate_experience, list) else str(candidate_experience)[:100]

            prompt = f"""You are helping a recruiter understand candidate fit. You are not screening candidates out — every candidate stays in the pool regardless of score. Your job is only to summarize fit accurately and fairly so a human can make the final call, including overriding the numeric score if the summary makes a strong case.

JOB TITLE: {job_title or '(not specified)'}
JOB DESCRIPTION: {job_description or '(not specified)'}
REQUIREMENTS: {job_requirements or '(not specified)'}

CANDIDATE CV TEXT (may include a resume and/or cover letter; treat both as part of the same candidate signal):
{cv_text[:8000]}

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{{
  "headline": "one line, max 12 words, the single most useful thing to know about this candidate for this role",
  "summary": "2-3 sentences, plain language, balanced and specific, written for a recruiter skimming quickly",
  "strengths": ["short phrase", "short phrase", "short phrase"],
  "gaps": ["short phrase", "short phrase"],
  "seniority_fit": "one short phrase e.g. 'matches junior level' or 'overqualified' or 'underqualified for stated requirements'",
  "notable_signal": "one short phrase on anything distinctive worth a second look, e.g. strong portfolio, unusual career path, or empty string if none"
}}"""
            response = self.client.generate_content(prompt)
            if not response or not hasattr(response, 'text') or not response.text:
                return {
                    "headline": "CV analysis unavailable",
                    "summary": "Could not generate analysis at this time.",
                    "strengths": candidate_skills[:3] if candidate_skills else [],
                    "gaps": [],
                    "seniority_fit": "Unable to assess",
                    "notable_signal": ""
                }

            text = response.text.strip()
            # Strip markdown fences if present
            if text.startswith('```'):
                text = text.split('\n', 1)[-1]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()

            try:
                return json.loads(text)
            except json.JSONDecodeError:
                # Try to extract JSON substring
                start = text.find('{')
                end = text.rfind('}')
                if start != -1 and end != -1 and end > start:
                    try:
                        return json.loads(text[start:end + 1])
                    except json.JSONDecodeError:
                        pass
                return {
                    "headline": "CV analysis unavailable",
                    "summary": text[:300] or "Could not parse analysis.",
                    "strengths": candidate_skills[:3] if candidate_skills else [],
                    "gaps": [],
                    "seniority_fit": "Unable to assess",
                    "notable_signal": ""
                }
        except Exception as e:
            logger.error(f"❌ Error analyzing CV for job: {e}")
            return {
                "headline": "CV analysis unavailable",
                "summary": "An error occurred during analysis.",
                "strengths": candidate_skills[:3] if candidate_skills else [],
                "gaps": [],
                "seniority_fit": "Unable to assess",
                "notable_signal": ""
            }

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

    def chat(self, user_message: str, conversation_history: Optional[List[Dict]] = None, context: Optional[str] = None) -> str:
        """Have a conversational chat with the LLM using recruitment system instructions."""
        if not self.enabled:
            logger.warning("⚠️ Chat feature disabled: Gemini API not enabled")
            return "Chat feature is not available at this time. Please ensure your API key is configured."

        try:
            # Validate input
            if not user_message or not user_message.strip():
                return "Please enter a message to continue."

            # RECRUITMENT SYSTEM INSTRUCTION
            system_instruction = """You are CareerMate, an expert AI Career Advisor helping candidates succeed in recruitment.

🎯 YOUR CORE ROLE:
Help candidates with accurate, honest, and actionable career insights.

KEY PRINCIPLES:
✓ ALWAYS be honest - never exaggerate or lie
✓ ALWAYS provide specific, actionable advice
✓ ALWAYS highlight both strengths AND gaps
✓ ALWAYS suggest concrete next steps
✓ ALWAYS base advice on the data you're given

🚫 STRICT RULES:
✗ Do NOT fabricate match scores or qualifications
✗ Do NOT ignore provided information
✗ Do NOT give false encouragement
✗ Do NOT provide legal/medical/financial advice
✓ DO celebrate genuine strengths
✓ DO suggest learning paths to close gaps
✓ DO acknowledge uncertainty when appropriate

📝 RESPONSE STYLE:
- Concise but comprehensive (2-4 paragraphs)
- Use bullet points for clarity
- Be warm and encouraging while staying honest
- Always include actionable next steps

CURRENT TIME: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}"""

            # Build context from history
            conversation_context = ""
            if conversation_history:
                try:
                    conversation_context = "\n".join([
                        f"User: {msg.get('user', '')}\nAssistant: {msg.get('assistant', '')}"
                        for msg in conversation_history[-3:] if msg.get('user') or msg.get('assistant')
                    ])
                except Exception as e:
                    logger.warning(f"Could not build conversation context: {e}")
                    conversation_context = ""

            # Build full prompt with optional additional context
            context_section = f"\nContext: {context}" if context else ""

            full_prompt = f"""{system_instruction}

{context_section}

{f'Previous conversation:\n{conversation_context}' if conversation_context else 'This is the start of the conversation.'}

User: {user_message}

Provide a helpful, honest, and actionable response."""
            
            logger.info(f"📤 Sending chat message to Gemini: '{user_message[:50]}...'")
            response = self.client.generate_content(full_prompt)
            
            # CRITICAL: Check for empty/None response
            if not response:
                logger.error("❌ Gemini returned None response")
                return "I couldn't generate a response. Please try again."
            
            # CRITICAL: Check for empty text
            if not hasattr(response, 'text') or not response.text:
                logger.error(f"❌ Gemini returned empty text: {response}")
                return "I couldn't generate a response. Please try again."
            
            result = response.text.strip()
            
            # Even if we got text, it might be empty after strip()
            if not result:
                logger.error("❌ Gemini returned whitespace-only response")
                return "I couldn't generate a response. Please try again."
            
            logger.info(f"📥 Gemini responded: '{result[:50]}...'")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error in chat: {type(e).__name__}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "I'm having trouble responding right now. Please try again."

# Global Gemini service instance
def create_gemini_service() -> GeminiService:
    """Factory function to create Gemini service with settings."""
    from ..config import settings
    # If a local LLM is requested in settings and transformers is available,
    # attempt to use it as a local text-generation fallback.
    local_model = getattr(settings, 'LOCAL_LLM_MODEL', '')
    use_local = getattr(settings, 'USE_LOCAL_LLM', False)

    if use_local and local_model and TRANSFORMERS_AVAILABLE:
        logger.info(f"🔁 Using local LLM model: {local_model}")

        class LocalTextGenClient:
            """Minimal adapter to expose .generate_content(prompt) -> object with .text"""
            def __init__(self, model_name: str):
                try:
                    # Use causal LM pipeline
                    self.pipe = pipeline('text-generation', model=model_name, device=-1)
                except Exception as e:
                    logger.error(f"Failed to load local model {model_name}: {e}")
                    raise

            def generate_content(self, prompt: str, **kwargs):
                # Use small generation defaults; caller expects an object with .text
                try:
                    out = self.pipe(prompt, max_length=512, do_sample=True, top_p=0.95, temperature=0.7)
                    text = out[0].get('generated_text') if isinstance(out, list) and out else str(out)
                except Exception as e:
                    logger.error(f"Local model generation failed: {e}")
                    text = ""

                class Res:
                    def __init__(self, text):
                        self.text = text

                return Res(text)

        # Create a GeminiService instance but swap its client with local client
        svc = GeminiService(api_key=None, model=settings.GEMINI_MODEL)
        try:
            svc.client = LocalTextGenClient(local_model)
            svc.enabled = True
            logger.info("✅ Local LLM client initialized and will be used for LLM tasks.")
            return svc
        except Exception:
            logger.error("⚠️ Falling back to remote Gemini service due to local model load failure.")

    # Default: use GeminiService configured for remote Gemini
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

