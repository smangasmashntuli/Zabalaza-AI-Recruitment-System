"""
Feature Engineering for ML Models
"""

import numpy as np
from typing import Dict, List


def feature_engineering(data: Dict) -> np.ndarray:
    """
    Convert structured data to feature vector

    Args:
        data: Dictionary with candidate/job data

    Returns:
        Feature vector
    """
    features = []

    # Experience features
    features.append(data.get('experience_years', 0))

    # Skill count
    skills = data.get('skills', [])
    if isinstance(skills, str):
        import json
        try:
            skills = json.loads(skills)
        except:
            skills = []
    features.append(len(skills))

    # Education level (encoded)
    education_map = {
        'doctorate': 4,
        'master': 3,
        'bachelor': 2,
        'associate': 1,
        'unknown': 0
    }
    edu_level = data.get('education_level', 'unknown').lower()
    features.append(education_map.get(edu_level, 0))

    return np.array(features)


def normalize_features(features: np.ndarray) -> np.ndarray:
    """Normalize feature vectors"""
    if features.ndim == 1:
        features = features.reshape(1, -1)

    mean = features.mean(axis=0)
    std = features.std(axis=0) + 1e-8

    return (features - mean) / std

