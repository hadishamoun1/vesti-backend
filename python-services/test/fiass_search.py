import faiss
import numpy as np
from typing import List

def search_similar_images(query_features: np.ndarray, db_features: np.ndarray) -> List[str]:
    if db_features.shape[0] == 0:
        return []

    # Create an advanced FAISS index
    d = db_features.shape[1]  # Dimension of features
    nlist = 100  # Number of clusters
    quantizer = faiss.IndexFlatL2(d)  # This remains the same
    index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_L2)  # Use IVF index

    # Train the index
    index.train(db_features)
    index.add(db_features)

    # Search for the closest feature
    distances, indices = index.search(np.expand_dims(query_features, axis=0), 1)

    # Return indices of similar images
    return indices.flatten()