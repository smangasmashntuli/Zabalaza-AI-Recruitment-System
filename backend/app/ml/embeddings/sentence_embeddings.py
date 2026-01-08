"""
Sentence Embeddings - Wrapper for SentenceTransformer
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Union


class SentenceEmbeddings:
    """Generate semantic embeddings for text"""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize sentence embeddings

        Args:
            model_name: HuggingFace model name
        """
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()

    def encode(self, text: Union[str, List[str]]) -> np.ndarray:
        """
        Encode text to embedding vector(s)

        Args:
            text: Single text or list of texts

        Returns:
            Embedding array
        """
        if isinstance(text, str):
            return self.model.encode(text)
        else:
            return self.model.encode(text)

    def encode_batch(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Encode multiple texts in batches

        Args:
            texts: List of texts
            batch_size: Batch size for encoding

        Returns:
            Array of embeddings
        """
        return self.model.encode(texts, batch_size=batch_size, show_progress_bar=True)

    def get_dimension(self) -> int:
        """Get embedding dimension"""
        return self.embedding_dim

