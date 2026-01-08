"""
Resume Parser Package
Extracts structured information from resumes
"""

from .text_extractor import TextExtractor
from .entity_extractor import EntityExtractor
from .skill_extractor import SkillExtractor
from .experience_parser import ExperienceParser
from .education_parser import EducationParser
from .contact_extractor import ContactExtractor


class ResumeParser:
    """Main resume parser that coordinates all extraction modules"""

    def __init__(self):
        self.text_extractor = TextExtractor()
        self.entity_extractor = EntityExtractor()
        self.skill_extractor = SkillExtractor()
        self.experience_parser = ExperienceParser()
        self.education_parser = EducationParser()
        self.contact_extractor = ContactExtractor()

    def parse(self, file_content: bytes, file_type: str) -> dict:
        """
        Parse a resume and extract all information

        Args:
            file_content: Raw file bytes
            file_type: MIME type (application/pdf, etc.)

        Returns:
            dict: Parsed resume data
        """
        # Extract text
        text = self.text_extractor.extract(file_content, file_type)

        if not text:
            return {"success": False, "error": "Could not extract text"}

        # Extract all information
        entities = self.entity_extractor.extract(text)
        skills = self.skill_extractor.extract(text)
        experience = self.experience_parser.parse(text)
        education = self.education_parser.parse(text)
        contact = self.contact_extractor.extract(text)

        return {
            "success": True,
            "text": text,
            "entities": entities,
            "skills": skills,
            "experience": experience,
            "education": education,
            "contact": contact
        }


__all__ = ["ResumeParser"]

