from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from feature_extraction import extract_features
import os
import numpy as np
import json

app = FastAPI()

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths
UPLOAD_FOLDER = 'uploads'
TEMP_FOLDER = 'temp'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "FastAPI is working!"}

def extract_features_from_folder(folder_path):
    features_list = []
    filenames = []
    for filename in os.listdir(folder_path):
        if filename.endswith(('.jpg', '.jpeg', '.png')):
            file_path = os.path.join(folder_path, filename)
            features = extract_features(file_path)
            features_list.append(features)
            filenames.append(filename)
    return features_list, filenames

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file part")
    
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    try:
        upload_features, upload_filenames = extract_features_from_folder(UPLOAD_FOLDER)
        temp_features, temp_filenames = extract_features_from_folder(TEMP_FOLDER)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    

    return {
        "upload_features": upload_features,
        "upload_filenames": upload_filenames,
        "temp_features": temp_features,
        "temp_filenames": temp_filenames
    }
