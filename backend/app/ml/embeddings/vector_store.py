"""
Vector Store - Store and retrieve embedding vectors
"""

import numpy as np
import json
from typing import Dict, List, Optional
from pathlib import Path


class VectorStore:
    """Store and retrieve embedding vectors efficiently"""

    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize vector store

        Args:
            storage_path: Path to store vectors (optional)
        """
        self.storage_path = storage_path
        self.vectors = {}  # id -> vector mapping
        self.metadata = {}  # id -> metadata mapping

    def add(self, vector_id: str, vector: np.ndarray, metadata: Dict = None):
        """
        Add vector to store

        Args:
            vector_id: Unique identifier
            vector: Embedding vector
            metadata: Optional metadata
        """
        self.vectors[vector_id] = vector
        if metadata:
            self.metadata[vector_id] = metadata

    def get(self, vector_id: str) -> Optional[np.ndarray]:
        """Get vector by ID"""
        return self.vectors.get(vector_id)

    def get_all(self) -> Dict[str, np.ndarray]:
        """Get all vectors"""
        return self.vectors

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> List[tuple]:
        """
        Search for similar vectors

        Args:
            query_vector: Query embedding
            top_k: Number of results

        Returns:
            List of (id, similarity_score) tuples
        """
        from sklearn.metrics.pairwise import cosine_similarity

        if not self.vectors:
            return []

        # Calculate similarities
        similarities = []
        for vec_id, vec in self.vectors.items():
            sim = cosine_similarity(query_vector.reshape(1, -1), vec.reshape(1, -1))[0][0]
            similarities.append((vec_id, float(sim)))

        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]

    def save(self, path: str = None):
        """
        Save vectors to disk

        Args:
            path: Storage path (uses default if not provided)
        """
        save_path = path or self.storage_path
        if not save_path:
            raise ValueError("No storage path specified")

        save_path = Path(save_path)
        save_path.mkdir(parents=True, exist_ok=True)

        # Save vectors
        vectors_dict = {k: v.tolist() for k, v in self.vectors.items()}
        with open(save_path / "vectors.json", "w") as f:
            json.dump(vectors_dict, f)

        # Save metadata
        with open(save_path / "metadata.json", "w") as f:
            json.dump(self.metadata, f)

    def load(self, path: str = None):
        """
        Load vectors from disk

        Args:
            path: Storage path (uses default if not provided)
        """
        load_path = path or self.storage_path
        if not load_path:
            raise ValueError("No storage path specified")

        load_path = Path(load_path)

        # Load vectors
        with open(load_path / "vectors.json", "r") as f:
            vectors_dict = json.load(f)
            self.vectors = {k: np.array(v) for k, v in vectors_dict.items()}

        # Load metadata
        if (load_path / "metadata.json").exists():
            with open(load_path / "metadata.json", "r") as f:
                self.metadata = json.load(f)

    def clear(self):
        """Clear all vectors"""
        self.vectors = {}
        self.metadata = {}

