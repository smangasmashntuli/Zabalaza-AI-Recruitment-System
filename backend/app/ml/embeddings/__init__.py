"""
Embeddings Package - Text embedding utilities
"""

from .sentence_embeddings import SentenceEmbeddings
from .vector_store import VectorStore
from .similarity import SimilarityCalculator

__all__ = [
    "SentenceEmbeddings",
    "VectorStore",
    "SimilarityCalculator"
]

