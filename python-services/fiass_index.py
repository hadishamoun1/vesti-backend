import faiss
import numpy as np
import json

def load_features_from_json(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
    return np.array(data['features'], dtype=np.float32), data['filenames']

def main():
    # Load features
    upload_features, upload_filenames = load_features_from_json('upload_features.json')
    temp_features, temp_filenames = load_features_from_json('temp_features.json')

    # Create Faiss index
    dimension = len(upload_features[0])  # Get dimension from feature size
    index = faiss.IndexFlatL2(dimension)

    # Add upload features to index
    index.add(upload_features)

    # Search for similar features
    distances, indices = index.search(np.array(temp_features, dtype=np.float32), k=5)  # Search for top 5 matches

    # Save results
    similar_images = {}
    for i, temp_filename in enumerate(temp_filenames):
        similar_images[temp_filename] = [upload_filenames[idx] for idx in indices[i]]

    with open('similar_images.json', 'w') as f:
        json.dump(similar_images, f, indent=4)

if __name__ == '__main__':
    main()
