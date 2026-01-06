"""
Resume parsing using NLP techniques
"""

import spacy
import re
from typing import Dict, List, Optional
import PyPDF2
import docx
from ..utils.preprocessing import clean_text, normalize_dates


class ResumeParser:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        self.skill_patterns = self._load_skill_patterns()

    def parse(self, file_path: str) -> Dict:
        text = self._extract_text(file_path)
        cleaned = clean_text(text)

        return {
            "skills": self._extract_skills(cleaned),
            "experience": self._extract_experience(cleaned),
            "education": self._extract_education(cleaned),
            "contact": self._extract_contact_info(cleaned),
            "raw_text": text
        }


__all__ = ["ResumeParser", "extract_skills", "extract_experience"]