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

UPLOAD_DIR = "uploads"
TEMP_DIR = "temp"
UPLOAD_TEMP_DIR = "uploads_temp"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(UPLOAD_TEMP_DIR, exist_ok=True)

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

def overlay_clothing_on_user(user_image: np.ndarray, clothing_image: np.ndarray, keypoints: list, scale_factor: float = 3.0) -> np.ndarray:
    user_height, user_width, _ = user_image.shape

    if len(keypoints) < 4:
        return user_image  # Not enough keypoints to proceed

    left_shoulder = keypoints[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    right_shoulder = keypoints[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    left_hip = keypoints[mp_pose.PoseLandmark.LEFT_HIP.value]
    right_hip = keypoints[mp_pose.PoseLandmark.RIGHT_HIP.value]

    # Calculate bounding box coordinates
    x_min = int(min(left_shoulder['x'], right_shoulder['x']) * user_width)
    x_max = int(max(left_shoulder['x'], right_shoulder['x']) * user_width)
    y_min = int(min(left_shoulder['y'], left_hip['y']) * user_height)
    y_max = int(max(left_hip['y'], right_hip['y']) * user_height)

    # Ensure bounding box is within image bounds
    x_min = max(x_min, 0)
    y_min = max(y_min, 0)
    x_max = min(x_max, user_width)
    y_max = min(y_max, user_height)

    # Calculate bounding box dimensions
    bbox_width = x_max - x_min
    bbox_height = y_max - y_min

    # Scale the dimensions of the bounding box
    scaled_bbox_width = int(bbox_width * scale_factor)
    scaled_bbox_height = int(bbox_height * scale_factor)

    # Resize clothing image to fit the scaled bounding box
    clothing_resized = cv2.resize(clothing_image, (scaled_bbox_width, scaled_bbox_height))

    # Define perspective transformation points
    src_points = np.array([
        [0, 0],
        [clothing_resized.shape[1], 0],
        [clothing_resized.shape[1], clothing_resized.shape[0]],
        [0, clothing_resized.shape[0]]
    ], dtype=np.float32)

    dst_points = np.array([
        [x_min - (scaled_bbox_width - bbox_width) // 2, y_min - (scaled_bbox_height - bbox_height) // 2],
        [x_min + bbox_width + (scaled_bbox_width - bbox_width) // 2, y_min - (scaled_bbox_height - bbox_height) // 2],
        [x_min + bbox_width + (scaled_bbox_width - bbox_width) // 2, y_min + bbox_height + (scaled_bbox_height - bbox_height) // 2],
        [x_min - (scaled_bbox_width - bbox_width) // 2, y_min + bbox_height + (scaled_bbox_height - bbox_height) // 2]
    ], dtype=np.float32)

    # Compute perspective transformation matrix
    matrix = cv2.getPerspectiveTransform(src_points, dst_points)

    # Apply the perspective transformation to the clothing image
    transformed_clothing = cv2.warpPerspective(clothing_resized, matrix, (user_width, user_height))

    # Remove the background from the clothing image
    clothing_no_bg = remove_background(transformed_clothing)

    # Convert user image to RGBA for blending
    user_rgba = cv2.cvtColor(user_image, cv2.COLOR_BGR2BGRA)

    # Alpha blending the clothing onto the user image
    combined_rgba = cv2.addWeighted(user_rgba, 1.0, clothing_no_bg, 0.7, 0)

    # Convert back to BGR
    combined_bgr = cv2.cvtColor(combined_rgba, cv2.COLOR_BGRA2BGR)

    return combined_bgr



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
    upload_file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(upload_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}

@app.post("/upload-img/")
async def add_upload(file: UploadFile = File(...)):
    upload_file_path = os.path.join(UPLOAD_TEMP_DIR, file.filename)
    with open(upload_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}

@app.post("/process-image/")
async def process_image(image: UploadFile = File(...)):
    image_data = await image.read()
    image = Image.open(io.BytesIO(image_data))
    image_np = np.array(image)

    image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)

    results = pose.process(image_rgb)

    keypoints = extract_keypoints(results)

    return {"keypoints": keypoints}

@app.post("/virtual-try-on/")
async def virtual_try_on(user_image: UploadFile = File(...)):
    try:
        clothing_image_path = os.path.join(UPLOAD_TEMP_DIR, "1992.jpg")  

        if not os.path.exists(clothing_image_path):
            return JSONResponse(content={"error": "Clothing image not found"}, status_code=404)
        
        user_image_data = await user_image.read()
        user_image_pil = Image.open(io.BytesIO(user_image_data))
        user_image_np = np.array(user_image_pil)
        user_image_rgb = cv2.cvtColor(user_image_np, cv2.COLOR_BGR2RGB)

        results = pose.process(user_image_rgb)
        user_keypoints = extract_keypoints(results)

        clothing_image_pil = Image.open(clothing_image_path)
        clothing_image_np = np.array(clothing_image_pil)
        
        final_image = overlay_clothing_on_user(user_image_np, clothing_image_np, user_keypoints)
        
        final_image_pil = Image.fromarray(final_image)
        buffered = io.BytesIO()
        final_image_pil.save(buffered, format="PNG")
        buffered.seek(0)

        return StreamingResponse(buffered, media_type="image/png")

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
