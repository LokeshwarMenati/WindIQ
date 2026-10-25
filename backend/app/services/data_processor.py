"""
Data processing service for aligning Elexon FUELHH actuals and WINDFOR forecasts.
Applies Day-Ahead gate closure cutoff rules, prevents lookahead bias, and extracts multi-vintage forecast curves.
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
    ForecastEvolutionResponse,
    VintageRun,
    VintagePoint,
    VintagesResponse
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
        self._last_refresh: str = datetime.now(timezone.utc).isoformat()

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
        self._last_refresh = datetime.now(timezone.utc).isoformat()
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

    def _get_forecast_at_cutoff(self, target_dt: datetime, cutoff_str: str) -> Tuple[Optional[float], Optional[str]]:
        """
        Retrieves the latest available forecast published on or before cutoff_str for target_dt.
        Elexon WINDFOR is published at hourly intervals; for the :30 half-hour settlement periods,
        linear interpolation between adjacent hourly forecasts is applied if both exist before cutoff,
        or the prevailing hourly forecast is used.
        Strictly returns None if no forecast was published on or before the cutoff (no lookahead bias).
        """
        st_exact = target_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        hour_dt = target_dt.replace(minute=0, second=0)
        hour_st = hour_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # 1. Exact match (if present)
        fl_exact = self._forecasts_by_start.get(st_exact, [])
        elig_exact = [f for f in fl_exact if f.get("publishTime", "") <= cutoff_str]

        if elig_exact:
            latest = elig_exact[-1]
            return float(latest.get("generation", 0)), latest.get("publishTime")

        # 2. Hourly block match
        fl_hour = self._forecasts_by_start.get(hour_st, [])
        elig_hour = [f for f in fl_hour if f.get("publishTime", "") <= cutoff_str]

        if not elig_hour:
            return None, None

        base_fc = float(elig_hour[-1].get("generation", 0))
        pub_time = elig_hour[-1].get("publishTime")

        if target_dt.minute == 30:
            next_hour_dt = hour_dt + timedelta(hours=1)
            next_hour_st = next_hour_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            fl_next = self._forecasts_by_start.get(next_hour_st, [])
            elig_next = [f for f in fl_next if f.get("publishTime", "") <= cutoff_str]
            if elig_next:
                next_fc = float(elig_next[-1].get("generation", 0))
                # Linear interpolation for :30 midpoint
                interp_fc = round((base_fc + next_fc) / 2.0, 1)
                return interp_fc, pub_time

        return round(base_fc, 1), pub_time

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
        gc_parts = gate_closure_time.split(":")
        gc_hours = int(gc_parts[0])
        gc_minutes = int(gc_parts[1]) if len(gc_parts) > 1 else 0
        cutoff_dt = decision_dt.replace(hour=gc_hours, minute=gc_minutes, second=0)
        cutoff_str = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        results: List[HalfHourlyDataPoint] = []

        # Iterate all 48 half-hour settlement periods
        for sp in range(1, 49):
            sp_start_dt = dt + timedelta(minutes=(sp - 1) * 30)
            st_str = sp_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Time label e.g. "11:00 - 11:30"
            sp_end_dt = sp_start_dt + timedelta(minutes=30)
            time_label = f"{sp_start_dt.strftime('%H:%M')} - {sp_end_dt.strftime('%H:%M')}"

            # Actual generation
            act_item = self._actuals_by_start.get(st_str)
            actual_mw = float(act_item["generation"]) if act_item and act_item.get("generation") is not None else None

            # Day-Ahead forecast strictly at or before cutoff
            da_forecast, da_publish_time = self._get_forecast_at_cutoff(sp_start_dt, cutoff_str)

            # Latest forecast published prior to delivery (for comparison/evolution)
            delivery_cutoff_str = sp_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            latest_fc, _ = self._get_forecast_at_cutoff(sp_start_dt, delivery_cutoff_str)

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
                errorPct=error_pct,
                timeLabel=time_label
            ))

        return results, decision_date, cutoff_str

    def get_vintages_for_date(self, delivery_date: str) -> VintagesResponse:
        """
        Retrieves all distinct forecast publication runs (vintages) that projected generation
        for delivery_date, alongside the actual generation curve.
        """
        self.ensure_loaded()
        dt = datetime.strptime(delivery_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        # Build actuals curve
        actual_curve = []
        for sp in range(1, 49):
            sp_start_dt = dt + timedelta(minutes=(sp - 1) * 30)
            st_str = sp_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            act_item = self._actuals_by_start.get(st_str)
            gen = float(act_item["generation"]) if act_item and act_item.get("generation") is not None else None
            actual_curve.append({
                "settlementPeriod": sp,
                "startTime": st_str,
                "timeLabel": sp_start_dt.strftime("%H:%M"),
                "actualMW": gen
            })

        # Find all forecasts targeting delivery_date
        target_forecasts = [f for f in self.forecasts if f.get("startTime", "").startswith(delivery_date)]

        # Group by publishTime
        by_publish: Dict[str, Dict[str, float]] = {}
        for f in target_forecasts:
            pub = f.get("publishTime")
            st = f.get("startTime")
            gen = f.get("generation")
            if pub and st and gen is not None:
                by_publish.setdefault(pub, {})[st] = float(gen)

        vintages: List[VintageRun] = []
        # Sort publish times chronologically
        for pub_time in sorted(by_publish.keys()):
            pub_dt = datetime.fromisoformat(pub_time.replace("Z", "+00:00"))
            # Delivery start is 00:00 of deliveryDate
            lead_hours_avg = round((dt - pub_dt).total_seconds() / 3600.0 + 12.0, 1)

            # Generate descriptive label
            days_diff = (dt.date() - pub_dt.date()).days
            time_part = pub_dt.strftime("%H:%M UTC")
            if days_diff == 2:
                label = f"D-2 {time_part} (~{lead_hours_avg:.0f}h lead)"
            elif days_diff == 1:
                label = f"D-1 {time_part} (~{lead_hours_avg:.0f}h lead)"
            elif days_diff == 0:
                label = f"Intraday D {time_part}"
            else:
                label = f"{pub_dt.strftime('%b %d %H:%M')} (~{lead_hours_avg:.0f}h lead)"

            # Construct 48 half-hour points for this vintage
            points: List[VintagePoint] = []
            st_map = by_publish[pub_time]

            for sp in range(1, 49):
                sp_start_dt = dt + timedelta(minutes=(sp - 1) * 30)
                st_str = sp_start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                hour_st = sp_start_dt.replace(minute=0, second=0).strftime("%Y-%m-%dT%H:%M:%SZ")

                if st_str in st_map:
                    fc_val = st_map[st_str]
                elif hour_st in st_map:
                    fc_val = st_map[hour_st]
                    # Midpoint interpolation for :30 if next hour is available
                    if sp_start_dt.minute == 30:
                        next_hour_st = (sp_start_dt.replace(minute=0, second=0) + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
                        if next_hour_st in st_map:
                            fc_val = (fc_val + st_map[next_hour_st]) / 2.0
                else:
                    continue

                points.append(VintagePoint(
                    settlementPeriod=sp,
                    startTime=st_str,
                    forecastMW=round(fc_val, 1)
                ))

            # Only include vintages that cover at least 20 periods
            if len(points) >= 20:
                v_id = f"v_{pub_time.replace(':', '').replace('-', '')}"
                vintages.append(VintageRun(
                    vintageId=v_id,
                    publishTime=pub_time,
                    label=label,
                    leadHoursAvg=lead_hours_avg,
                    points=points
                ))

        return VintagesResponse(
            deliveryDate=delivery_date,
            actualCurve=actual_curve,
            availableVintages=vintages
        )

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
        if not forecast_list:
            # Fallback to hourly bucket
            hour_st = start_time[:14] + "00:00Z"
            forecast_list = self._forecasts_by_start.get(hour_st, [])

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
