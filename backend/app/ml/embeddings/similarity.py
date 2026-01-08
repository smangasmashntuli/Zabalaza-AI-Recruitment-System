"""
Similarity Calculator - Various similarity metrics
"""

import numpy as np
from typing import List
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances


class SimilarityCalculator:
    """Calculate similarity between vectors"""

    @staticmethod
    def cosine(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Calculate cosine similarity

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Similarity score (0-1)
        """
        if vec1.ndim == 1:
            vec1 = vec1.reshape(1, -1)
        if vec2.ndim == 1:
            vec2 = vec2.reshape(1, -1)

        return float(cosine_similarity(vec1, vec2)[0][0])

    @staticmethod
    def euclidean(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Calculate Euclidean distance

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Distance score (lower is more similar)
        """
        if vec1.ndim == 1:
            vec1 = vec1.reshape(1, -1)
        if vec2.ndim == 1:
            vec2 = vec2.reshape(1, -1)

        return float(euclidean_distances(vec1, vec2)[0][0])

    @staticmethod
    def dot_product(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Calculate dot product similarity

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Similarity score
        """
        return float(np.dot(vec1, vec2))

    @staticmethod
    def batch_cosine(query: np.ndarray, vectors: List[np.ndarray]) -> np.ndarray:
        """
        Calculate cosine similarity for one query against multiple vectors

        Args:
            query: Query vector
            vectors: List of vectors to compare

        Returns:
            Array of similarity scores
        """
        if query.ndim == 1:
            query = query.reshape(1, -1)

        vector_matrix = np.vstack(vectors)
        similarities = cosine_similarity(query, vector_matrix)[0]

        return similarities

