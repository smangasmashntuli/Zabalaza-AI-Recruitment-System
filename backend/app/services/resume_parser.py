import re
from io import BytesIO
from typing import Dict, List, Optional, Tuple

import PyPDF2
import docx


class ResumeParser:
    """Extract structured information from PDF and DOCX resumes."""

    def __init__(self):
        self.email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        self.phone_pattern = r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
        self.location_pattern = r"^[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)+$"
        self.date_range_pattern = re.compile(
            r"((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}|present|current))?",
            re.IGNORECASE,
        )
        self.degree_patterns = [
            "bachelor", "master", "phd", "doctorate", "associate", "diploma",
            "b.s.", "m.s.", "b.a.", "m.a.", "bcom", "bsc", "msc", "mba",
        ]
        self.job_title_keywords = [
            "engineer", "developer", "analyst", "manager", "designer", "scientist",
            "consultant", "specialist", "administrator", "coordinator", "architect",
            "intern", "officer",
        ]
        self.section_headers = {
            "education": ["education", "academic background", "qualifications"],
            "experience": ["experience", "work experience", "employment history", "professional experience"],
            "skills": ["skills", "technical skills", "core competencies", "expertise"],
            "certifications": ["certifications", "licenses", "courses"],
        }
        self.skill_keywords = [
            "python", "java", "javascript", "typescript", "react", "angular", "vue",
            "node", "express", "django", "flask", "fastapi", "sql", "nosql", "mongodb",
            "postgresql", "mysql", "docker", "kubernetes", "aws", "azure", "gcp",
            "machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
            "pytorch", "scikit-learn", "pandas", "numpy", "data analysis", "statistics",
            "html", "css", "git", "agile", "scrum", "ci/cd", "devops", "rest api",
            "graphql", "microservices", "blockchain", "solidity", "rust", "go", "c++",
            "c#", ".net", "spring", "hibernate", "redis", "elasticsearch", "kafka",
        ]

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            return "\n".join(page.extract_text() or "" for page in pdf_reader.pages)
        except Exception as exc:
            print(f"Error extracting PDF text: {exc}")
            return ""

    def extract_text_from_docx(self, file_content: bytes) -> str:
        try:
            doc = docx.Document(BytesIO(file_content))
            return "\n".join(paragraph.text for paragraph in doc.paragraphs)
        except Exception as exc:
            print(f"Error extracting DOCX text: {exc}")
            return ""

    def extract_text(self, file_content: bytes, file_type: str) -> str:
        if file_type == "application/pdf":
            return self.extract_text_from_pdf(file_content)
        if file_type in [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]:
            return self.extract_text_from_docx(file_content)
        return ""

    def _clean_lines(self, text: str) -> List[str]:
        return [line.strip() for line in text.splitlines() if line.strip()]

    def _get_section_lines(self, text: str, section_key: str) -> List[str]:
        lines = self._clean_lines(text)
        headers = self.section_headers.get(section_key, [])
        start_idx = None

        for idx, line in enumerate(lines):
            normalized = line.lower().strip(":").strip()
            if normalized in headers:
                start_idx = idx + 1
                break

        if start_idx is None:
            return []

        collected = []
        for line in lines[start_idx:]:
            normalized = line.lower().strip(":").strip()
            if any(normalized in values for values in self.section_headers.values()):
                break
            collected.append(line)

        return collected

    def extract_name(self, text: str) -> Optional[str]:
        for line in self._clean_lines(text)[:6]:
            lowered = line.lower()
            if (
                len(line.split()) in (2, 3)
                and not re.search(self.email_pattern, line)
                and not re.search(r"\d", line)
                and "resume" not in lowered
                and "curriculum" not in lowered
            ):
                return line.title()
        return None

    def split_name(self, full_name: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
        if not full_name:
            return None, None
        parts = full_name.split()
        if len(parts) == 1:
            return parts[0], None
        return parts[0], " ".join(parts[1:])

    def extract_email(self, text: str) -> Optional[str]:
        emails = re.findall(self.email_pattern, text)
        return emails[0] if emails else None

    def extract_phone(self, text: str) -> Optional[str]:
        phones = re.findall(self.phone_pattern, text)
        return phones[0] if phones else None

    def extract_location(self, text: str) -> Optional[str]:
        for line in self._clean_lines(text)[:10]:
            if re.search(self.location_pattern, line) and len(line) < 80 and "linkedin" not in line.lower():
                return line
        return None

    def extract_title(self, text: str) -> Optional[str]:
        for line in self._clean_lines(text)[1:8]:
            lowered = line.lower()
            if any(keyword in lowered for keyword in self.job_title_keywords) and len(line) < 80:
                return line
        return None

    def extract_skills(self, text: str) -> List[str]:
        text_lower = text.lower()
        found_skills = {skill.title() for skill in self.skill_keywords if skill in text_lower}
        return sorted(found_skills)

    def extract_experience_years(self, text: str) -> float:
        patterns = [
            r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",
            r"experience[:\s]+(\d+)\+?\s*years?",
        ]
        years = []
        for pattern in patterns:
            years.extend(int(match) for match in re.findall(pattern, text.lower()))

        if years:
            return float(max(years))

        date_ranges = self.date_range_pattern.findall(text)
        total = 0
        for start, end in date_ranges[:6]:
            end_year = int(end) if end and end.isdigit() else 2026
            total += max(end_year - int(start), 0)
        return float(total) if total else 0.0

    def extract_education(self, text: str) -> List[Dict[str, str]]:
        education = []
        lines = self._get_section_lines(text, "education") or self._clean_lines(text)

        for line in lines:
            lowered = line.lower()
            matched_degree = next((degree for degree in self.degree_patterns if degree in lowered), None)
            if not matched_degree:
                continue

            year_matches = re.findall(r"(?:19|20)\d{2}", line)
            parts = [part.strip() for part in re.split(r"[-|,]", line) if part.strip()]
            school = parts[-1] if parts else "Not specified"
            education.append({
                "degree": matched_degree.title(),
                "school": school,
                "field": line,
                "startDate": year_matches[0] if len(year_matches) > 1 else "",
                "endDate": year_matches[-1] if year_matches else "",
                "current": "present" in lowered or "current" in lowered,
            })

        return education

    def extract_work_experience(self, text: str) -> List[Dict[str, str]]:
        experience = []
        lines = self._get_section_lines(text, "experience") or self._clean_lines(text)

        for idx, line in enumerate(lines):
            if len(experience) >= 5:
                break

            match = self.date_range_pattern.search(line)
            if not match:
                continue

            previous_line = lines[idx - 1] if idx > 0 else ""
            next_line = lines[idx + 1] if idx + 1 < len(lines) and not self.date_range_pattern.search(lines[idx + 1]) else ""

            experience.append({
                "title": (previous_line or line)[:120] or "Not specified",
                "company": next_line[:120] or "Not specified",
                "location": None,
                "startDate": match.group(1),
                "endDate": match.group(2) or "",
                "current": (match.group(2) or "").lower() in {"present", "current"},
                "description": line[:300],
            })

        return experience

    def extract_certifications(self, text: str) -> List[Dict[str, str]]:
        certifications = []
        for line in self._get_section_lines(text, "certifications")[:8]:
            if len(line) < 3:
                continue
            certifications.append({
                "name": line[:120],
                "issuer": "Not specified",
                "date": None,
            })
        return certifications

    def parse(self, file_content: bytes, file_type: str) -> Dict:
        text = self.extract_text(file_content, file_type)
        if not text:
            return {"success": False, "error": "Could not extract text from file"}

        full_name = self.extract_name(text)
        first_name, last_name = self.split_name(full_name)

        return {
            "success": True,
            "resume_text": text,
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "email": self.extract_email(text),
            "phone": self.extract_phone(text),
            "location": self.extract_location(text),
            "title": self.extract_title(text),
            "skills": self.extract_skills(text),
            "experience_years": self.extract_experience_years(text),
            "education": self.extract_education(text),
            "work_experience": self.extract_work_experience(text),
            "certifications": self.extract_certifications(text),
        }
