from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
import shutil
import os
import numpy as np
from feature_extraction import extract_features
from faiss_search import search_similar_images
import mediapipe as mp
import cv2
from PIL import Image
import io

app = FastAPI()

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

UPLOAD_DIR = "../productImages"
TEMP_DIR = "temp"


os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)



def remove_background(image: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    lower_bound = np.array([0, 0, 200]) 
    upper_bound = np.array([180, 25, 255]) 

    mask = cv2.inRange(hsv, lower_bound, upper_bound)
    mask_inv = cv2.bitwise_not(mask)

    result = cv2.bitwise_and(image, image, mask=mask_inv)

    result_rgba = cv2.cvtColor(result, cv2.COLOR_BGR2BGRA)
    result_rgba[:, :, 3] = cv2.bitwise_not(mask)  

    return result_rgba

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    temp_file_path = os.path.join(TEMP_DIR, file.filename)
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    temp_features = extract_features(temp_file_path)
    
    similar_images = []
    db_features = []  # This will hold features of images in UPLOAD_DIR

    # Extract features for all images in the uploads directory
    for image_file in os.listdir(UPLOAD_DIR):
        image_path = os.path.join(UPLOAD_DIR, image_file)
        features = extract_features(image_path)
        if features.size > 0:
            db_features.append(features)

    db_features = np.array(db_features)

    # Search for similar images
    indices = search_similar_images(temp_features, db_features)
    
    if len(indices) > 0:
        # Map indices back to image filenames
        for index in indices:
            if index < len(os.listdir(UPLOAD_DIR)):
                similar_images.append(os.listdir(UPLOAD_DIR)[index])

    os.remove(temp_file_path)
    
    return JSONResponse(content={"similar_images": similar_images})


@app.post("/add-upload/")
async def add_upload(file: UploadFile = File(...)):
    upload_file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(upload_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}




