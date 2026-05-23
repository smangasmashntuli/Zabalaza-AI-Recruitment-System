"""
Ranking Engine - Ranks and filters match results
"""

from typing import List, Dict
import numpy as np


class RankingEngine:
    """Rank and filter matching results"""
    
    def rank(self,
             matches: List[Dict],
             top_k: int = 10,
             min_score: float = 0.0) -> List[Dict]:
        """
        Rank matches by score
        
        Args:
            matches: List of match dictionaries
            top_k: Return top K matches
            min_score: Minimum score threshold
        
        Returns:
            Ranked and filtered matches
        """
        # Filter by minimum score
        filtered = [m for m in matches if m.get('score', 0) >= min_score]
        
        # Sort by score descending
        ranked = sorted(filtered, key=lambda x: x.get('score', 0), reverse=True)
        
        # Return top K
        return ranked[:top_k]
    
    def diversify(self,
                  matches: List[Dict],
                  diversity_factor: float = 0.3) -> List[Dict]:
        """
        Apply diversity to avoid too similar results
        
        Args:
            matches: Ranked matches
            diversity_factor: How much to penalize similarity (0-1)
        
        Returns:
            Diversified matches
        """
        if len(matches) <= 1:
            return matches
        
        diversified = [matches[0]]  # Always include top match
        
        for match in matches[1:]:
            # Calculate similarity to already selected
            # (simplified - in production, use embeddings)
            penalty = diversity_factor * (1 / len(diversified))
            adjusted_score = match['score'] * (1 - penalty)
            match['adjusted_score'] = adjusted_score
            diversified.append(match)
        
        # Re-sort by adjusted score
        diversified.sort(key=lambda x: x.get('adjusted_score', x['score']), reverse=True)
        
        return diversified
    
    def explain_ranking(self, matches: List[Dict]) -> str:
        """
        Generate explanation of ranking
        
        Args:
            matches: Ranked matches
        
        Returns:
            Explanation string
        """
        if not matches:
            return "No matches found."
        
        explanation = f"Found {len(matches)} matches. "
        
        score_ranges = {
            'excellent': len([m for m in matches if m['score'] >= 0.8]),
            'good': len([m for m in matches if 0.6 <= m['score'] < 0.8]),
            'moderate': len([m for m in matches if 0.4 <= m['score'] < 0.6]),
            'low': len([m for m in matches if m['score'] < 0.4])
        }
        
        breakdown = []
        for level, count in score_ranges.items():
            if count > 0:
                breakdown.append(f"{count} {level}")
        
        explanation += "Match quality: " + ", ".join(breakdown) + "."
        
        return explanation

