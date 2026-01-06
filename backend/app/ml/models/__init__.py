"""
Candidate-Job matching algorithms
"""

import numpy as np
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer


class SemanticMatcher:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)

    def match(self, candidate_text: str, job_description: str) -> float:
        cand_embedding = self.model.encode(candidate_text)
        job_embedding = self.model.encode(job_description)
        return cosine_similarity([cand_embedding], [job_embedding])[0][0]


__all__ = ["SemanticMatcher", "calculate_semantic_similarity"]