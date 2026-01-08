"""
Experience Matcher - Matches based on experience level
"""

from typing import Tuple


class ExperienceMatcher:
    """Match candidates based on experience requirements"""

    def match(self,
              candidate_years: float,
              job_level: str,
              required_years: float = None) -> Tuple[float, str]:
        """
        Match candidate experience to job requirements

        Args:
            candidate_years: Years of experience
            job_level: Job level (entry, mid, senior, lead)
            required_years: Explicit years required (optional)

        Returns:
            Tuple of (score, explanation)
        """
        job_level = job_level.lower() if job_level else ""

        # Define experience ranges for each level
        level_ranges = {
            "entry": (0, 2),
            "junior": (0, 3),
            "mid": (2, 7),
            "senior": (5, 15),
            "lead": (7, 20),
            "principal": (10, 30),
            "architect": (10, 30)
        }

        # Get range for job level
        min_years, max_years = level_ranges.get(job_level, (0, 50))

        # Use explicit requirement if provided
        if required_years:
            min_years = max(0, required_years - 2)
            max_years = required_years + 5

        # Calculate score
        if min_years <= candidate_years <= max_years:
            # Perfect match
            score = 1.0
            explanation = f"Experience level matches perfectly ({candidate_years} years for {job_level} role)"
        elif candidate_years < min_years:
            # Under-qualified
            gap = min_years - candidate_years
            score = max(0.0, 1.0 - (gap / 5))  # Reduce score by gap
            explanation = f"Slightly under-qualified ({candidate_years} years, {job_level} typically needs {min_years}+ years)"
        else:
            # Over-qualified
            excess = candidate_years - max_years
            score = max(0.5, 1.0 - (excess / 10))  # Still decent score
            explanation = f"Over-qualified ({candidate_years} years for {job_level} role)"

        return score, explanation

