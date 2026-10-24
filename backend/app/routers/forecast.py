from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional

from app.models.schemas import (
    DayAheadAnalysisResponse,
    ForecastEvolutionResponse
)
from app.services.data_processor import DataProcessor
from app.services.metrics_engine import MetricsEngine

router = APIRouter(prefix="/api/forecast", tags=["Forecast"])

def get_processor() -> DataProcessor:
    from app.main import processor_instance
    return processor_instance

@router.get("/available-dates", response_model=List[str])
def get_available_dates(processor: DataProcessor = Depends(get_processor)):
    """Returns all available delivery dates in January 2026."""
    dates = processor.get_available_dates()
    if not dates:
        raise HTTPException(status_code=404, detail="No data available")
    return dates

@router.get("/day-ahead", response_model=DayAheadAnalysisResponse)
def get_day_ahead_forecast(
    deliveryDate: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    gateClosureTime: str = Query("11:00", description="Gate closure cutoff time on D-1 (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Get 48 half-hourly settlement periods for a delivery date with the Day-Ahead forecast
    frozen at gate closure cutoff on D-1, plus outturn actuals and accuracy metrics.
    """
    points, decision_date, cutoff_str = processor.get_day_ahead_data(
        deliveryDate,
        gate_closure_time=gateClosureTime
    )
    metrics = MetricsEngine.compute_accuracy_metrics(points)

    return DayAheadAnalysisResponse(
        deliveryDate=deliveryDate,
        decisionDate=decision_date,
        gateClosureTime=gateClosureTime,
        actualCutoffUsed=cutoff_str,
        metrics=metrics,
        halfHourlyData=points
    )

@router.get("/evolution", response_model=ForecastEvolutionResponse)
def get_forecast_evolution(
    startTime: str = Query(..., description="Target settlement start time in ISO format (e.g. 2026-01-15T12:00:00Z)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Trace the multi-horizon evolution of wind forecast for a single half-hour period
    from 48+ hours out down to delivery.
    """
    return processor.get_forecast_evolution(startTime)
