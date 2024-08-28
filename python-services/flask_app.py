from flask import Flask, request, jsonify
from flask_cors import CORS
from feature_extraction import extract_features
import os

app = Flask(__name__)
CORS(app)  # Allow CORS for all origins

# Define paths
UPLOAD_FOLDER = 'uploads'
TEMP_FOLDER = 'temp'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['TEMP_FOLDER'] = TEMP_FOLDER

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)
@app.route('/',methods=['GET'])
def home():
    return "Flask is working!"

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save the file to the uploads folder
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    # Process the image to extract features
    features = extract_features(file_path)
    return jsonify({'features': features})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
