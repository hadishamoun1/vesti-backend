import faiss
import numpy as np
import json

# Load features from JSON file or define them in your code
def load_features_from_file(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
    return np.array(data['features']), data['filenames']

def save_features_to_file(features, filenames, filename):
    with open(filename, 'w') as f:
        json.dump({'features': features.tolist(), 'filenames': filenames}, f)

def main():
    # Load features
    upload_features, upload_filenames = load_features_from_file('upload_features.json')
    temp_features, temp_filenames = load_features_from_file('temp_features.json')
    
    # Create Faiss index
    dimension = len(upload_features[0])
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(upload_features))

    # Perform search
    temp_features_np = np.array(temp_features)
    distances, indices = index.search(temp_features_np, k=5)  
    
    # Find and return similar images
    similar_images = []
    for i, temp_filename in enumerate(temp_filenames):
        for idx in indices[i]:
            similar_images.append({
                'temp_image': temp_filename,
                'upload_image': upload_filenames[idx],
                'distance': distances[i][idx]
            })

    # Save or print similar images
    with open('similar_images.json', 'w') as f:
        json.dump(similar_images, f)

if __name__ == "__main__":
    main()
