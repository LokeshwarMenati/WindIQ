"""
Data processing service for aligning Elexon FUELHH actuals and WINDFOR forecasts.
Applies Day-Ahead gate closure cutoff rules and matches half-hourly settlement periods.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

from app.models.schemas import (
    HalfHourlyDataPoint,
    DailySummary,
    DiurnalPeriodStat,
    ForecastHorizonPoint,
    ForecastEvolutionResponse
)
from app.services.elexon_client import ElexonClient

class DataProcessor:
    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = data_dir
        self.client = ElexonClient(cache_dir=data_dir)
        self.actuals: List[Dict[str, Any]] = []
        self.forecasts: List[Dict[str, Any]] = []
        self._actuals_by_start: Dict[str, Dict[str, Any]] = {}
        self._forecasts_by_start: Dict[str, List[Dict[str, Any]]] = {}
        self._is_loaded = False

    def load_data(self) -> None:
        """Load and index FUELHH actuals and WINDFOR forecasts."""
        data = self.client.load_cached_data()
        self.actuals = data.get("actuals", [])
        self.forecasts = data.get("forecasts", [])

        # Index actuals by startTime
        self._actuals_by_start = {}
        for item in self.actuals:
            st = item.get("startTime")
            if st:
                self._actuals_by_start[st] = item

        # Index forecasts by startTime, sorted chronologically by publishTime
        self._forecasts_by_start = {}
        for item in self.forecasts:
            st = item.get("startTime")
            if st:
                if st not in self._forecasts_by_start:
                    self._forecasts_by_start[st] = []
                self._forecasts_by_start[st].append(item)

        for st in self._forecasts_by_start:
            self._forecasts_by_start[st].sort(key=lambda x: x.get("publishTime", ""))

        self._is_loaded = True
        print(f"DataProcessor indexed {len(self._actuals_by_start)} actual periods and forecasts for {len(self._forecasts_by_start)} periods.")

    def ensure_loaded(self) -> None:
        if not self._is_loaded:
            self.load_data()

    def get_available_dates(self) -> List[str]:
        """Returns sorted list of delivery dates available in January 2026."""
        self.ensure_loaded()
        dates = set()
        for item in self.actuals:
            s_date = item.get("settlementDate")
            if s_date and s_date.startswith("2026-01"):
                dates.add(s_date)
        return sorted(list(dates))

    def get_day_ahead_data(
        self,
        delivery_date: str,
        gate_closure_time: str = "11:00"
    ) -> Tuple[List[HalfHourlyDataPoint], str, str]:
        """
        Retrieves 48 settlement periods for a delivery date and the frozen Day-Ahead forecast
        available at gate closure time on Day D-1.
        """
        self.ensure_loaded()
        dt = datetime.strptime(delivery_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        decision_dt = dt - timedelta(days=1)
        decision_date = decision_dt.strftime("%Y-%m-%d")

        # Parse gate closure cutoff timestamp
        gc_hours, gc_minutes = map(int, gate_closure_time.split(":"))
        cutoff_dt = decision_dt.replace(hour=gc_hours, minute=gc_minutes, second=0)
        cutoff_str = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        results: List[HalfHourlyDataPoint] = []

        # Iterate all 48 half-hour settlement periods
        for sp in range(1, 49):
            sp_start_dt = dt + timedelta(minutes=(sp - 1) * 30)
            st_str = sp_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Actual generation
            act_item = self._actuals_by_start.get(st_str)
            actual_mw = float(act_item["generation"]) if act_item and act_item.get("generation") is not None else None

            # Forecasts for this startTime
            forecast_list = self._forecasts_by_start.get(st_str, [])

            # Day-Ahead forecast: latest publishTime <= cutoff_str
            da_forecast = None
            da_publish_time = None
            eligible_da = [f for f in forecast_list if f.get("publishTime", "") <= cutoff_str]
            if eligible_da:
                latest_da = eligible_da[-1]
                da_forecast = float(latest_da.get("generation", 0))
                da_publish_time = latest_da.get("publishTime")
            elif forecast_list:
                # If none before cutoff, fallback to the earliest available forecast
                latest_da = forecast_list[0]
                da_forecast = float(latest_da.get("generation", 0))
                da_publish_time = latest_da.get("publishTime")

            # Latest intraday forecast (closest to actual delivery)
            latest_fc = float(forecast_list[-1].get("generation", 0)) if forecast_list else None

            # Error calculation: Forecast - Actual
            error_mw = None
            abs_error_mw = None
            error_pct = None
            if da_forecast is not None and actual_mw is not None:
                error_mw = round(da_forecast - actual_mw, 2)
                abs_error_mw = round(abs(da_forecast - actual_mw), 2)
                denom = max(100.0, actual_mw)
                error_pct = round((error_mw / denom) * 100.0, 2)

            results.append(HalfHourlyDataPoint(
                startTime=st_str,
                settlementDate=delivery_date,
                settlementPeriod=sp,
                actualMW=actual_mw,
                dayAheadForecastMW=da_forecast,
                latestForecastMW=latest_fc,
                dayAheadPublishTime=da_publish_time,
                errorMW=error_mw,
                absErrorMW=abs_error_mw,
                errorPct=error_pct
            ))

        return results, decision_date, cutoff_str

    def get_forecast_evolution(self, start_time: str) -> ForecastEvolutionResponse:
        """
        Traces how wind forecast for a specific target half-hour evolved over time
        as lead time decreased.
        """
        self.ensure_loaded()
        act_item = self._actuals_by_start.get(start_time)
        actual_mw = float(act_item["generation"]) if act_item and act_item.get("generation") is not None else None
        sp = act_item.get("settlementPeriod", 1) if act_item else 1

        forecast_list = self._forecasts_by_start.get(start_time, [])
        target_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))

        evolution: List[ForecastHorizonPoint] = []
        for fc in forecast_list:
            pub_str = fc.get("publishTime")
            if not pub_str:
                continue
            pub_dt = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
            lead_hours = round((target_dt - pub_dt).total_seconds() / 3600.0, 1)
            fc_mw = float(fc.get("generation", 0))
            err_mw = round(fc_mw - actual_mw, 2) if actual_mw is not None else None

            evolution.append(ForecastHorizonPoint(
                leadTimeHours=lead_hours,
                publishTime=pub_str,
                forecastMW=fc_mw,
                actualMW=actual_mw,
                errorMW=err_mw
            ))

        # Sort from longest lead time to shortest lead time
        evolution.sort(key=lambda x: -x.leadTimeHours)
        return ForecastEvolutionResponse(
            targetStartTime=start_time,
            settlementPeriod=sp,
            actualMW=actual_mw,
            evolution=evolution
        )
