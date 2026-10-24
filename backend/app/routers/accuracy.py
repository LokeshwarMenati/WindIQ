from fastapi import APIRouter, Query, Depends
from typing import Optional

from app.models.schemas import (
    AccuracyMetrics,
    DiurnalAnalysisResponse,
    MonthOverviewResponse
)
from app.services.data_processor import DataProcessor
from app.services.metrics_engine import MetricsEngine

router = APIRouter(prefix="/api/accuracy", tags=["Accuracy Evaluation"])

def get_processor() -> DataProcessor:
    from app.main import processor_instance
    return processor_instance

@router.get("/metrics", response_model=AccuracyMetrics)
def get_accuracy_metrics(
    deliveryDate: Optional[str] = Query(None, description="Optional single delivery date (YYYY-MM-DD) or omit for full month"),
    gateClosureTime: str = Query("11:00", description="Gate closure cutoff time on D-1 (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Returns quantitative error metrics (MAE, RMSE, WAPE, MAPE, MBE, quantiles P10-P95, bias rates)
    for a single day or for all of January 2026.
    """
    if deliveryDate:
        points, _, _ = processor.get_day_ahead_data(deliveryDate, gate_closure_time=gateClosureTime)
        return MetricsEngine.compute_accuracy_metrics(points)
    else:
        overview = MetricsEngine.compute_month_overview(processor, gate_closure_time=gateClosureTime)
        return overview.overallMetrics

@router.get("/diurnal", response_model=DiurnalAnalysisResponse)
def get_diurnal_profile(
    gateClosureTime: str = Query("11:00", description="Gate closure cutoff time on D-1 (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Returns diurnal settlement period profile (periods 1-48) across all of January 2026,
    showing average generation, average forecast, MAE, bias, and P90 risk margin per half-hour.
    """
    stats = MetricsEngine.compute_diurnal_profile(processor, gate_closure_time=gateClosureTime)
    return DiurnalAnalysisResponse(month="2026-01", periods=stats)

@router.get("/monthly-overview", response_model=MonthOverviewResponse)
def get_monthly_overview(
    gateClosureTime: str = Query("11:00", description="Gate closure cutoff time on D-1 (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Returns full month overview with day-by-day error breakdown and aggregate month-wide metrics.
    """
    return MetricsEngine.compute_month_overview(processor, gate_closure_time=gateClosureTime)
