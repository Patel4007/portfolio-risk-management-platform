from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from chat_engine import ChatEngine
from engine import run_scenario
from data_ingestion import compute_portfolio_risk_dynamic
from typing import List
import math

app = FastAPI()

chat_engine = ChatEngine(model_path="models/gguf/qwen2.5-3b-finance.gguf")

def clean_data(obj):
    if isinstance(obj, dict):
        return {k: clean_data(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_data(i) for i in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None  # or 0, or some safe fallback
        else:
            return obj
    else:
        return obj

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/risk")
async def risk_endpoint(data: dict):
    tickers: List[str] = data.get("tickers", [])
    weights: List[float] = data.get("weights", [])
    portfolio_value = data.get("portfolio_value", 0)

    if not tickers or not weights or len(tickers) != len(weights):
        return {"error": "tickers and weights must be provided and same length."}

    risk_data = compute_portfolio_risk_dynamic(tickers, weights, portfolio_value)
    clean_risk_data = clean_data(risk_data)
    return clean_risk_data

@app.post("/run-scenario")
async def run_scenario_api(request: Request):
    data = await request.json()
    scenario_id = data.get("scenarioId")
    portfolio = data.get("portfolio", {})
    portfolio_value = data.get("portfolioValue", 0)
    

    result = run_scenario(scenario_id, portfolio, portfolio_value)
    return result


@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_message = data.get("message", "")

    if not user_message:
        return {"error": "No message provided"}

    response_text = ""
    for chunk in chat_engine.stream_response(user_message):
        response_text += chunk

    return {
        "response": response_text,
        "model": chat_engine.model_name,
    }