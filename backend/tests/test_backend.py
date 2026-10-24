"""
Automated unit and integration tests for the UK Day-Ahead Wind Forecast & Procurement Platform.
"""

import pytest
from fastapi.testclient import TestClient
import numpy as np
import os

from app.main import app, processor_instance
from app.services.data_processor import DataProcessor
from app.services.metrics_engine import MetricsEngine
from app.services.procurement_service import ProcurementService
from app.models.schemas import HalfHourlyDataPoint, ProcurementPlanRequest

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "platform" in data
    assert data["status"] == "online"

def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["isDataLoaded"] is True

def test_available_dates():
    response = client.get("/api/forecast/available-dates")
    assert response.status_code == 200
    dates = response.json()
    assert len(dates) >= 30
    assert "2026-01-01" in dates
    assert "2026-01-15" in dates

def test_day_ahead_forecast_endpoint():
    response = client.get("/api/forecast/day-ahead?deliveryDate=2026-01-15&gateClosureTime=11:00")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert data["decisionDate"] == "2026-01-14"
    assert len(data["halfHourlyData"]) == 48

    # Verify each point has settlementPeriod 1 to 48
    sps = [p["settlementPeriod"] for p in data["halfHourlyData"]]
    assert sps == list(range(1, 49))

    # Verify metrics exist
    metrics = data["metrics"]
    assert "mae" in metrics
    assert "rmse" in metrics
    assert metrics["mae"] >= 0

def test_accuracy_metrics_calculation():
    # Construct synthetic data points
    points = [
        HalfHourlyDataPoint(
            startTime="2026-01-01T00:00:00Z", settlementDate="2026-01-01", settlementPeriod=1,
            actualMW=1000.0, dayAheadForecastMW=1200.0  # Error = +200 (overforecast)
        ),
        HalfHourlyDataPoint(
            startTime="2026-01-01T00:30:00Z", settlementDate="2026-01-01", settlementPeriod=2,
            actualMW=1500.0, dayAheadForecastMW=1400.0  # Error = -100 (underforecast)
        )
    ]
    metrics = MetricsEngine.compute_accuracy_metrics(points)
    # MAE should be (|200| + |-100|) / 2 = 150
    assert metrics.mae == 150.0
    # MBE should be (200 + (-100)) / 2 = 50
    assert metrics.mbe == 50.0
    # RMSE should be sqrt((40000 + 10000)/2) = sqrt(25000) = 158.11
    assert abs(metrics.rmse - 158.11) < 0.1
    # Overforecast count 1, underforecast 1 -> 50%
    assert metrics.overforecastRatePct == 50.0
    assert metrics.underforecastRatePct == 50.0

def test_diurnal_profile_endpoint():
    response = client.get("/api/accuracy/diurnal?gateClosureTime=11:00")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-01"
    assert len(data["periods"]) == 48
    p1 = data["periods"][0]
    assert p1["settlementPeriod"] == 1
    assert p1["timeLabel"] == "00:00"

def test_monthly_overview_endpoint():
    response = client.get("/api/accuracy/monthly-overview?gateClosureTime=11:00")
    assert response.status_code == 200
    data = response.json()
    assert data["month"] == "2026-01"
    assert data["totalDays"] >= 30
    assert len(data["dailyBreakdown"]) >= 30

def test_procurement_plan_endpoint():
    payload = {
        "deliveryDate": "2026-01-15",
        "demandMW": 30000.0,
        "confidenceLevel": 0.95,
        "gateClosureCutoff": "11:00"
    }
    response = client.post("/api/procurement/plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert len(data["periods"]) == 48
    assert data["totalDemandMWh"] > 0
    assert data["totalRecommendedThermalMWh"] > 0
    assert data["bufferMarginMW"] > 0

def test_sync_status_endpoint():
    response = client.get("/api/sync/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["actuals"]["recordCount"] > 1000
    assert data["forecasts"]["recordCount"] > 10000
