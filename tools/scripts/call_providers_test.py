from fastapi.testclient import TestClient
from fastapi import FastAPI
from backend.routes.streaming.streaming_api import router as streaming_router

app = FastAPI()
app.include_router(streaming_router)
client = TestClient(app)
resp = client.get('/streaming/providers')
print('STATUS', resp.status_code)
print('BODY', resp.text)
