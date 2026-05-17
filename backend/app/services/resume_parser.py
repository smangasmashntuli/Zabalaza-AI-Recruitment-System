import re
from datetime import datetime
from io import BytesIO
from typing import Dict, List, Optional, Tuple

import PyPDF2
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except Exception:
    pdfplumber = None
    PDFPLUMBER_AVAILABLE = False
import docx


class ResumeParser:
    """Extract structured information from CV files for profile auto-fill."""

    def __init__(self):
        self.email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        self.phone_pattern = r"(?:\+?\d[\d\s().-]{7,}\d)"
        self.location_pattern = r"^[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)+$"
        self.date_range_pattern = re.compile(
            r"((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}|present|current))?",
            re.IGNORECASE,
        )
        self.url_pattern = re.compile(r"https?://[^\s]+", re.IGNORECASE)

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
            "projects": ["projects", "portfolio", "publications", "open source"],
            "languages": ["languages", "language proficiency"],
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
        self.soft_skill_keywords = [
            "communication", "teamwork", "leadership", "problem solving", "critical thinking",
            "time management", "adaptability", "collaboration", "stakeholder management",
        ]
        self.language_keywords = [
            "english", "zulu", "xhosa", "afrikaans", "french", "spanish", "german", "arabic", "portuguese",
        ]

    def _normalize_date(self, value: str) -> str:
        """Normalize common date values to YYYY-MM (best-effort)."""
        if not value:
            return ""

        clean = value.strip().lower()
        if clean in {"present", "current", "now"}:
            return "present"

        year_match = re.search(r"((?:19|20)\d{2})", clean)
        year = year_match.group(1) if year_match else ""
        if not year:
            return ""

        month_map = {
            "jan": "01", "feb": "02", "mar": "03", "apr": "04", "may": "05", "jun": "06",
            "jul": "07", "aug": "08", "sep": "09", "oct": "10", "nov": "11", "dec": "12",
        }
        for token, month in month_map.items():
            if token in clean:
                return f"{year}-{month}"
        return f"{year}-01"

    def _normalize_phone(self, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        raw = value.strip()
        digits = re.sub(r"\D", "", raw)
        if not digits:
            return None

        if raw.startswith("+"):
            return f"+{digits}"
        if digits.startswith("00"):
            return f"+{digits[2:]}"
        if len(digits) == 10 and digits.startswith("0"):
            return f"+27{digits[1:]}"
        return f"+{digits}"

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        # Bound parsing to first 10 pages for speed and predictable processing.
        try:
            if PDFPLUMBER_AVAILABLE:
                with pdfplumber.open(BytesIO(file_content)) as pdf:
                    pages = pdf.pages[:10]
                    chunks = []
                    for page in pages:
                        page_text = page.extract_text() or ""
                        table_lines: List[str] = []
                        for table in page.extract_tables() or []:
                            for row in table:
                                row_text = " | ".join((cell or "").strip() for cell in row if cell is not None)
                                if row_text.strip():
                                    table_lines.append(row_text)
                        chunks.append("\n".join([page_text] + table_lines).strip())
                    return "\n".join(chunks)

            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            return "\n".join(page.extract_text() or "" for page in pdf_reader.pages[:10])
        except Exception as exc:
            print(f"Error extracting PDF text: {exc}")
            return ""

    def extract_text_from_docx(self, file_content: bytes) -> str:
        try:
            doc = docx.Document(BytesIO(file_content))
            lines: List[str] = []

            for paragraph in doc.paragraphs:
                if not paragraph.text:
                    continue
                style_name = (getattr(paragraph.style, "name", "") or "").lower()
                prefix = "- " if style_name.startswith("list") else ""
                lines.append(f"{prefix}{paragraph.text}".strip())

            for table in doc.tables:
                for row in table.rows:
                    cells = [cell.text.strip() for cell in row.cells if cell.text and cell.text.strip()]
                    if cells:
                        lines.append(" | ".join(cells))

            return "\n".join(lines)
        except Exception as exc:
            print(f"Error extracting DOCX text: {exc}")
            return ""

    def extract_text_from_txt(self, file_content: bytes) -> str:
        try:
            return file_content.decode("utf-8", errors="ignore")
        except Exception as exc:
            print(f"Error extracting TXT text: {exc}")
            return ""

    def extract_text(self, file_content: bytes, file_type: str) -> str:
        if file_type == "application/pdf":
            return self.extract_text_from_pdf(file_content)
        if file_type in [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]:
            return self.extract_text_from_docx(file_content)
        if file_type in ["text/plain", "text/markdown"]:
            return self.extract_text_from_txt(file_content)
        return ""

    def _clean_lines(self, text: str) -> List[str]:
        return [line.strip() for line in text.splitlines() if line.strip()]

    def _get_section_lines(self, text: str, section_key: str) -> List[str]:
        lines = self._clean_lines(text)
        headers = self.section_headers.get(section_key, [])
        start_idx = None

        for idx, line in enumerate(lines):
            normalized = line.lower().strip(":").strip()
            if any(h in normalized for h in headers):
                start_idx = idx + 1
                break

        if start_idx is None:
            return []

        collected = []
        for line in lines[start_idx:]:
            normalized = line.lower().strip(":").strip()
            if any(any(h in normalized for h in values) for values in self.section_headers.values()):
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
        candidates = re.findall(self.phone_pattern, text)
        for candidate in candidates:
            digits = re.sub(r"\D", "", candidate)
            if 9 <= len(digits) <= 15:
                return self._normalize_phone(candidate)
        return None

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
        text_norm = re.sub(r"[\W_]+", " ", text_lower)
        tokens = set(text_norm.split())

        found = set()
        for skill in self.skill_keywords:
            s = skill.lower()
            variants = {
                s,
                s.replace(" ", ""),
                s.replace(".", ""),
                s.replace(".", "").replace(" ", ""),
            }
            if any(v in text_lower or v in text_norm or v in tokens for v in variants):
                found.add(skill.title())

        return sorted(found)

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
            end_year = int(end) if end and end.isdigit() else datetime.utcnow().year
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
            school = "Not provided"
            if parts:
                year_like_parts = [idx for idx, part in enumerate(parts) if re.fullmatch(r"(?:19|20)\d{2}", part)]
                if year_like_parts:
                    candidate_idx = year_like_parts[0] - 1
                    if candidate_idx >= 0:
                        school = parts[candidate_idx]
                if school == "Not provided":
                    for part in reversed(parts):
                        if not re.fullmatch(r"(?:19|20)\d{2}", part):
                            school = part
                            break

            field = line
            in_split = re.split(r"\bin\b", line, maxsplit=1, flags=re.IGNORECASE)
            if len(in_split) > 1:
                field_candidate = in_split[1].strip()
                field_candidate = re.split(r"[-|,]", field_candidate)[0].strip()
                if field_candidate:
                    field = field_candidate

            education.append({
                "degree": parts[0] if parts else matched_degree.title(),
                "school": school,
                "field": field,
                "startDate": self._normalize_date(year_matches[0]) if len(year_matches) > 1 else "",
                "endDate": self._normalize_date(year_matches[-1]) if year_matches else "",
                "current": "present" in lowered or "current" in lowered,
            })

        return education

    def extract_work_experience(self, text: str) -> List[Dict[str, str]]:
        experience = []
        lines = self._get_section_lines(text, "experience") or self._clean_lines(text)

        for idx, line in enumerate(lines):
            if len(experience) >= 6:
                break

            block = " ".join(lines[idx: idx + 4])
            match = self.date_range_pattern.search(block)
            has_title_keyword = any(kw in line.lower() for kw in self.job_title_keywords)
            if not match and not has_title_keyword:
                continue

            title = next((l for l in lines[idx: idx + 3] if any(kw in l.lower() for kw in self.job_title_keywords)), line)
            company = ""
            for current_line in lines[idx: idx + 4]:
                low = current_line.lower()
                if " at " in low or "company" in low or ("," in current_line and len(current_line.split()) > 1):
                    company = current_line
                    break

            start_date = ""
            end_date = ""
            current = False
            if match:
                start_date = self._normalize_date(match.group(1))
                end_date = self._normalize_date(match.group(2) or "")
                current = (end_date or "").lower() == "present"
            else:
                years = re.findall(r"(?:19|20)\d{2}", block)
                if years:
                    start_date = self._normalize_date(years[0])
                    end_date = self._normalize_date(years[-1]) if len(years) > 1 else ""

            experience.append({
                "title": (title or line)[:120] or "Not provided",
                "company": (company or "Not provided")[:120],
                "location": None,
                "startDate": start_date,
                "endDate": end_date,
                "current": current,
                "description": block[:300],
            })

        return experience

    def extract_certifications(self, text: str) -> List[Dict[str, str]]:
        certifications = []
        for line in self._get_section_lines(text, "certifications")[:10]:
            if len(line) < 3:
                continue
            certifications.append({
                "name": line[:120],
                "issuer": "Not provided",
                "date": None,
            })
        return certifications

    def extract_projects(self, text: str) -> List[Dict[str, str]]:
        projects = []
        lines = self._get_section_lines(text, "projects")
        if not lines:
            lines = [line for line in self._clean_lines(text) if "github" in line.lower() or "project" in line.lower()]

        for line in lines[:12]:
            links = self.url_pattern.findall(line)
            projects.append({
                "name": line[:140],
                "link": links[0] if links else "",
                "type": "publication" if "publication" in line.lower() else "project",
            })

        seen = set()
        deduped = []
        for item in projects:
            key = item.get("name", "").lower().strip()
            if not key or key in seen:
                continue
            seen.add(key)
            deduped.append(item)
        return deduped

    def extract_languages(self, text: str) -> List[Dict[str, str]]:
        results = []
        lines = self._get_section_lines(text, "languages") or self._clean_lines(text)

        for line in lines[:20]:
            low = line.lower()
            matched = [lang for lang in self.language_keywords if lang in low]
            if not matched:
                continue

            proficiency = "Not provided"
            if any(token in low for token in ["native", "mother tongue"]):
                proficiency = "Native"
            elif any(token in low for token in ["fluent", "advanced"]):
                proficiency = "Fluent"
            elif any(token in low for token in ["intermediate", "conversational"]):
                proficiency = "Intermediate"
            elif any(token in low for token in ["basic", "beginner"]):
                proficiency = "Basic"

            for lang in matched:
                results.append({"name": lang.title(), "proficiency": proficiency})

        unique = {}
        for item in results:
            key = item["name"]
            if key not in unique or unique[key] == "Not provided":
                unique[key] = item["proficiency"]
        return [{"name": name, "proficiency": prof} for name, prof in unique.items()]

    def _cross_check_profile(self, extracted: Dict[str, object], text: str) -> Dict[str, object]:
        lowered_text = (text or "").lower()
        text_norm = lowered_text.replace(" ", "")
        verified = []
        ambiguous = []
        missing = []

        checks = {
            "name": extracted.get("full_name"),
            "email": extracted.get("email"),
            "phone": extracted.get("phone"),
            "location": extracted.get("location"),
            "title": extracted.get("title"),
        }

        for field, value in checks.items():
            if not value:
                missing.append(field)
                continue

            value_norm = str(value).lower().replace(" ", "")
            if value_norm in text_norm:
                verified.append(field)
            else:
                ambiguous.append(field)

        if not extracted.get("education"):
            missing.append("education")
        if not extracted.get("work_experience"):
            missing.append("work_experience")
        if not extracted.get("skills"):
            missing.append("skills")

        return {
            "verified_fields": verified,
            "ambiguous_fields": ambiguous,
            "missing_fields": missing,
            "needs_review": bool(ambiguous or missing),
            "review_notes": (
                "Please review highlighted fields before submitting profile updates."
                if (ambiguous or missing)
                else "All core profile fields were validated against resume text."
            ),
            "processed_at": datetime.utcnow().isoformat(),
        }

    def parse(self, file_content: bytes, file_type: str) -> Dict:
        text = self.extract_text(file_content, file_type)
        if not text:
            return {"success": False, "error": "Could not extract text from file"}

        full_name = self.extract_name(text)
        first_name, last_name = self.split_name(full_name)
        skills = self.extract_skills(text)
        soft_skills = sorted({s.title() for s in self.soft_skill_keywords if s in text.lower()})

        response = {
            "success": True,
            "resume_text": text,
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "email": self.extract_email(text),
            "phone": self.extract_phone(text),
            "location": self.extract_location(text),
            "title": self.extract_title(text),
            "skills": skills,
            "soft_skills": soft_skills,
            "experience_years": self.extract_experience_years(text),
            "education": self.extract_education(text),
            "work_experience": self.extract_work_experience(text),
            "certifications": self.extract_certifications(text),
            "projects": self.extract_projects(text),
            "languages": self.extract_languages(text),
        }
        response["validation"] = self._cross_check_profile(response, text)
        return response
