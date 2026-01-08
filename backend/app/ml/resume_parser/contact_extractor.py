"""
Contact Extractor - Extracts contact information
"""

import re
from typing import Dict, Optional


class ContactExtractor:
    """Extract contact information from resume"""

    def __init__(self):
        self.patterns = {
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            'linkedin': r'(?:https?://)?(?:www\.)?linkedin\.com/in/([\w-]+)',
            'github': r'(?:https?://)?(?:www\.)?github\.com/([\w-]+)',
            'website': r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&/=]*'
        }

    def extract(self, text: str) -> Dict[str, Optional[str]]:
        """
        Extract contact information

        Args:
            text: Resume text

        Returns:
            Dictionary of contact information
        """
        contact = {}

        # Email
        email_matches = re.findall(self.patterns['email'], text)
        contact['email'] = email_matches[0] if email_matches else None

        # Phone
        phone_matches = re.findall(self.patterns['phone'], text)
        contact['phone'] = phone_matches[0] if phone_matches else None

        # LinkedIn
        linkedin_matches = re.findall(self.patterns['linkedin'], text)
        if linkedin_matches:
            contact['linkedin'] = f"linkedin.com/in/{linkedin_matches[0]}"
        else:
            contact['linkedin'] = None

        # GitHub
        github_matches = re.findall(self.patterns['github'], text)
        if github_matches:
            contact['github'] = f"github.com/{github_matches[0]}"
        else:
            contact['github'] = None

        # Location (simple extraction from common patterns)
        contact['location'] = self._extract_location(text)

        return contact

    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location/address"""
        # Common patterns for locations
        location_patterns = [
            r'([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})',  # City, ST
            r'([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z]+)',  # City, State
        ]

        for pattern in location_patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0]

        return None

