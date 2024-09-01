from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
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

UPLOAD_DIR = "uploads"
TEMP_DIR = "temp"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    temp_file_path = os.path.join(TEMP_DIR, file.filename)
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    temp_features = extract_features(temp_file_path)
    
    similar_images = []
    for image_file in os.listdir(UPLOAD_DIR):
        image_path = os.path.join(UPLOAD_DIR, image_file)
        features = extract_features(image_path)
        if features.size == 0:
            continue
        
        indices = search_similar_images(temp_features, np.array([features]))
        if len(indices) > 0:
            similar_images.append(image_file)

    os.remove(temp_file_path)
    
    return JSONResponse(content={"similar_images": similar_images})

@app.post("/add-upload/")
async def add_upload(file: UploadFile = File(...)):
    # Save uploaded file to uploads directory
    upload_file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(upload_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}


@app.post("/process-image/")
async def process_image(image: UploadFile = File(...)):
    # Read the uploaded image
    image_data = await image.read()
    image = Image.open(io.BytesIO(image_data))
    image_np = np.array(image)

    # Convert the image to RGB
    image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)

    # Perform pose estimation
    results = pose.process(image_rgb)

    # Extract keypoints
    keypoints = []
    if results.pose_landmarks:
        for landmark in results.pose_landmarks.landmark:
            keypoints.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z
            })

    return {"keypoints": keypoints}