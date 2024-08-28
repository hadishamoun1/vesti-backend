from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np

app = Flask(__name__)

# Load pre-trained ResNet50 model for feature extraction
model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

def extract_features(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    features = model.predict(img_array)
    return features.flatten().tolist()

@app.route('/extract_features', methods=['POST'])
def get_features():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    img_path = f"/tmp/{file.filename}"
    file.save(img_path)

    features = extract_features(img_path)
    return jsonify({'features': features})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
