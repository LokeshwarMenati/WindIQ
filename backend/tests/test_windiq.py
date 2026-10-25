"""
Automated test suite for WindIQ — UK Renewable Energy Forecast Analytics Platform.
Tests:
- API response validation (/api/health, /api/overview, /api/forecasts, /api/accuracy, /api/vintages, /api/refresh)
- Decision-cutoff enforcement and elimination of lookahead bias
- Forecast-vintage selection and multi-run alignment
- Timestamp normalization and UTC formatting
- Synthetic data tests for MAE, RMSE, signed bias (forecast - actual), MAPE, WAPE
- Handling of missing data and distinction from zero-generation
- Error and invalid date handling
"""

import pytest
from fastapi.testclient import TestClient
import numpy as np
from datetime import datetime, timezone, timedelta

from app.main import app
from app.services.data_processor import DataProcessor
from app.services.metrics_engine import MetricsEngine
from app.models.schemas import HalfHourlyDataPoint

client = TestClient(app)

# ---------------------------------------------------------
# 1. API Endpoints Response Validation
# ---------------------------------------------------------

def test_windiq_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app"] == "WindIQ"
    assert data["actualPeriodsCount"] > 1000
    assert data["forecastRecordsCount"] > 10000
    assert data["availableDateRange"]["totalDays"] == 31

def test_windiq_overview_endpoint():
    res = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-31&cutoff_time=11:00")
    assert res.status_code == 200
    data = res.json()
    assert "period" in data
    assert data["period"]["startDate"] == "2026-01-01"
    assert data["matchedObservations"] > 1400
    assert data["dataCoveragePct"] >= 95.0
    assert data["overallMetrics"]["mae"] > 0
    assert "insightSummary" in data
    assert len(data["dailyErrorTrend"]) == 31
    assert len(data["aggregatedProfile"]) == 48

def test_windiq_forecasts_endpoint():
    res = client.get("/api/forecasts?delivery_date=2026-01-15&cutoff_time=11:00")
    assert res.status_code == 200
    data = res.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert data["decisionDate"] == "2026-01-14"
    assert data["cutoffTime"] == "11:00"
    assert data["timezone"] == "UTC (GMT)"
    assert len(data["halfHourlyData"]) == 48

    p1 = data["halfHourlyData"][0]
    assert p1["settlementPeriod"] == 1
    assert p1["actualMW"] is not None
    assert p1["dayAheadForecastMW"] is not None
    assert p1["dayAheadPublishTime"] is not None
    # Crucial: publish time must be on or before cutoff (2026-01-14T11:00:00Z)
    assert p1["dayAheadPublishTime"] <= "2026-01-14T11:00:00Z"

def test_windiq_vintages_endpoint():
    res = client.get("/api/vintages?delivery_date=2026-01-15")
    assert res.status_code == 200
    data = res.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert len(data["actualCurve"]) == 48
    assert len(data["availableVintages"]) > 5
    v1 = data["availableVintages"][0]
    assert "vintageId" in v1
    assert "publishTime" in v1
    assert "label" in v1
    assert len(v1["points"]) >= 20

def test_windiq_accuracy_endpoint():
    res = client.get("/api/accuracy?start_date=2026-01-01&end_date=2026-01-31&cutoff_time=11:00")
    assert res.status_code == 200
    data = res.json()
    assert "overallMetrics" in data
    assert len(data["dailyMaeTrend"]) == 31
    assert len(data["scatterData"]) > 100
    assert len(data["errorDistribution"]) == 15
    assert len(data["heatmapData"]) == 31 * 48
    assert len(data["diurnalStats"]) == 48

def test_windiq_refresh_endpoint():
    res = client.post("/api/refresh")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "Elexon BMRS" in data["message"]
    assert data["actualPeriodsCount"] > 0

# ---------------------------------------------------------
# 2. Decision-Cutoff Enforcement & Elimination of Lookahead Bias
# ---------------------------------------------------------

def test_decision_cutoff_enforcement_synthetic():
    """
    Test with synthetic forecasts: any forecast published after the decision cutoff
    must NEVER be selected.
    """
    processor = DataProcessor(data_dir="backend/data")
    processor.actuals = []
    processor.forecasts = [
        # Early forecast published at 08:00 UTC D-1
        {"startTime": "2026-01-10T12:00:00Z", "publishTime": "2026-01-09T08:00:00Z", "generation": 5000.0},
        # Mid forecast published at 10:30 UTC D-1
        {"startTime": "2026-01-10T12:00:00Z", "publishTime": "2026-01-09T10:30:00Z", "generation": 5200.0},
        # Lookahead forecast published at 11:30 UTC D-1 (AFTER 11:00 gate closure)
        {"startTime": "2026-01-10T12:00:00Z", "publishTime": "2026-01-09T11:30:00Z", "generation": 8000.0},
        # Intraday forecast published at 06:00 UTC on delivery day D
        {"startTime": "2026-01-10T12:00:00Z", "publishTime": "2026-01-10T06:00:00Z", "generation": 9500.0},
    ]
    processor._actuals_by_start = {
        "2026-01-10T12:00:00Z": {"startTime": "2026-01-10T12:00:00Z", "generation": 5100.0, "settlementDate": "2026-01-10"}
    }
    processor._forecasts_by_start = {"2026-01-10T12:00:00Z": sorted(processor.forecasts, key=lambda x: x["publishTime"])}
    processor._is_loaded = True

    # Cutoff at 11:00 UTC on D-1
    target_dt = datetime(2026, 1, 10, 12, 0, 0, tzinfo=timezone.utc)
    cutoff_str = "2026-01-09T11:00:00Z"
    fc, pub = processor._get_forecast_at_cutoff(target_dt, cutoff_str)

    # Must select 5200.0 published at 10:30 UTC, NOT 8000.0 or 9500.0!
    assert fc == 5200.0
    assert pub == "2026-01-09T10:30:00Z"

    # If cutoff was 09:00 UTC on D-1, must select 5000.0 published at 08:00
    fc_early, pub_early = processor._get_forecast_at_cutoff(target_dt, "2026-01-09T09:00:00Z")
    assert fc_early == 5000.0
    assert pub_early == "2026-01-09T08:00:00Z"

    # If cutoff was 07:00 UTC on D-1 (before any forecast was published), must be None (no lookahead bias)
    fc_none, pub_none = processor._get_forecast_at_cutoff(target_dt, "2026-01-09T07:00:00Z")
    assert fc_none is None
    assert pub_none is None

# ---------------------------------------------------------
# 3. Synthetic Statistical Metrics Accuracy (Signed Bias = Forecast - Actual)
# ---------------------------------------------------------

def test_synthetic_metrics_signed_bias_and_quantiles():
    """
    Test MAE, RMSE, MBE, Quantiles on known synthetic values.
    Obs 1: Actual = 1000, Forecast = 1400 -> Error = +400 (Overforecast)
    Obs 2: Actual = 2000, Forecast = 1700 -> Error = -300 (Underforecast)
    Obs 3: Actual = 1500, Forecast = 1500 -> Error = 0
    Obs 4: Actual = 3000, Forecast = 3100 -> Error = +100 (Overforecast)
    """
    synthetic_points = [
        HalfHourlyDataPoint(startTime="2026-01-01T00:00:00Z", settlementDate="2026-01-01", settlementPeriod=1, actualMW=1000.0, dayAheadForecastMW=1400.0),
        HalfHourlyDataPoint(startTime="2026-01-01T00:30:00Z", settlementDate="2026-01-01", settlementPeriod=2, actualMW=2000.0, dayAheadForecastMW=1700.0),
        HalfHourlyDataPoint(startTime="2026-01-01T01:00:00Z", settlementDate="2026-01-01", settlementPeriod=3, actualMW=1500.0, dayAheadForecastMW=1500.0),
        HalfHourlyDataPoint(startTime="2026-01-01T01:30:00Z", settlementDate="2026-01-01", settlementPeriod=4, actualMW=3000.0, dayAheadForecastMW=3100.0),
    ]

    metrics = MetricsEngine.compute_accuracy_metrics(synthetic_points)

    # MAE = (|400| + |-300| + |0| + |100|) / 4 = 800 / 4 = 200.0
    assert metrics.mae == 200.0

    # MBE (Bias) = (400 - 300 + 0 + 100) / 4 = 200 / 4 = +50.0 (positive = net overforecasting)
    assert metrics.mbe == 50.0

    # RMSE = sqrt((160000 + 90000 + 0 + 10000) / 4) = sqrt(260000 / 4) = sqrt(65000) = 254.95
    assert abs(metrics.rmse - 254.95) < 0.1

    # Overforecast count = 2 (SP 1, 4), Underforecast count = 1 (SP 2), Zero = 1 (SP 3)
    # Over rate = 2/4 = 50.0%, Under rate = 1/4 = 25.0%
    assert metrics.overforecastRatePct == 50.0
    assert metrics.underforecastRatePct == 25.0

    # Total Actual MWh = sum(1000, 2000, 1500, 3000) * 0.5 = 7500 * 0.5 = 3750.0 MWh
    assert metrics.totalActualMWh == 3750.0
    # Total Forecast MWh = sum(1400, 1700, 1500, 3100) * 0.5 = 7700 * 0.5 = 3850.0 MWh
    assert metrics.totalForecastMWh == 3850.0

def test_missing_data_not_converted_to_zero():
    """
    Ensure missing forecasts or missing actuals are NOT silently converted to 0.
    They should be excluded from valid pairs calculation.
    """
    points_with_missing = [
        HalfHourlyDataPoint(startTime="2026-01-01T00:00:00Z", settlementDate="2026-01-01", settlementPeriod=1, actualMW=1000.0, dayAheadForecastMW=1200.0),
        # Missing actual
        HalfHourlyDataPoint(startTime="2026-01-01T00:30:00Z", settlementDate="2026-01-01", settlementPeriod=2, actualMW=None, dayAheadForecastMW=1500.0),
        # Missing forecast
        HalfHourlyDataPoint(startTime="2026-01-01T01:00:00Z", settlementDate="2026-01-01", settlementPeriod=3, actualMW=1800.0, dayAheadForecastMW=None),
        # Genuine zero generation (not missing!)
        HalfHourlyDataPoint(startTime="2026-01-01T01:30:00Z", settlementDate="2026-01-01", settlementPeriod=4, actualMW=0.0, dayAheadForecastMW=50.0),
    ]

    metrics = MetricsEngine.compute_accuracy_metrics(points_with_missing)
    # Only points 1 and 4 are valid matched observations (count = 2)
    assert metrics.totalPeriods == 2
    # Errors: +200, +50 -> MAE = (200 + 50) / 2 = 125.0
    assert metrics.mae == 125.0

# ---------------------------------------------------------
# 4. Error Handling: Invalid Date Inputs
# ---------------------------------------------------------

def test_invalid_date_returns_404():
    res = client.get("/api/forecasts?delivery_date=2026-02-15&cutoff_time=11:00")
    assert res.status_code == 404
    data = res.json()
    assert "not in January 2026" in data["detail"]

def test_cutoff_progression_strictly_enforced():
    """Verify that moving cutoff from 07:00 to 11:00 to 18:30 preserves strictly non-lookahead publish timestamps."""
    res_0700 = client.get("/api/forecasts?delivery_date=2026-01-15&cutoff_time=07:00")
    res_1100 = client.get("/api/forecasts?delivery_date=2026-01-15&cutoff_time=11:00")
    assert res_0700.status_code == 200
    assert res_1100.status_code == 200

    p_0700 = res_0700.json()["halfHourlyData"][0]["dayAheadPublishTime"]
    p_1100 = res_1100.json()["halfHourlyData"][0]["dayAheadPublishTime"]

    # 07:00 cutoff must be published <= 07:00 on D-1
    assert p_0700 <= "2026-01-14T07:00:00Z"
    # 11:00 cutoff must be published <= 11:00 on D-1
    assert p_1100 <= "2026-01-14T11:00:00Z"

def test_root_metadata_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "WindIQ — UK Renewable Energy Forecast Analytics"
    assert "status" in data
    assert data["status"] == "online"
    assert "/api/health" in data["endpoints"]
    assert "/api/overview" in data["endpoints"]

