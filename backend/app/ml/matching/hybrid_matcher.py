"""
Hybrid Matcher - Combines all matching algorithms
"""

import numpy as np
from typing import Dict, List, Tuple
from .semantic_matcher import SemanticMatcher
from .skill_matcher import SkillMatcher
from .experience_matcher import ExperienceMatcher


class HybridMatcher:
    """
    Hybrid matching algorithm that combines:
    - Semantic similarity (50% weight)
    - Skill overlap (30% weight)
    - Experience match (20% weight)
    """

    def __init__(self,
                 semantic_weight: float = 0.5,
                 skill_weight: float = 0.3,
                 experience_weight: float = 0.2):
        """
        Initialize hybrid matcher

        Args:
            semantic_weight: Weight for semantic similarity
            skill_weight: Weight for skill matching
            experience_weight: Weight for experience matching
        """
        self.semantic_weight = semantic_weight
        self.skill_weight = skill_weight
        self.experience_weight = experience_weight

        # Initialize sub-matchers
        self.semantic_matcher = SemanticMatcher()
        self.skill_matcher = SkillMatcher()
        self.experience_matcher = ExperienceMatcher()

    def match(self,
              candidate_embedding: np.ndarray,
              job_embedding: np.ndarray,
              candidate_data: Dict,
              job_data: Dict) -> Tuple[float, str]:
        """
        Calculate comprehensive match score

        Args:
            candidate_embedding: Candidate embedding vector
            job_embedding: Job embedding vector
            candidate_data: Candidate metadata (skills, experience, etc.)
            job_data: Job metadata

        Returns:
            Tuple of (final_score, detailed_explanation)
        """
        scores = {}
        explanations = []

        # 1. Semantic Similarity
        semantic_score, semantic_exp = self.semantic_matcher.match(
            candidate_embedding, job_embedding, candidate_data, job_data
        )
        scores['semantic'] = semantic_score
        explanations.append(f"Semantic: {semantic_exp}")

        # 2. Skill Matching
        candidate_skills = candidate_data.get('skills', [])
        job_skills = job_data.get('skills', [])

        if isinstance(candidate_skills, str):
            import json
            try:
                candidate_skills = json.loads(candidate_skills)
            except:
                candidate_skills = []

        if isinstance(job_skills, str):
            import json
            try:
                job_skills = json.loads(job_skills)
            except:
                job_skills = []

        skill_score, skill_exp = self.skill_matcher.match(candidate_skills, job_skills)
        scores['skill'] = skill_score
        explanations.append(f"Skills: {skill_exp}")

        # 3. Experience Matching
        candidate_years = candidate_data.get('experience_years', 0)
        job_level = job_data.get('experience_level', 'mid')

        exp_score, exp_exp = self.experience_matcher.match(candidate_years, job_level)
        scores['experience'] = exp_score
        explanations.append(f"Experience: {exp_exp}")

        # Calculate weighted final score
        final_score = (
            scores['semantic'] * self.semantic_weight +
            scores['skill'] * self.skill_weight +
            scores['experience'] * self.experience_weight
        )

        # Generate overall explanation
        if final_score >= 0.8:
            overall = "⭐ Excellent Match"
        elif final_score >= 0.6:
            overall = "✓ Good Match"
        elif final_score >= 0.4:
            overall = "~ Moderate Match"
        else:
            overall = "✗ Low Match"

        detailed_explanation = f"{overall} ({final_score:.0%}). " + " | ".join(explanations)

        return final_score, detailed_explanation

    def batch_match(self,
                    candidate_embedding: np.ndarray,
                    jobs: List[Dict]) -> List[Dict]:
        """
        Match one candidate against multiple jobs

        Args:
            candidate_embedding: Candidate embedding
            jobs: List of job dictionaries with embeddings

        Returns:
            List of matches sorted by score
        """
        matches = []

        for job in jobs:
            if 'embedding' not in job:
                continue

            job_embedding = np.array(job['embedding'])
            score, explanation = self.match(
                candidate_embedding,
                job_embedding,
                candidate_data={},  # Add if available
                job_data=job
            )

            matches.append({
                'job_id': job.get('id'),
                'score': score,
                'explanation': explanation,
                'job': job
            })

        # Sort by score descending
        matches.sort(key=lambda x: x['score'], reverse=True)

        return matches

