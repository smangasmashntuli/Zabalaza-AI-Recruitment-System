"""
Text Preprocessor - Cleans and normalizes text
"""

import re
from typing import List


class TextPreprocessor:
    """Preprocess text for NLP tasks"""

    def __init__(self):
        # Common stop words
        self.stop_words = set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with'
        ])

    def clean(self, text: str) -> str:
        """
        Clean text

        Args:
            text: Raw text

        Returns:
            Cleaned text
        """
        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)

        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def normalize(self, text: str) -> str:
        """
        Normalize text

        Args:
            text: Text to normalize

        Returns:
            Normalized text
        """
        # Convert to lowercase
        text = text.lower()

        # Remove punctuation (keep periods for sentences)
        text = re.sub(r'[^\w\s.]', ' ', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words

        Args:
            text: Text to tokenize

        Returns:
            List of tokens
        """
        # Simple whitespace tokenization
        tokens = text.lower().split()

        # Remove punctuation from tokens
        tokens = [re.sub(r'[^\w]', '', token) for token in tokens]

        # Remove empty tokens
        tokens = [t for t in tokens if t]

        return tokens

    def remove_stop_words(self, tokens: List[str]) -> List[str]:
        """
        Remove stop words from tokens

        Args:
            tokens: List of tokens

        Returns:
            Filtered tokens
        """
        return [t for t in tokens if t.lower() not in self.stop_words]

    def preprocess(self, text: str, remove_stops: bool = False) -> str:
        """
        Full preprocessing pipeline

        Args:
            text: Raw text
            remove_stops: Whether to remove stop words

        Returns:
            Preprocessed text
        """
        # Clean
        text = self.clean(text)

        # Normalize
        text = self.normalize(text)

        # Optionally remove stop words
        if remove_stops:
            tokens = self.tokenize(text)
            tokens = self.remove_stop_words(tokens)
            text = ' '.join(tokens)

        return text

