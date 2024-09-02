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
UPLOAD_TEMP_DIR = "uploads_temp"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

def extract_keypoints(results):
    keypoints = []
    if results.pose_landmarks:
        for landmark in results.pose_landmarks.landmark:
            keypoints.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z
            })
    return keypoints


def overlay_clothing_on_user(user_image: np.ndarray, clothing_image: np.ndarray, keypoints: list) -> np.ndarray:
    # Convert user and clothing images to the same size
    user_height, user_width, _ = user_image.shape
    clothing_resized = cv2.resize(clothing_image, (user_width, user_height))

    # Create a mask for the clothing image
    mask = np.zeros((user_height, user_width), dtype=np.uint8)
    for kp in keypoints:
        x = int(kp['x'] * user_width)
        y = int(kp['y'] * user_height)
        cv2.circle(mask, (x, y), 10, (255), -1)  # Draw circles around keypoints

    # Use the mask to overlay clothing image onto user image
    clothing_masked = cv2.bitwise_and(clothing_resized, clothing_resized, mask=mask)
    user_masked = cv2.bitwise_and(user_image, user_image, mask=cv2.bitwise_not(mask))
    final_image = cv2.add(user_masked, clothing_masked)

    return final_image


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


@app.post("/upload-img/")
async def add_upload(file: UploadFile = File(...)):
    # Save uploaded file to uploads directory
    upload_file_path = os.path.join(UPLOAD_TEMP_DIR, file.filename)
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
    keypoints = extract_keypoints(results)

    return {"keypoints": keypoints}

@app.post("/virtual-try-on/")
async def virtual_try_on(user_image: UploadFile = File(...), clothing_image: UploadFile = File(...)):
    # Read and process the user image
    user_image_data = await user_image.read()
    user_image_pil = Image.open(io.BytesIO(user_image_data))
    user_image_np = np.array(user_image_pil)
    user_image_rgb = cv2.cvtColor(user_image_np, cv2.COLOR_BGR2RGB)
    
    # Perform pose estimation
    results = pose.process(user_image_rgb)
    user_keypoints = extract_keypoints(results)

    # Read and process the clothing image
    clothing_image_data = await clothing_image.read()
    clothing_image_pil = Image.open(io.BytesIO(clothing_image_data))
    clothing_image_np = np.array(clothing_image_pil)
    
    # Perform feature extraction for clothing
    clothing_features = extract_features(clothing_image_np)
    
    # Match clothing features to user pose (implementation-specific)
    # This might involve warping the clothing image based on keypoints

    # Generate the final image with clothing overlaid
    final_image = overlay_clothing_on_user(user_image_np, clothing_image_np, user_keypoints)
    
    # Convert final image to bytes
    final_image_pil = Image.fromarray(final_image)
    buffered = io.BytesIO()
    final_image_pil.save(buffered, format="PNG")
    img_str = buffered.getvalue()

    return JSONResponse(content={"image": img_str})