"""
Procurement recommendation service for UK Day-Ahead electricity purchases.
Calculates net demand, thermal baseline procurement, and quantified risk buffer margins.
"""

from typing import List, Dict, Any, Optional
import numpy as np

from app.models.schemas import (
    ProcurementPlanRequest,
    ProcurementPlanResponse,
    ProcurementPeriodItem,
    HalfHourlyDataPoint
)
from app.services.data_processor import DataProcessor

# Representative UK diurnal consumer demand curve multipliers for winter (January)
# Normalizes a nominal base demand across 48 half-hours (overnight low ~70%, morning peak ~105%, evening peak ~120%)
UK_WINTER_DEMAND_SHAPE = [
    0.72, 0.70, 0.68, 0.66, 0.65, 0.65, 0.66, 0.68, # 00:00 - 03:30 (Overnight trough)
    0.72, 0.78, 0.86, 0.95, 1.02, 1.06, 1.08, 1.07, # 04:00 - 07:30 (Morning ramp)
    1.05, 1.03, 1.02, 1.01, 1.00, 0.99, 0.98, 0.98, # 08:00 - 11:30 (Midday)
    0.98, 0.99, 1.00, 1.02, 1.05, 1.10, 1.18, 1.22, # 12:00 - 15:30 (Afternoon into evening peak)
    1.24, 1.22, 1.19, 1.14, 1.08, 1.02, 0.96, 0.90, # 16:00 - 19:30 (Evening peak & ramp down)
    0.85, 0.81, 0.78, 0.75, 0.73, 0.72, 0.71, 0.70  # 20:00 - 23:30 (Night decay)
]

class ProcurementService:
    def __init__(self, processor: DataProcessor):
        self.processor = processor

    def calculate_procurement_plan(self, req: ProcurementPlanRequest) -> ProcurementPlanResponse:
        """
        Calculates thermal procurement recommendations for Day D based on Day D-1 wind forecasts
        and quantified risk buffer derived from empirical forecast error quantiles.
        """
        points, _, cutoff_str = self.processor.get_day_ahead_data(
            req.deliveryDate,
            gate_closure_time=req.gateClosureCutoff
        )

        # Compute empirical forecast error quantiles across all January data to establish safety margin
        all_dates = self.processor.get_available_dates()
        all_shortfalls = []
        for d in all_dates:
            d_points, _, _ = self.processor.get_day_ahead_data(d, gate_closure_time=req.gateClosureCutoff)
            for p in d_points:
                if p.actualMW is not None and p.dayAheadForecastMW is not None:
                    # Shortfall happens when Forecast > Actual (wind failed to materialize)
                    shortfall = p.dayAheadForecastMW - p.actualMW
                    if shortfall > 0:
                        all_shortfalls.append(shortfall)

        # Default reserve margin based on requested confidence level
        if all_shortfalls:
            pct_rank = req.confidenceLevel * 100.0
            buffer_margin_mw = float(np.percentile(all_shortfalls, pct_rank))
        else:
            buffer_margin_mw = 1500.0

        periods: List[ProcurementPeriodItem] = []
        total_demand_mwh = 0.0
        expected_wind_mwh = 0.0
        actual_wind_mwh = 0.0
        base_thermal_mwh = 0.0
        reserve_buffer_mwh = 0.0
        total_rec_thermal_mwh = 0.0
        uncovered_deficit_periods = 0

        for sp in range(1, 49):
            p = points[sp - 1]
            time_label = f"{(sp-1)//2:02d}:{30 if sp%2==0 else 0:02d}"

            # Half-hourly demand profile scaled by UK winter diurnal pattern
            shape_factor = UK_WINTER_DEMAND_SHAPE[sp - 1]
            period_demand = round(req.demandMW * shape_factor, 1)

            forecast_wind = p.dayAheadForecastMW if p.dayAheadForecastMW is not None else 0.0
            actual_wind = p.actualMW

            # Baseline net demand
            net_demand = max(0.0, period_demand - forecast_wind)
            base_thermal = net_demand

            # Sized buffer: scaled to period wind forecast volatility
            # Higher wind periods have proportionally wider error potential
            wind_scale = min(1.5, max(0.6, forecast_wind / 10000.0))
            period_buffer = round(buffer_margin_mw * wind_scale, 1)

            total_rec = round(base_thermal + period_buffer, 1)

            # Actual thermal generation that was genuinely needed in outturn
            actual_needed = None
            imbalance = None
            if actual_wind is not None:
                actual_needed = round(max(0.0, period_demand - actual_wind), 1)
                # If only base thermal was bought without buffer, what was the deficit?
                unbuffered_imbalance = max(0.0, actual_needed - base_thermal)
                if unbuffered_imbalance > 0:
                    uncovered_deficit_periods += 1
                # Imbalance after recommended procurement:
                imbalance = round(total_rec - actual_needed, 1)

            periods.append(ProcurementPeriodItem(
                settlementPeriod=sp,
                startTime=p.startTime,
                timeLabel=time_label,
                demandMW=period_demand,
                forecastWindMW=round(forecast_wind, 1),
                actualWindMW=round(actual_wind, 1) if actual_wind is not None else None,
                netDemandMW=round(net_demand, 1),
                baseThermalMW=round(base_thermal, 1),
                reserveBufferMW=period_buffer,
                totalThermalRecommendedMW=total_rec,
                actualThermalNeededMW=actual_needed,
                imbalanceExposureMW=imbalance
            ))

            total_demand_mwh += period_demand * 0.5
            expected_wind_mwh += forecast_wind * 0.5
            if actual_wind is not None:
                actual_wind_mwh += actual_wind * 0.5
            base_thermal_mwh += base_thermal * 0.5
            reserve_buffer_mwh += period_buffer * 0.5
            total_rec_thermal_mwh += total_rec * 0.5

        return ProcurementPlanResponse(
            deliveryDate=req.deliveryDate,
            confidenceLevel=req.confidenceLevel,
            bufferMarginMW=round(buffer_margin_mw, 1),
            totalDemandMWh=round(total_demand_mwh, 1),
            expectedWindMWh=round(expected_wind_mwh, 1),
            actualWindMWh=round(actual_wind_mwh, 1) if actual_wind_mwh > 0 else None,
            baseThermalMWh=round(base_thermal_mwh, 1),
            reserveBufferMWh=round(reserve_buffer_mwh, 1),
            totalRecommendedThermalMWh=round(total_rec_thermal_mwh, 1),
            uncoveredDeficitPeriods=uncovered_deficit_periods,
            periods=periods
        )
