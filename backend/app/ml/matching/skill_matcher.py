"""
Skill Matcher - Matches candidates based on skill overlap
"""

from typing import List, Tuple, Set


class SkillMatcher:
    """Match candidates to jobs based on skills"""

    def calculate_skill_overlap(self,
                               candidate_skills: List[str],
                               required_skills: List[str]) -> Tuple[float, Set[str], Set[str]]:
        """
        Calculate skill overlap between candidate and job

        Args:
            candidate_skills: List of candidate skills
            required_skills: List of required skills for job

        Returns:
            Tuple of (overlap_ratio, matching_skills, missing_skills)
        """
        candidate_set = set(s.lower().strip() for s in candidate_skills)
        required_set = set(s.lower().strip() for s in required_skills)

        matching = candidate_set.intersection(required_set)
        missing = required_set.difference(candidate_set)

        if not required_set:
            return 0.0, set(), set()

        overlap_ratio = len(matching) / len(required_set)
        return overlap_ratio, matching, missing

    def match(self,
              candidate_skills: List[str],
              required_skills: List[str]) -> Tuple[float, str]:
        """
        Match candidate skills to job requirements

        Args:
            candidate_skills: Candidate's skills
            required_skills: Job's required skills

        Returns:
            Tuple of (score, explanation)
        """
        overlap_ratio, matching, missing = self.calculate_skill_overlap(
            candidate_skills, required_skills
        )

        # Generate explanation
        explanation_parts = []

        if overlap_ratio >= 0.8:
            explanation_parts.append(f"Excellent skill match ({overlap_ratio:.0%})")
        elif overlap_ratio >= 0.6:
            explanation_parts.append(f"Good skill match ({overlap_ratio:.0%})")
        elif overlap_ratio >= 0.4:
            explanation_parts.append(f"Moderate skill match ({overlap_ratio:.0%})")
        else:
            explanation_parts.append(f"Limited skill match ({overlap_ratio:.0%})")

        if matching:
            top_matching = list(matching)[:5]
            explanation_parts.append(f"Matching skills: {', '.join(top_matching)}")

        if missing:
            top_missing = list(missing)[:3]
            explanation_parts.append(f"Missing: {', '.join(top_missing)}")

        explanation = ". ".join(explanation_parts)

        return overlap_ratio, explanation

