from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import random

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"message": "A1Betting Backend Running on 8001"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/prizepicks/props")
def get_props():
    return [{"id": f"prop_{i}", "player_name": f"Player {i}", "stat_type": "Points", "line": 25.5, "confidence": 85} for i in range(10)]

if __name__ == "__main__":
    print("Starting on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
