"""
Experience Parser - Extracts and structures work experience
"""

import re
from typing import List, Dict
from datetime import datetime


class ExperienceParser:
    """Parse work experience from resume text"""

    def __init__(self):
        # Common job title keywords
        self.job_title_keywords = [
            "developer", "engineer", "manager", "analyst", "designer",
            "consultant", "specialist", "lead", "senior", "junior",
            "architect", "director", "coordinator", "administrator"
        ]

        # Date patterns
        self.date_patterns = [
            r'(\d{4})\s*[-–]\s*(\d{4}|present|current)',
            r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})',
            r'(\d{1,2})/(\d{4})'
        ]

    def parse(self, text: str) -> Dict:
        """
        Parse work experience from text

        Args:
            text: Resume text

        Returns:
            Dictionary with experience data
        """
        experiences = []
        years_of_experience = self._calculate_years(text)

        # Extract work periods
        date_matches = []
        for pattern in self.date_patterns:
            matches = re.findall(pattern, text.lower())
            date_matches.extend(matches)

        # Try to find job titles and companies
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_lower = line.lower()

            # Check if line contains job title keywords
            for keyword in self.job_title_keywords:
                if keyword in line_lower and len(line.split()) <= 10:
                    # Try to find company in next few lines
                    company = "Unknown"
                    for j in range(i+1, min(i+3, len(lines))):
                        next_line = lines[j].strip()
                        if next_line and not any(kw in next_line.lower() for kw in self.job_title_keywords):
                            company = next_line
                            break

                    experiences.append({
                        "title": line.strip(),
                        "company": company,
                        "period": "Not specified"
                    })
                    break

        return {
            "experiences": experiences[:10],  # Limit to 10 most recent
            "total_years": years_of_experience,
            "positions_count": len(experiences)
        }

    def _calculate_years(self, text: str) -> float:
        """Calculate total years of experience"""
        # Look for explicit mentions
        experience_patterns = [
            r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
            r'experience[:\s]+(\d+)\+?\s*years?',
        ]

        years = []
        for pattern in experience_patterns:
            matches = re.findall(pattern, text.lower())
            years.extend([int(m) for m in matches])

        if years:
            return max(years)

        # Try to calculate from date ranges
        all_years = re.findall(r'\b(19|20)\d{2}\b', text)
        if len(all_years) >= 2:
            years_list = [int(y) for y in all_years]
            min_year = min(years_list)
            max_year = max(years_list)
            current_year = datetime.now().year

            # Estimate experience
            if max_year >= current_year - 1:
                return min(current_year - min_year, 50)  # Cap at 50 years

        return 0.0

