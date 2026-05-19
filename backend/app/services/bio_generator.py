"""Professional bio generation from CV and cover letter context."""

from __future__ import annotations

import logging
from typing import List, Optional, cast

from .gemini_service import get_gemini_service

logger = logging.getLogger(__name__)


class BioGenerator:
	"""Generate a concise professional bio from structured CV data."""

	def generate_bio(
		self,
		title: Optional[str],
		experience_years: Optional[float],
		skills: Optional[List[str]],
		work_experience: Optional[List[dict]],
		education: Optional[List[dict]],
		resume_text: str = "",
		cover_letter: str = "",
	) -> str:
		title_text = (title or "professional").strip()
		skills_list: List[str] = [str(skill).strip() for skill in (skills or []) if str(skill).strip()]
		work_items: List[dict] = list(work_experience or [])
		education_items: List[dict] = list(education or [])

		try:
			gemini = get_gemini_service()
			if gemini and getattr(gemini, "enabled", False):
				prompt = self._build_prompt(
					title=title_text,
					experience_years=experience_years or 0,
					skills=skills_list,
					work_experience=work_items,
					education=education_items,
					resume_text=resume_text,
					cover_letter=cover_letter,
				)
				response = gemini.client.generate_content(prompt)
				bio = getattr(response, "text", "") or ""
				bio = bio.strip()
				if bio:
					return self._ensure_sentence_range(bio)
		except Exception as exc:
			logger.warning("Bio generation via Gemini failed: %s", exc)

		return self._template_bio(title_text, experience_years or 0, skills_list, work_items, education_items, cover_letter)

	def _build_prompt(
		self,
		title: str,
		experience_years: float,
		skills: List[str],
		work_experience: List[dict],
		education: List[dict],
		resume_text: str,
		cover_letter: str,
	) -> str:
		work_lines = []
		for item in work_experience[:3]:
			if isinstance(item, dict):
				work_lines.append(
					f"- {item.get('title', 'Role')} at {item.get('company', 'Company')}: {item.get('description', '')}"
				)
			else:
				work_lines.append(f"- {item}")

		edu_lines = []
		for item in education[:3]:
			if isinstance(item, dict):
				edu_lines.append(
					f"- {item.get('degree', '')} {item.get('field', '')} at {item.get('school', 'Institution')}"
				)
			else:
				edu_lines.append(f"- {item}")

		return f"""
You are writing a professional bio for a candidate profile.

Rules:
- Write 3 to 5 sentences only.
- Professional and concise tone.
- Use the candidate's real CV and cover letter facts.
- Do not copy the cover letter verbatim.
- Mention the current title, years of experience, strongest skills, and relevant work or education.
- End with a value-focused statement about what they bring to employers.

Candidate title: {title}
Years of experience: {experience_years}
Top skills: {', '.join(skills[:8]) if skills else 'Not provided'}
Work experience:
{chr(10).join(work_lines) if work_lines else 'Not provided'}
Education:
{chr(10).join(edu_lines) if edu_lines else 'Not provided'}

Resume text:
{resume_text[:1200]}

Cover letter (supporting context only):
{cover_letter[:800]}

Return only the final bio text.
""".strip()

	def _template_bio(
		self,
		title: str,
		experience_years: float,
		skills: List[str],
		work_experience: List[dict],
		education: List[dict],
		cover_letter: str = "",
	) -> str:
		experience_phrase = (
			f"{experience_years:.0f}+ years of experience" if experience_years >= 1 else "growing professional experience"
		)
		top_skills = ", ".join(skills[:3]) if skills else "transferable skills"
		role_line = f"{title.title()} with {experience_phrase},"
		skills_line = f"with strengths in {top_skills}."

		work_focus = ""
		if work_experience:
			first = work_experience[0]
			if isinstance(first, dict):
				work_focus = f"Recent experience includes {first.get('title', 'relevant roles')} at {first.get('company', 'a previous employer')}."
			else:
				work_focus = f"Recent experience includes {first}."

		education_focus = ""
		if education:
			first = education[0]
			if isinstance(first, dict):
				education_focus = f"Academic background includes {first.get('degree', 'study')} at {first.get('school', 'an institution')}."
			else:
				education_focus = f"Academic background includes {first}."

		cover_focus = (
			"They bring a motivated, candidate-focused mindset to their applications and interviews."
			if cover_letter
			else "They are focused on building a strong, market-ready professional profile."
		)

		sentences = [
			role_line + " " + skills_line,
			work_focus,
			education_focus,
			cover_focus,
		]
		bio = " ".join(part for part in sentences if part).strip()
		return self._ensure_sentence_range(bio)

	def _ensure_sentence_range(self, text: str) -> str:
		text = " ".join(text.split())
		sentences = [segment.strip() for segment in text.split('.') if segment.strip()]
		if len(sentences) < 3:
			while len(sentences) < 3:
				sentences.append("This profile is ready for further refinement by the user.")
		if len(sentences) > 5:
			sentences = sentences[:5]
		return ". ".join(sentences).strip() + "."


_bio_generator: Optional[BioGenerator] = None


def get_bio_generator() -> BioGenerator:
	global _bio_generator
	if _bio_generator is None:
		_bio_generator = BioGenerator()
	# Use cast to narrow Optional[BioGenerator] -> BioGenerator for static analyzers
	return cast(BioGenerator, _bio_generator)


def generate_professional_bio(
	title: Optional[str],
	experience_years: Optional[float],
	skills: Optional[List[str]],
	work_experience: Optional[List[dict]],
	education: Optional[List[dict]],
	resume_text: str = "",
	cover_letter: str = "",
) -> str:
	return get_bio_generator().generate_bio(
		title=title,
		experience_years=experience_years,
		skills=skills,
		work_experience=work_experience,
		education=education,
		resume_text=resume_text,
		cover_letter=cover_letter,
	)




