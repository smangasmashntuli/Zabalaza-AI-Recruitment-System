"""
Keyword Extractor - Extract important keywords from text
"""

import re
from typing import List, Dict
from collections import Counter


class KeywordExtractor:
    """Extract keywords from text"""

    def __init__(self):
        # Common stop words to exclude
        self.stop_words = set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'this', 'which', 'have', 'been'
        ])

    def extract(self, text: str, top_k: int = 10) -> List[str]:
        """
        Extract top keywords from text

        Args:
            text: Input text
            top_k: Number of keywords to extract

        Returns:
            List of keywords
        """
        # Tokenize
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())

        # Remove stop words
        words = [w for w in words if w not in self.stop_words]

        # Count frequencies
        word_counts = Counter(words)

        # Get top keywords
        keywords = [word for word, count in word_counts.most_common(top_k)]

        return keywords

    def extract_with_scores(self, text: str, top_k: int = 10) -> Dict[str, int]:
        """
        Extract keywords with frequency scores

        Args:
            text: Input text
            top_k: Number of keywords

        Returns:
            Dictionary of keyword -> frequency
        """
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        words = [w for w in words if w not in self.stop_words]

        word_counts = Counter(words)

        return dict(word_counts.most_common(top_k))

    def extract_phrases(self, text: str, max_length: int = 3) -> List[str]:
        """
        Extract common phrases (n-grams)

        Args:
            text: Input text
            max_length: Maximum phrase length

        Returns:
            List of phrases
        """
        words = re.findall(r'\b[a-z]+\b', text.lower())
        phrases = []

        for n in range(2, max_length + 1):
            for i in range(len(words) - n + 1):
                phrase = ' '.join(words[i:i+n])
                # Skip if all stop words
                if not all(w in self.stop_words for w in words[i:i+n]):
                    phrases.append(phrase)

        # Count and return most common
        phrase_counts = Counter(phrases)
        return [p for p, c in phrase_counts.most_common(20) if c > 1]

