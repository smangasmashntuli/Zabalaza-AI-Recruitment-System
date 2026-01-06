"""
Text embedding generation and management
"""

import pickle
from pathlib import Path
from sentence_transformers import SentenceTransformer

_MODEL_CACHE = {}


def load_embedding_model(model_name='all-MiniLM-L6-v2', force_reload=False):
    """Load embedding model with caching"""
    if not force_reload and model_name in _MODEL_CACHE:
        return _MODEL_CACHE[model_name]

    model = SentenceTransformer(model_name)
    _MODEL_CACHE[model_name] = model
    return model


def generate_embedding(text: str, model_name='all-MiniLM-L6-v2') -> List[float]:
    """Generate embedding for text"""
    model = load_embedding_model(model_name)
    return model.encode(text).tolist()


__all__ = ["load_embedding_model", "generate_embedding"]