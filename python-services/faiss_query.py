import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()


index = faiss.read_index('faiss_index.idx')

class FeatureRequest(BaseModel):
    features: list

@app.post("/query")
async def query_features(request: FeatureRequest):
    try:
        features_np = np.array(request.features).astype('float32')
        _, indices = index.search(features_np, k=100)  
        return {"indices": indices.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
