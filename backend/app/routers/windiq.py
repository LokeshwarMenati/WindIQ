"""
WindIQ core API endpoints specified in requirements:
- GET /api/health
- GET /api/overview?start_date=2026-01-01&end_date=2026-01-31
- GET /api/forecasts?delivery_date=2026-01-15
- GET /api/accuracy?start_date=2026-01-01&end_date=2026-01-31
- GET /api/vintages?delivery_date=2026-01-15
- POST /api/refresh
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List
from datetime import datetime, timezone

from app.models.schemas import (
    OverviewResponse,
    ForecastsResponse,
    AccuracyResponse,
    VintagesResponse,
    RefreshResponse
)
from app.services.data_processor import DataProcessor
from app.services.metrics_engine import MetricsEngine

router = APIRouter(prefix="/api", tags=["WindIQ Analytics"])

def get_processor() -> DataProcessor:
    from app.main import processor_instance
    return processor_instance

@router.get("/health")
def get_api_health(processor: DataProcessor = Depends(get_processor)):
    """Health check endpoint for WindIQ monitoring and uptime verification."""
    processor.ensure_loaded()
    dates = processor.get_available_dates()
    return {
        "status": "healthy",
        "app": "WindIQ",
        "version": "1.0.0",
        "market": "UK EPEX SPOT / Nord Pool GB Day-Ahead",
        "isDataLoaded": processor._is_loaded,
        "actualPeriodsCount": len(processor.actuals),
        "forecastRecordsCount": len(processor.forecasts),
        "availableDateRange": {
            "start": dates[0] if dates else None,
            "end": dates[-1] if dates else None,
            "totalDays": len(dates)
        },
        "lastRefresh": processor._last_refresh
    }

@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    start_date: str = Query("2026-01-01", description="Analysis period start date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-31", description="Analysis period end date (YYYY-MM-DD)"),
    cutoff_time: str = Query("11:00", description="D-1 Day-Ahead gate closure cutoff (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Overview Dashboard (Page 1):
    Returns aggregate wind profile, outturn actuals vs frozen forecast, latest publish time,
    comprehensive error statistics (MAE, RMSE, MBE), data coverage, daily error trend, and analytical insight.
    """
    processor.ensure_loaded()
    available_dates = processor.get_available_dates()
    if not available_dates:
        raise HTTPException(status_code=404, detail="No Elexon BMRS dataset loaded")

    return MetricsEngine.compute_overview(
        processor,
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time
    )

@router.get("/forecasts", response_model=ForecastsResponse)
def get_forecasts(
    delivery_date: str = Query("2026-01-15", description="Delivery date in January 2026 (YYYY-MM-DD)"),
    cutoff_time: str = Query("11:00", description="D-1 Day-Ahead gate closure cutoff time (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Forecast Explorer (Page 2):
    Returns 48 half-hourly settlement periods for the delivery date with outturn actuals and
    the frozen forecast available at or before the decision cutoff.
    """
    processor.ensure_loaded()
    available_dates = processor.get_available_dates()
    if delivery_date not in available_dates:
        raise HTTPException(status_code=404, detail=f"Delivery date {delivery_date} not in January 2026 records")

    points, decision_date, cutoff_timestamp = processor.get_day_ahead_data(
        delivery_date=delivery_date,
        gate_closure_time=cutoff_time
    )
    metrics = MetricsEngine.compute_accuracy_metrics(points)

    available_cutoffs = ["07:00", "09:30", "11:00", "12:00", "15:30", "18:30"]

    return ForecastsResponse(
        deliveryDate=delivery_date,
        decisionDate=decision_date,
        cutoffTime=cutoff_time,
        cutoffTimestamp=cutoff_timestamp,
        timezone="UTC (GMT)",
        metrics=metrics,
        halfHourlyData=points,
        availableDates=available_dates,
        availableCutoffs=available_cutoffs
    )

@router.get("/accuracy", response_model=AccuracyResponse)
def get_accuracy(
    start_date: str = Query("2026-01-01", description="Start delivery date (YYYY-MM-DD)"),
    end_date: str = Query("2026-01-31", description="End delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query("11:00", description="D-1 Day-Ahead decision cutoff time (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Forecast Accuracy Analysis (Page 3):
    Returns statistical metrics (MAE, RMSE, MBE, WAPE, MAPE), daily MAE/Bias trends,
    forecast-vs-actual scatter points, signed error distribution histogram, and half-hourly heatmap.
    """
    processor.ensure_loaded()
    return MetricsEngine.compute_accuracy_analysis(
        processor,
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time
    )

@router.get("/vintages", response_model=VintagesResponse)
def get_vintages(
    delivery_date: str = Query("2026-01-15", description="Delivery date in January 2026 (YYYY-MM-DD)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Forecast Vintages Comparison:
    Returns all distinct forecast publication runs (D-2, D-1 morning, D-1 gate, intraday)
    alongside the outturn actual generation curve for multi-vintage visual comparison.
    """
    processor.ensure_loaded()
    return processor.get_vintages_for_date(delivery_date)

@router.get("/financials")
def get_financials(
    month: str = Query("2026-01", description="Target calendar month (YYYY-MM)"),
    cutoff_time: str = Query("11:00", description="D-1 Day-Ahead decision cutoff (HH:MM)"),
    processor: DataProcessor = Depends(get_processor)
):
    """
    Monthly Energy Volume, Income & Imbalance P&L Analytics:
    Returns total energy (Watts/MWh/GWh), wholesale power value (£),
    imbalance penalties (£), surplus gains (£), Net Profit/Loss,
    daily calendar breakdown, and prior months comparison (December 2025, November 2025).
    """
    processor.ensure_loaded()
    return MetricsEngine.compute_financial_metrics(
        processor,
        month=month,
        cutoff_time=cutoff_time
    )

@router.post("/refresh", response_model=RefreshResponse)
def refresh_data(processor: DataProcessor = Depends(get_processor)):
    """
    Triggers re-indexing and validation of cached Elexon FUELHH actuals and WINDFOR forecasts.
    """
    processor.load_data()
    return RefreshResponse(
        status="success",
        message="Elexon BMRS January 2026 datasets successfully verified and re-indexed.",
        refreshedAt=processor._last_refresh,
        actualPeriodsCount=len(processor.actuals),
        forecastRecordsCount=len(processor.forecasts)
    )
