import faiss
import numpy as np
import psycopg2
import pickle

DATABASE_URL = 'postgresql://postgres:70631859HADI@localhost:5432/database'

def fetch_features_from_db():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT image_features FROM products")
    features = cursor.fetchall()
    conn.close()
    return [np.frombuffer(feature[0], dtype=np.float32) for feature in features]

dimension = 4096  
index = faiss.IndexFlatL2(dimension)

features = fetch_features_from_db()
features_np = np.array(features).astype('float32')
index.add(features_np)

faiss.write_index(index, 'faiss_index.idx')
