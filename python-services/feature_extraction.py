import tensorflow as tf
from tensorflow.keras.applications import VGG16
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.vgg16 import preprocess_input
import numpy as np
import os
import json

model = VGG16(weights='imagenet', include_top=False, pooling='avg')

def extract_features(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    features = model.predict(img_array)
    return features.flatten().tolist() 

def extract_features_from_folder(folder_path):
    features_list = []
    filenames = []
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            features = extract_features(file_path)
            features_list.append(features)
            filenames.append(filename)
    return features_list, filenames


UPLOAD_FOLDER = 'uploads'
TEMP_FOLDER = 'temp'

upload_features, upload_filenames = extract_features_from_folder(UPLOAD_FOLDER)
temp_features, temp_filenames = extract_features_from_folder(TEMP_FOLDER)

with open('upload_features.json', 'w') as f:
    json.dump({'features': upload_features, 'filenames': upload_filenames}, f)

with open('temp_features.json', 'w') as f:
    json.dump({'features': temp_features, 'filenames': temp_filenames}, f)
