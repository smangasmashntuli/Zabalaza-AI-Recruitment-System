"""
Education Parser - Extracts education information
"""

import re
from typing import List, Dict


class EducationParser:
    """Parse education details from resume text"""

    def __init__(self):
        # Common degree types
        self.degrees = [
            "phd", "ph.d", "doctorate", "doctoral",
            "master", "m.s.", "m.sc.", "msc", "m.a.", "ma", "mba",
            "bachelor", "b.s.", "b.sc.", "bsc", "b.a.", "ba", "b.tech", "btech",
            "associate", "diploma", "certificate"
        ]

        # Fields of study
        self.fields = [
            "computer science", "engineering", "mathematics", "physics",
            "business", "management", "economics", "finance", "accounting",
            "biology", "chemistry", "psychology", "education", "nursing",
            "law", "medicine", "arts", "design", "marketing"
        ]

    def parse(self, text: str) -> Dict:
        """
        Parse education from text

        Args:
            text: Resume text

        Returns:
            Dictionary with education data
        """
        text_lower = text.lower()
        education_list = []

        # Find degrees
        found_degrees = []
        for degree in self.degrees:
            if degree in text_lower:
                found_degrees.append(degree.upper())

        # Find fields of study
        found_fields = []
        for field in self.fields:
            if field in text_lower:
                found_fields.append(field.title())

        # Try to extract full education entries
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_lower = line.lower()

            # Check if line mentions education
            if any(deg in line_lower for deg in self.degrees):
                # Try to find institution in nearby lines
                institution = "Unknown"
                year = "Unknown"

                for j in range(max(0, i-2), min(i+3, len(lines))):
                    if j != i:
                        nearby_line = lines[j].strip()
                        # Look for university/college
                        if any(word in nearby_line.lower() for word in ["university", "college", "institute", "school"]):
                            institution = nearby_line
                        # Look for year
                        year_match = re.search(r'\b(19|20)\d{2}\b', nearby_line)
                        if year_match:
                            year = year_match.group(0)

                education_list.append({
                    "degree": line.strip(),
                    "institution": institution,
                    "year": year
                })

        return {
            "education_list": education_list[:5],  # Top 5 entries
            "degrees": list(set(found_degrees)),
            "fields": list(set(found_fields)),
            "education_level": self._determine_level(found_degrees)
        }

    def _determine_level(self, degrees: List[str]) -> str:
        """Determine highest education level"""
        degrees_lower = [d.lower() for d in degrees]

        if any(d in degrees_lower for d in ["phd", "ph.d", "doctorate", "doctoral"]):
            return "Doctorate"
        elif any(d in degrees_lower for d in ["master", "m.s.", "m.sc.", "mba", "m.a."]):
            return "Master's"
        elif any(d in degrees_lower for d in ["bachelor", "b.s.", "b.sc.", "b.a.", "b.tech"]):
            return "Bachelor's"
        elif any(d in degrees_lower for d in ["associate", "diploma"]):
            return "Associate/Diploma"
        else:
            return "Unknown"

