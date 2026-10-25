"""
FastAPI application for WindIQ — UK Renewable Energy Forecast Analytics Platform.
Engineered for UK Energy Utility Day-Ahead power purchasing desks.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.services.data_processor import DataProcessor
from app.routers import windiq, forecast, accuracy, procurement, sync

# Determine data directory relative to project root or backend folder
base_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
processor_instance = DataProcessor(data_dir=base_data_dir)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing WindIQ UK Day-Ahead Wind Forecast Analytics Platform...")
    processor_instance.ensure_loaded()
    print(f"WindIQ data loaded: {len(processor_instance.actuals)} actuals, {len(processor_instance.forecasts)} forecasts.")
    yield

app = FastAPI(
    title="WindIQ — UK Renewable Energy Forecast Analytics API",
    description="Institutional-grade analytics API for UK electricity utilities to evaluate Elexon wind forecasts, quantify forecasting error margins, eliminate lookahead bias, and optimize day-ahead procurement decisions.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React frontend (Vite local dev + Vercel deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (WindIQ core routes + backward-compatible domain routes)
app.include_router(windiq.router)
app.include_router(forecast.router)
app.include_router(accuracy.router)
app.include_router(procurement.router)
app.include_router(sync.router)

@app.get("/")
def root():
    return {
        "platform": "WindIQ — UK Renewable Energy Forecast Analytics",
        "client": "UK Electricity Utility Day-Ahead Energy Procurement Team",
        "market": "GB Day-Ahead Wholesale Electricity Market (EPEX SPOT / Nord Pool GB)",
        "scope": "Elexon BMRS FUELHH (WIND) and WINDFOR Datasets — January 2026",
        "status": "online",
        "endpoints": [
            "/api/health",
            "/api/overview",
            "/api/forecasts",
            "/api/accuracy",
            "/api/vintages",
            "/api/refresh"
        ],
        "docsUrl": "/docs"
    }

@app.get("/health")
def health_check():
    processor_instance.ensure_loaded()
    return {
        "status": "healthy",
        "app": "WindIQ",
        "isDataLoaded": processor_instance._is_loaded,
        "actualPeriodsCount": len(processor_instance.actuals),
        "forecastRecordsCount": len(processor_instance.forecasts)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
