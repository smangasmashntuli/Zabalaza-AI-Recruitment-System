"""
Semantic Matcher - Deep semantic similarity matching
"""

import numpy as np
from typing import Tuple, Dict
from sklearn.metrics.pairwise import cosine_similarity


class SemanticMatcher:
    """Match candidates to jobs using semantic similarity"""

    def __init__(self, threshold: float = 0.6):
        """
        Initialize semantic matcher

        Args:
            threshold: Minimum similarity score (0-1)
        """
        self.threshold = threshold

    def calculate_similarity(self,
                           candidate_embedding: np.ndarray,
                           job_embedding: np.ndarray) -> float:
        """
        Calculate cosine similarity between embeddings

        Args:
            candidate_embedding: Candidate vector
            job_embedding: Job vector

        Returns:
            Similarity score (0-1)
        """
        # Ensure 2D arrays
        if candidate_embedding.ndim == 1:
            candidate_embedding = candidate_embedding.reshape(1, -1)
        if job_embedding.ndim == 1:
            job_embedding = job_embedding.reshape(1, -1)

        similarity = cosine_similarity(candidate_embedding, job_embedding)[0][0]
        return float(similarity)

    def match(self,
              candidate_embedding: np.ndarray,
              job_embedding: np.ndarray,
              candidate_data: Dict,
              job_data: Dict) -> Tuple[float, str]:
        """
        Match candidate to job with explanation

        Args:
            candidate_embedding: Candidate vector
            job_embedding: Job vector
            candidate_data: Candidate metadata
            job_data: Job metadata

        Returns:
            Tuple of (score, explanation)
        """
        # Calculate base similarity
        similarity = self.calculate_similarity(candidate_embedding, job_embedding)

        # Generate explanation
        if similarity >= 0.8:
            explanation = f"Excellent semantic match ({similarity:.1%}). "
            explanation += "Resume content strongly aligns with job requirements."
        elif similarity >= 0.6:
            explanation = f"Good semantic match ({similarity:.1%}). "
            explanation += "Resume shows relevant experience and skills."
        elif similarity >= 0.4:
            explanation = f"Moderate match ({similarity:.1%}). "
            explanation += "Some alignment between resume and job description."
        else:
            explanation = f"Low semantic match ({similarity:.1%}). "
            explanation += "Limited overlap between resume and requirements."

        return similarity, explanation

    def is_match(self, score: float) -> bool:
        """Check if score meets threshold"""
        return score >= self.threshold

