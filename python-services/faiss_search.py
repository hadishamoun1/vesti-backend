import faiss
import numpy as np
from typing import List

def normalize_features(features: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(features, axis=1, keepdims=True)
    return features / norms

def search_similar_images(query_features: np.ndarray, db_features: np.ndarray) -> List[int]:
    if db_features.shape[0] == 0:
        return []

    # Normalize features
    db_features = normalize_features(db_features)
    query_features = normalize_features(np.expand_dims(query_features, axis=0))

    # Create a FAISS index
    index = faiss.IndexFlatIP(db_features.shape[1])  # Use Inner Product (dot product) for similarity
    index.add(db_features)

    # Search for the most similar feature
    distances, indices = index.search(query_features,5)  # Get top 5 similar images

    # Return indices of similar images
    return indices.flatten()
