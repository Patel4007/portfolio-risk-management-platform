from fastapi.testclient import TestClient
from app import app
import time

client = TestClient(app)

MAX_LATENCY = 5 

def test_chat_endpoint():

    start = time.time()

    response = client.post("/chat", json={"message": "What is diversification?"})

    elapsed = time.time() - start
    assert response.status_code == 200, "Chat endpoint failed"

    assert response.status_code == 200
    assert "response" in response.json()
    assert len(response.json()["response"]) > 0, "Response is empty"

    assert elapsed <= MAX_LATENCY, f"Chat latency too high: {elapsed:.2f}s"