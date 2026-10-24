"""
Quantitative metrics engine for UK wind generation forecast evaluation.
Computes MAE, RMSE, WAPE, MAPE, MBE, quantiles, and diurnal error profiles.
"""

from typing import List, Optional
import numpy as np
import pandas as pd

from app.models.schemas import (
    HalfHourlyDataPoint,
    AccuracyMetrics,
    DiurnalPeriodStat,
    DailySummary,
    MonthOverviewResponse
)
from app.services.data_processor import DataProcessor

class MetricsEngine:
    @staticmethod
    def compute_accuracy_metrics(points: List[HalfHourlyDataPoint]) -> AccuracyMetrics:
        """Compute comprehensive statistical error metrics for a list of half-hourly points."""
        valid_pairs = [
            (p.actualMW, p.dayAheadForecastMW)
            for p in points
            if p.actualMW is not None and p.dayAheadForecastMW is not None
        ]

        if not valid_pairs:
            return AccuracyMetrics(
                totalPeriods=0, mae=0.0, rmse=0.0, wape=0.0, mape=0.0, mbe=0.0,
                p10Error=0.0, p25Error=0.0, p50Error=0.0, p75Error=0.0, p90Error=0.0, p95Error=0.0,
                maxOverforecastMW=0.0, maxUnderforecastMW=0.0,
                overforecastRatePct=0.0, underforecastRatePct=0.0,
                totalActualMWh=0.0, totalForecastMWh=0.0, correlation=0.0
            )

        actuals = np.array([x[0] for x in valid_pairs], dtype=float)
        forecasts = np.array([x[1] for x in valid_pairs], dtype=float)
        errors = forecasts - actuals  # Positive = Overforecast (Wind deficit risk)
        abs_errors = np.abs(errors)

        n = len(valid_pairs)
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        mbe = float(np.mean(errors))

        sum_actuals = float(np.sum(actuals))
        wape = float((np.sum(abs_errors) / sum_actuals * 100.0)) if sum_actuals > 0 else 0.0

        # MAPE with floor to avoid division by zero
        denom = np.maximum(actuals, 100.0)
        mape = float(np.mean(abs_errors / denom) * 100.0)

        # Quantiles of signed errors
        p10 = float(np.percentile(errors, 10))
        p25 = float(np.percentile(errors, 25))
        p50 = float(np.percentile(errors, 50))
        p75 = float(np.percentile(errors, 75))
        p90 = float(np.percentile(errors, 90))
        p95 = float(np.percentile(errors, 95))

        over_count = int(np.sum(errors > 0))
        under_count = int(np.sum(errors < 0))
        over_rate = round((over_count / n) * 100.0, 2)
        under_rate = round((under_count / n) * 100.0, 2)

        max_over = float(np.max(errors)) if np.max(errors) > 0 else 0.0
        max_under = float(abs(np.min(errors))) if np.min(errors) < 0 else 0.0

        # Half-hourly MW to MWh factor is 0.5
        total_actual_mwh = round(float(sum_actuals * 0.5), 1)
        total_forecast_mwh = round(float(np.sum(forecasts) * 0.5), 1)

        corr = 0.0
        if np.std(actuals) > 1e-6 and np.std(forecasts) > 1e-6:
            corr_mat = np.corrcoef(actuals, forecasts)
            corr = float(corr_mat[0, 1])

        return AccuracyMetrics(
            totalPeriods=n,
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            wape=round(wape, 2),
            mape=round(mape, 2),
            mbe=round(mbe, 2),
            p10Error=round(p10, 2),
            p25Error=round(p25, 2),
            p50Error=round(p50, 2),
            p75Error=round(p75, 2),
            p90Error=round(p90, 2),
            p95Error=round(p95, 2),
            maxOverforecastMW=round(max_over, 2),
            maxUnderforecastMW=round(max_under, 2),
            overforecastRatePct=over_rate,
            underforecastRatePct=under_rate,
            totalActualMWh=total_actual_mwh,
            totalForecastMWh=total_forecast_mwh,
            correlation=round(corr, 4)
        )

    @staticmethod
    def compute_diurnal_profile(processor: DataProcessor, gate_closure_time: str = "11:00") -> List[DiurnalPeriodStat]:
        """Aggregate error and generation profiles across all days in January 2026 by settlement period (1-48)."""
        available_dates = processor.get_available_dates()
        period_data = {sp: {"actuals": [], "forecasts": [], "errors": []} for sp in range(1, 49)}

        for date_str in available_dates:
            points, _, _ = processor.get_day_ahead_data(date_str, gate_closure_time=gate_closure_time)
            for p in points:
                if p.actualMW is not None and p.dayAheadForecastMW is not None:
                    sp = p.settlementPeriod
                    err = p.dayAheadForecastMW - p.actualMW
                    period_data[sp]["actuals"].append(p.actualMW)
                    period_data[sp]["forecasts"].append(p.dayAheadForecastMW)
                    period_data[sp]["errors"].append(err)

        stats: List[DiurnalPeriodStat] = []
        for sp in range(1, 49):
            acts = period_data[sp]["actuals"]
            fcs = period_data[sp]["forecasts"]
            errs = period_data[sp]["errors"]

            # Time label
            hours = (sp - 1) // 2
            minutes = 30 if (sp % 2 == 0) else 0
            time_label = f"{hours:02d}:{minutes:02d}"

            if errs:
                avg_act = float(np.mean(acts))
                avg_fc = float(np.mean(fcs))
                mae = float(np.mean(np.abs(errs)))
                bias = float(np.mean(errs))
                rmse = float(np.sqrt(np.mean(np.array(errs) ** 2)))
                p90 = float(np.percentile(errs, 90))
            else:
                avg_act = avg_fc = mae = bias = rmse = p90 = 0.0

            stats.append(DiurnalPeriodStat(
                settlementPeriod=sp,
                timeLabel=time_label,
                avgActualMW=round(avg_act, 1),
                avgForecastMW=round(avg_fc, 1),
                maeMW=round(mae, 1),
                biasMW=round(bias, 1),
                rmseMW=round(rmse, 1),
                p90ErrorMW=round(p90, 1)
            ))

        return stats

    @staticmethod
    def compute_month_overview(processor: DataProcessor, gate_closure_time: str = "11:00") -> MonthOverviewResponse:
        """Computes entire January 2026 month overview with daily summaries and overall metrics."""
        available_dates = processor.get_available_dates()
        all_points: List[HalfHourlyDataPoint] = []
        daily_breakdowns: List[DailySummary] = []

        for date_str in available_dates:
            points, _, _ = processor.get_day_ahead_data(date_str, gate_closure_time=gate_closure_time)
            all_points.extend(points)

            # Daily summary
            day_valid = [p for p in points if p.actualMW is not None and p.dayAheadForecastMW is not None]
            if day_valid:
                acts = [p.actualMW for p in day_valid]
                fcs = [p.dayAheadForecastMW for p in day_valid]
                errs = [p.dayAheadForecastMW - p.actualMW for p in day_valid]
                abs_errs = [abs(e) for e in errs]

                daily_breakdowns.append(DailySummary(
                    deliveryDate=date_str,
                    totalPeriods=len(day_valid),
                    avgActualMW=round(float(np.mean(acts)), 1),
                    avgForecastMW=round(float(np.mean(fcs)), 1),
                    maeMW=round(float(np.mean(abs_errs)), 1),
                    rmseMW=round(float(np.sqrt(np.mean(np.array(errs) ** 2))), 1),
                    biasMW=round(float(np.mean(errs)), 1),
                    maxErrorMW=round(float(np.max(abs_errs)), 1)
                ))

        overall_metrics = MetricsEngine.compute_accuracy_metrics(all_points)

        return MonthOverviewResponse(
            month="2026-01",
            totalDays=len(available_dates),
            totalPeriods=len(all_points),
            overallMetrics=overall_metrics,
            dailyBreakdown=daily_breakdowns
        )
