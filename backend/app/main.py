"""
FastAPI application for UK Day-Ahead Wind Forecast & Procurement Decision Platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.services.data_processor import DataProcessor
from app.routers import forecast, accuracy, procurement, sync

# Determine data directory relative to project root or backend folder
base_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
processor_instance = DataProcessor(data_dir=base_data_dir)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing UK Day-Ahead Wind Intelligence Platform...")
    processor_instance.ensure_loaded()
    print(f"Data ready: {len(processor_instance.actuals)} actuals, {len(processor_instance.forecasts)} forecasts.")
    yield

app = FastAPI(
    title="UK Day-Ahead Wind Forecast & Procurement Intelligence Platform",
    description="Customized platform for UK Energy Utility trading desks to evaluate Elexon wind forecasts, quantify forecasting error margins, and optimize day-ahead thermal power procurement.",
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

# Register routers
app.include_router(forecast.router)
app.include_router(accuracy.router)
app.include_router(procurement.router)
app.include_router(sync.router)

@app.get("/")
def root():
    return {
        "platform": "UK Day-Ahead Wind Forecast & Procurement Platform",
        "client": "UK Energy Utility Power Purchasing Team",
        "market": "GB Day-Ahead Electricity Market (EPEX SPOT / Nord Pool GB)",
        "scope": "Elexon FUELHH (WIND) and WINDFOR Datasets - January 2026",
        "status": "online",
        "docsUrl": "/docs"
    }

@app.get("/health")
def health_check():
    processor_instance.ensure_loaded()
    return {
        "status": "healthy",
        "isDataLoaded": processor_instance._is_loaded,
        "actualPeriodsCount": len(processor_instance.actuals),
        "forecastRecordsCount": len(processor_instance.forecasts)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
