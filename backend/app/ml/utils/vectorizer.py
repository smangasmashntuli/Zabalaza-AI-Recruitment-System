"""
TF-IDF Vectorizer for text
"""

from sklearn.feature_extraction.text import TfidfVectorizer as SklearnTfidf
from typing import List
import numpy as np


class TfidfVectorizer:
    """Wrapper for scikit-learn TF-IDF"""

    def __init__(self, max_features: int = 1000):
        """
        Initialize vectorizer

        Args:
            max_features: Maximum number of features
        """
        self.vectorizer = SklearnTfidf(
            max_features=max_features,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.is_fitted = False

    def fit(self, texts: List[str]):
        """Fit vectorizer on texts"""
        self.vectorizer.fit(texts)
        self.is_fitted = True

    def transform(self, texts: List[str]) -> np.ndarray:
        """Transform texts to TF-IDF vectors"""
        if not self.is_fitted:
            raise ValueError("Vectorizer not fitted. Call fit() first.")
        return self.vectorizer.transform(texts).toarray()

    def fit_transform(self, texts: List[str]) -> np.ndarray:
        """Fit and transform in one step"""
        self.is_fitted = True
        return self.vectorizer.fit_transform(texts).toarray()

