import json
from typing import Dict, List, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from ..config import settings


class MatchingEngine:
    """AI-powered job-candidate matching engine using semantic similarity."""

    def __init__(self):
        # Load pre-trained sentence transformer model for semantic embeddings
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)

    def generate_embedding(self, text: str) -> List[float]:
        """Generate semantic embedding for text."""
        embedding = self.model.encode(text)
        return embedding.tolist()

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings."""
        emb1 = np.array(embedding1).reshape(1, -1)
        emb2 = np.array(embedding2).reshape(1, -1)
        similarity = cosine_similarity(emb1, emb2)[0][0]
        return float(similarity)

    def create_job_embedding_text(self, job: Dict) -> str:
        """Create comprehensive text representation of a job for embedding."""
        text_parts = [
            f"Job Title: {job.get('title', '')}",
            f"Description: {job.get('description', '')}",
            f"Requirements: {job.get('requirements', '')}",
            f"Experience Level: {job.get('experience_level', '')}",
            f"Location: {job.get('location', '')}",
        ]

        if job.get('skills'):
            skills = job['skills'] if isinstance(job['skills'], str) else json.dumps(job['skills'])
            text_parts.append(f"Required Skills: {skills}")

        return " | ".join(text_parts)

    def create_candidate_embedding_text(self, candidate: Dict) -> str:
        """Create comprehensive text representation of a candidate for embedding."""
        text_parts = []

        if candidate.get('resume_text'):
            text_parts.append(candidate['resume_text'][:1000])  # Limit text length

        if candidate.get('skills'):
            skills = candidate['skills'] if isinstance(candidate['skills'], str) else json.dumps(candidate['skills'])
            text_parts.append(f"Skills: {skills}")

        if candidate.get('experience_years'):
            text_parts.append(f"Experience: {candidate['experience_years']} years")

        if candidate.get('education'):
            education = candidate['education'] if isinstance(candidate['education'], str) else json.dumps(candidate['education'])
            text_parts.append(f"Education: {education}")

        if candidate.get('work_experience'):
            work_exp = candidate['work_experience'] if isinstance(candidate['work_experience'], str) else json.dumps(candidate['work_experience'])
            text_parts.append(f"Work Experience: {work_exp}")

        return " | ".join(text_parts)

    def match_candidate_to_job(
        self,
        candidate_embedding: List[float],
        job_embedding: List[float],
        candidate_data: Dict,
        job_data: Dict
    ) -> Tuple[float, str]:
        """
        Match a candidate to a job and provide match score and explanation.

        Returns:
            Tuple of (match_score, explanation)
        """
        # Calculate semantic similarity
        semantic_score = self.calculate_similarity(candidate_embedding, job_embedding)

        # Additional scoring factors
        bonus_score = 0.0
        explanation_parts = []

        # Check experience level match
        candidate_exp = candidate_data.get('experience_years', 0)
        job_exp_level = job_data.get('experience_level', '').lower()

        exp_match = False
        if job_exp_level == 'entry' and candidate_exp <= 2:
            bonus_score += 0.05
            exp_match = True
        elif job_exp_level == 'mid' and 2 <= candidate_exp <= 5:
            bonus_score += 0.05
            exp_match = True
        elif job_exp_level == 'senior' and candidate_exp >= 5:
            bonus_score += 0.05
            exp_match = True

        if exp_match:
            explanation_parts.append(f"Experience level matches {job_exp_level} requirement")

        # Check skill overlap
        candidate_skills = set()
        if candidate_data.get('skills'):
            try:
                skills_data = candidate_data['skills']
                if isinstance(skills_data, str):
                    skills_data = json.loads(skills_data)
                candidate_skills = set(str(s).lower() for s in skills_data)
            except:
                pass

        job_skills = set()
        if job_data.get('skills'):
            try:
                skills_data = job_data['skills']
                if isinstance(skills_data, str):
                    skills_data = json.loads(skills_data)
                job_skills = set(str(s).lower() for s in skills_data)
            except:
                pass

        if candidate_skills and job_skills:
            skill_overlap = candidate_skills.intersection(job_skills)
            skill_match_ratio = len(skill_overlap) / len(job_skills) if job_skills else 0
            bonus_score += skill_match_ratio * 0.1

            if skill_overlap:
                explanation_parts.append(f"Matching skills: {', '.join(list(skill_overlap)[:5])}")

        # Calculate final score
        final_score = min(semantic_score + bonus_score, 1.0)

        # Generate explanation
        explanation_parts.insert(0, f"Semantic similarity: {semantic_score:.2%}")

        if final_score >= 0.8:
            explanation_parts.insert(0, "Excellent match!")
        elif final_score >= 0.6:
            explanation_parts.insert(0, "Good match")
        elif final_score >= 0.4:
            explanation_parts.insert(0, "Moderate match")
        else:
            explanation_parts.insert(0, "Low match")

        explanation = ". ".join(explanation_parts)

        return final_score, explanation

    def find_best_matches(
        self,
        candidate_embedding: List[float],
        jobs: List[Dict],
        candidate_data: Dict,
        top_k: int = 10
    ) -> List[Dict]:
        """
        Find best matching jobs for a candidate.

        Returns:
            List of job matches with scores and explanations
        """
        matches = []

        for job in jobs:
            if not job.get('embedding'):
                continue

            try:
                job_embedding = json.loads(job['embedding'])
                score, explanation = self.match_candidate_to_job(
                    candidate_embedding,
                    job_embedding,
                    candidate_data,
                    job
                )

                if score >= settings.SIMILARITY_THRESHOLD:
                    matches.append({
                        'job_id': job['id'],
                        'job_title': job['title'],
                        'match_score': score,
                        'match_explanation': explanation,
                        'job_details': job
                    })
            except Exception as e:
                print(f"Error matching job {job.get('id')}: {e}")
                continue

        # Sort by match score descending
        matches.sort(key=lambda x: x['match_score'], reverse=True)

        return matches[:top_k]

