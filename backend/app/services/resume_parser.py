import re
import json
from typing import Dict, List, Optional
import PyPDF2
import docx
from io import BytesIO


class ResumeParser:
    """AI-powered resume parser to extract structured information from resumes."""

    def __init__(self):
        self.email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        self.phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'

        # Common skill keywords
        self.skill_keywords = [
            'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'node', 'express', 'django', 'flask', 'fastapi', 'sql', 'nosql', 'mongodb',
            'postgresql', 'mysql', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow',
            'pytorch', 'scikit-learn', 'pandas', 'numpy', 'data analysis', 'statistics',
            'html', 'css', 'git', 'agile', 'scrum', 'ci/cd', 'devops', 'rest api',
            'graphql', 'microservices', 'blockchain', 'solidity', 'rust', 'go', 'c++',
            'c#', '.net', 'spring', 'hibernate', 'redis', 'elasticsearch', 'kafka'
        ]

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file."""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return ""

    def extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file."""
        try:
            doc = docx.Document(BytesIO(file_content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            print(f"Error extracting DOCX text: {e}")
            return ""

    def extract_text(self, file_content: bytes, file_type: str) -> str:
        """Extract text from resume file based on file type."""
        if file_type == "application/pdf":
            return self.extract_text_from_pdf(file_content)
        elif file_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            return self.extract_text_from_docx(file_content)
        else:
            return ""

    def extract_email(self, text: str) -> Optional[str]:
        """Extract email from resume text."""
        emails = re.findall(self.email_pattern, text)
        return emails[0] if emails else None

    def extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from resume text."""
        phones = re.findall(self.phone_pattern, text)
        return phones[0] if phones else None

    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text using keyword matching."""
        text_lower = text.lower()
        found_skills = []

        for skill in self.skill_keywords:
            if skill.lower() in text_lower:
                found_skills.append(skill.title())

        return list(set(found_skills))  # Remove duplicates

    def extract_experience_years(self, text: str) -> float:
        """Estimate years of experience from resume text."""
        # Look for patterns like "5 years", "5+ years", "5-7 years"
        patterns = [
            r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
            r'experience[:\s]+(\d+)\+?\s*years?',
        ]

        years = []
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            years.extend([int(match) for match in matches])

        return max(years) if years else 0.0

    def extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information from resume text."""
        education = []
        degrees = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'diploma', 'b.s.', 'm.s.', 'b.a.', 'm.a.']

        for degree in degrees:
            if degree in text.lower():
                education.append({"degree": degree.title(), "institution": "Not specified"})

        return education

    def extract_work_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience from resume text."""
        # This is a simplified version - in production, use more sophisticated NLP
        experience = []

        # Look for date patterns that might indicate work history
        date_patterns = re.findall(r'\b(20\d{2})\s*[-–]\s*(20\d{2}|present|current)\b', text.lower())

        for start, end in date_patterns[:5]:  # Limit to 5 most recent
            experience.append({
                "period": f"{start} - {end}",
                "position": "Not specified",
                "company": "Not specified"
            })

        return experience

    def parse(self, file_content: bytes, file_type: str) -> Dict:
        """Parse resume and extract all relevant information."""
        text = self.extract_text(file_content, file_type)

        if not text:
            return {
                "success": False,
                "error": "Could not extract text from file"
            }

        return {
            "success": True,
            "resume_text": text,
            "email": self.extract_email(text),
            "phone": self.extract_phone(text),
            "skills": self.extract_skills(text),
            "experience_years": self.extract_experience_years(text),
            "education": self.extract_education(text),
            "work_experience": self.extract_work_experience(text)
        }

