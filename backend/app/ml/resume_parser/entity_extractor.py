"""
Entity Extractor - Uses NER to extract named entities from text
"""

import re
from typing import Dict, List


class EntityExtractor:
    """Extract named entities like names, organizations, locations"""

    def __init__(self):
        # Patterns for entity extraction
        self.patterns = {
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            'url': r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&/=]*',
            'linkedin': r'linkedin\.com/in/[\w-]+',
            'github': r'github\.com/[\w-]+'
        }

    def extract(self, text: str) -> Dict[str, List[str]]:
        """
        Extract entities from text

        Args:
            text: Resume text

        Returns:
            Dictionary of extracted entities
        """
        entities = {}

        # Extract using regex patterns
        for entity_type, pattern in self.patterns.items():
            matches = re.findall(pattern, text)
            if matches:
                entities[entity_type] = matches if isinstance(matches[0], str) else [m for m in matches]

        # Extract name (usually first line or near top)
        entities['name'] = self._extract_name(text)

        return entities

    def _extract_name(self, text: str) -> str:
        """Extract candidate name from resume"""
        # Simple heuristic: name is usually in first few lines
        lines = text.strip().split('\n')
        for line in lines[:5]:
            line = line.strip()
            # Name is likely 2-4 words, not all caps, not containing numbers
            words = line.split()
            if 2 <= len(words) <= 4 and not any(char.isdigit() for char in line):
                if not line.isupper():  # Avoid section headers
                    return line
        return "Unknown"

