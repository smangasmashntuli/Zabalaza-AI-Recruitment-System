"""
ML Package - Machine Learning Engine for AI-Powered Recruitment
This is the brain of the recruitment system.

Contains:
- Resume parsing with NER
- Semantic job-candidate matching
- Skill classification and extraction
- Experience and education parsing
- Bias detection
- Ranking algorithms
"""

__version__ = "1.0.0"

# Lazy imports to avoid circular dependencies
# Import submodules directly when needed:
# from ml.resume_parser import ResumeParser
# from ml.matching import HybridMatcher
# from ml.embeddings import SentenceEmbeddings

__all__ = [
    "resume_parser",
    "matching",
    "embeddings",
    "nlp",
    "utils",
]

