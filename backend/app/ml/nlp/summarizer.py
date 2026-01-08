"""
Summarizer - Text summarization
"""

from typing import List
import re


class Summarizer:
    """Summarize text documents"""

    def extractive_summary(self, text: str, num_sentences: int = 3) -> str:
        """
        Create extractive summary by selecting important sentences

        Args:
            text: Input text
            num_sentences: Number of sentences in summary

        Returns:
            Summary text
        """
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

        if len(sentences) <= num_sentences:
            return text

        # Simple scoring: prefer longer sentences with more keywords
        scored_sentences = []
        for sentence in sentences:
            words = sentence.lower().split()
            score = len(words)  # Simple length-based scoring
            scored_sentences.append((score, sentence))

        # Sort by score and select top sentences
        scored_sentences.sort(reverse=True)
        top_sentences = [s for _, s in scored_sentences[:num_sentences]]

        # Maintain original order
        summary_sentences = []
        for sentence in sentences:
            if sentence in top_sentences:
                summary_sentences.append(sentence)

        return '. '.join(summary_sentences) + '.'

    def summarize_resume(self, resume_text: str, max_length: int = 150) -> str:
        """
        Create a concise resume summary

        Args:
            resume_text: Full resume text
            max_length: Maximum summary length in words

        Returns:
            Resume summary
        """
        # Extract first few meaningful sentences
        sentences = re.split(r'[.!?]+', resume_text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]

        summary = []
        word_count = 0

        for sentence in sentences[:5]:  # First 5 sentences
            words = sentence.split()
            if word_count + len(words) <= max_length:
                summary.append(sentence)
                word_count += len(words)
            else:
                break

        if not summary:
            # Fallback: just truncate
            words = resume_text.split()[:max_length]
            return ' '.join(words) + '...'

        return '. '.join(summary) + '.'

    def summarize_skills(self, skills: List[str], max_skills: int = 10) -> str:
        """
        Create a skills summary

        Args:
            skills: List of skills
            max_skills: Maximum skills to include

        Returns:
            Formatted skills summary
        """
        if not skills:
            return "No skills specified."

        top_skills = skills[:max_skills]

        if len(top_skills) == 1:
            return f"Skilled in {top_skills[0]}."
        elif len(top_skills) == 2:
            return f"Skilled in {top_skills[0]} and {top_skills[1]}."
        else:
            return f"Skilled in {', '.join(top_skills[:-1])}, and {top_skills[-1]}."

