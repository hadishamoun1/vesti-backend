import faiss
import numpy as np
from typing import List  # Import List from typing

def search_similar_images(query_features: np.ndarray, db_features: np.ndarray) -> List[str]:
    if db_features.shape[0] == 0:
        return []

    # Create a FAISS index
    index = faiss.IndexFlatL2(db_features.shape[1])
    index.add(db_features)

    # Search for the closest feature
    distances, indices = index.search(np.expand_dims(query_features, axis=0), 1)

    # Return indices of similar images
    return indices.flatten()
