# Portfolio Risk Management Platform

A portfolio risk management and analytics platform designed to model, analyze and visualize financial risk using statistical and quantitative methods. This project demonstrates end-to-end system design, high-performance risk computation and data-driven financial analytics.

## Project Objective

The goal of this project is to simulate a real-world portfolio risk system similar to those used by asset managers, hedge funds, and risk teams. It focuses on:

- Quantitative risk modeling
- Portfolio-level analytics
- Scenario-based stress testing
- Systems-oriented engineering design

## System Architecture

The platform is built as a modular system with clearly separated responsibilities:

- **frontend/** - Portfolio dashboard & analytics UI
- **backend/**  - API layer & orchestration logic
- **var_engine** - C++ risk engine
- **supabase/functions/server/** - Serverless backend utilities
- **utils/supabase/** - Database & auth helpers
- **risk_metrics.py** - Core Risk Metrics (portfolio beta, max drawdown, rolling volatility, sharpe ratio) computation logic
- **main.cpp** - Risk engine entry point
- **docker-compose.yml** - Local development environment

## Core Features

### Portfolio Management & Analytics
- Portfolio construction and tracking
- Asset-level and portfolio-level metrics
- Exposure and allocation analysis

### Risk Engine (C++)
- Risk Metrics: Value-at-Risk (VaR) and Expected Shortfall (ES)

### Market Scenario Analysis
- Simulated macroeconomic scenarios:
  - Market recession
  - Inflationary environments
  - Economic expansion
- Stress testing portfolio resilience under adverse conditions

### AI Portfolio Assistant
- Interprets risk metrics, explains portfolio risk drivers and provides analytical insights (non-advisory)

## Technology Stack

- Frontend -       React + TypeScript 
- Backend API -    Python / FastAPI 
- Risk Engine -    C++ 
- Database -       PostgreSQL (via Supabase) 
- Serverless -     Supabase Functions 
- DevOps -         Docker, Github Actions 


## Project Setup

### Clone Repository

```bash
git clone https://github.com/Patel4007/portfolio-risk-management-platform.git
cd portfolio-risk-management-platform
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

### Risk Engine

```bash
mkdir build && cd build
cmake ..
make
./var_engine
```
