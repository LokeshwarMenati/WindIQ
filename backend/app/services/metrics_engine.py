"""
Quantitative metrics engine for UK wind generation forecast evaluation.
Computes MAE, RMSE, WAPE, MAPE, MBE, quantiles, diurnal error profiles,
histogram bins for error distribution, and day-by-SP heatmap matrices.
"""

from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd

from app.models.schemas import (
    HalfHourlyDataPoint,
    AccuracyMetrics,
    DiurnalPeriodStat,
    DailySummary,
    MonthOverviewResponse,
    OverviewResponse,
    AccuracyResponse
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

        # MAPE with floor of 100 MW to avoid dividing by tiny outturns
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

    @staticmethod
    def compute_overview(
        processor: DataProcessor,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_time: str = "11:00"
    ) -> OverviewResponse:
        """
        Generates the executive Overview payload for WindIQ Page 1.
        Matches actuals vs forecasts for the selected date range and decision cutoff.
        """
        all_dates = [d for d in processor.get_available_dates() if start_date <= d <= end_date]
        all_points: List[HalfHourlyDataPoint] = []
        daily_trends: List[DailySummary] = []
        latest_pub_time = None

        for d in all_dates:
            points, dec_date, cutoff_used = processor.get_day_ahead_data(d, gate_closure_time=cutoff_time)
            all_points.extend(points)

            valid_pts = [p for p in points if p.actualMW is not None and p.dayAheadForecastMW is not None]
            if valid_pts:
                acts = [p.actualMW for p in valid_pts]
                fcs = [p.dayAheadForecastMW for p in valid_pts]
                errs = [p.dayAheadForecastMW - p.actualMW for p in valid_pts]
                abs_errs = [abs(e) for e in errs]
                daily_trends.append(DailySummary(
                    deliveryDate=d,
                    totalPeriods=len(valid_pts),
                    avgActualMW=round(float(np.mean(acts)), 1),
                    avgForecastMW=round(float(np.mean(fcs)), 1),
                    maeMW=round(float(np.mean(abs_errs)), 1),
                    rmseMW=round(float(np.sqrt(np.mean(np.array(errs) ** 2))), 1),
                    biasMW=round(float(np.mean(errs)), 1),
                    maxErrorMW=round(float(np.max(abs_errs)), 1)
                ))

            for p in points:
                if p.dayAheadPublishTime:
                    if latest_pub_time is None or p.dayAheadPublishTime > latest_pub_time:
                        latest_pub_time = p.dayAheadPublishTime

        overall_metrics = MetricsEngine.compute_accuracy_metrics(all_points)
        matched_obs = overall_metrics.totalPeriods
        total_possible = len(all_dates) * 48
        coverage_pct = round((matched_obs / total_possible * 100.0), 2) if total_possible > 0 else 0.0

        # Build aggregated half-hourly profile (SP 1-48 average across selected window)
        agg_profile = []
        for sp in range(1, 49):
            sp_pts = [p for p in all_points if p.settlementPeriod == sp and p.actualMW is not None and p.dayAheadForecastMW is not None]
            if sp_pts:
                avg_act = round(float(np.mean([p.actualMW for p in sp_pts])), 1)
                avg_fc = round(float(np.mean([p.dayAheadForecastMW for p in sp_pts])), 1)
                avg_err = round(avg_fc - avg_act, 1)
            else:
                avg_act = avg_fc = avg_err = 0.0

            hours = (sp - 1) // 2
            minutes = 30 if (sp % 2 == 0) else 0
            agg_profile.append({
                "settlementPeriod": sp,
                "timeLabel": f"{hours:02d}:{minutes:02d}",
                "avgActualMW": avg_act,
                "avgForecastMW": avg_fc,
                "avgErrorMW": avg_err
            })

        # Build time-series sample (daily average curve across the month)
        time_series = []
        for dt_summary in daily_trends:
            time_series.append({
                "date": dt_summary.deliveryDate,
                "actualMW": dt_summary.avgActualMW,
                "forecastMW": dt_summary.avgForecastMW,
                "maeMW": dt_summary.maeMW,
                "biasMW": dt_summary.biasMW
            })

        # Dynamic data-driven insight
        bias_direction = "overforecasted" if overall_metrics.mbe > 0 else "underforecasted"
        bias_implication = "creating energy deficit shortfall risk" if overall_metrics.mbe > 0 else "yielding surplus generation requiring power spill"
        max_mae_day = max(daily_trends, key=lambda x: x.maeMW) if daily_trends else None
        min_mae_day = min(daily_trends, key=lambda x: x.maeMW) if daily_trends else None

        insight_text = (
            f"Across {len(all_dates)} days of January 2026 evaluated at the {cutoff_time} UTC D-1 decision cutoff, "
            f"national wind generation averaged {overall_metrics.totalActualMWh / (matched_obs * 0.5):.0f} MW outturn with an MAE of {overall_metrics.mae:.0f} MW (WAPE: {overall_metrics.wape:.1f}%). "
            f"The forecast exhibited a signed bias of {overall_metrics.mbe:+.1f} MW ({bias_direction}), {bias_implication}. "
            f"Peak volatility occurred on {max_mae_day.deliveryDate if max_mae_day else 'N/A'} (MAE: {max_mae_day.maeMW if max_mae_day else 0} MW), "
            f"while {min_mae_day.deliveryDate if min_mae_day else 'N/A'} demonstrated highest stability (MAE: {min_mae_day.maeMW if min_mae_day else 0} MW)."
        )

        return OverviewResponse(
            period={"startDate": start_date, "endDate": end_date, "cutoffTime": cutoff_time},
            latestPublicationTime=latest_pub_time,
            totalForecastGenerationMWh=overall_metrics.totalForecastMWh,
            totalActualGenerationMWh=overall_metrics.totalActualMWh,
            overallMetrics=overall_metrics,
            matchedObservations=matched_obs,
            totalPossibleObservations=total_possible,
            dataCoveragePct=coverage_pct,
            dailyErrorTrend=daily_trends,
            timeSeriesData=time_series,
            aggregatedProfile=agg_profile,
            insightSummary=insight_text
        )

    @staticmethod
    def compute_accuracy_analysis(
        processor: DataProcessor,
        start_date: str = "2026-01-01",
        end_date: str = "2026-01-31",
        cutoff_time: str = "11:00"
    ) -> AccuracyResponse:
        """
        Generates full accuracy breakdown including scatter plot points, error histogram distribution,
        and half-hourly delivery date heatmap matrix.
        """
        all_dates = [d for d in processor.get_available_dates() if start_date <= d <= end_date]
        all_points: List[HalfHourlyDataPoint] = []
        daily_mae = []
        daily_bias = []
        heatmap_data = []
        scatter_data = []
        all_errors = []

        for d in all_dates:
            points, _, _ = processor.get_day_ahead_data(d, gate_closure_time=cutoff_time)
            all_points.extend(points)

            day_valid = [p for p in points if p.actualMW is not None and p.dayAheadForecastMW is not None]
            if day_valid:
                errs = [p.dayAheadForecastMW - p.actualMW for p in day_valid]
                abs_errs = [abs(e) for e in errs]
                mae_val = round(float(np.mean(abs_errs)), 1)
                rmse_val = round(float(np.sqrt(np.mean(np.array(errs)**2))), 1)
                bias_val = round(float(np.mean(errs)), 1)
                daily_mae.append({
                    "date": d,
                    "deliveryDate": d,
                    "mae": mae_val,
                    "maeMW": mae_val,
                    "rmse": rmse_val,
                    "rmseMW": rmse_val,
                    "bias": bias_val,
                    "biasMW": bias_val
                })
                daily_bias.append({
                    "date": d,
                    "deliveryDate": d,
                    "bias": bias_val,
                    "biasMW": bias_val
                })

            for p in points:
                if p.actualMW is not None and p.dayAheadForecastMW is not None:
                    err = round(p.dayAheadForecastMW - p.actualMW, 1)
                    abs_err = round(abs(err), 1)
                    all_errors.append(err)

                    # Heatmap cell with dual-compatibility keys
                    heatmap_data.append({
                        "date": p.settlementDate,
                        "deliveryDate": p.settlementDate,
                        "sp": p.settlementPeriod,
                        "settlementPeriod": p.settlementPeriod,
                        "time": p.timeLabel or f"SP {p.settlementPeriod}",
                        "timeLabel": p.timeLabel or f"SP {p.settlementPeriod}",
                        "actual": p.actualMW,
                        "actualMW": p.actualMW,
                        "forecast": p.dayAheadForecastMW,
                        "forecastMW": p.dayAheadForecastMW,
                        "dayAheadForecastMW": p.dayAheadForecastMW,
                        "error": err,
                        "errorMW": err,
                        "absError": abs_err,
                        "absErrorMW": abs_err
                    })

                    # Scatter sample: take SP 3, 10, 18, 24, 32, 38, 44 (stratified sample across day for performance)
                    if p.settlementPeriod in [2, 8, 14, 20, 26, 32, 38, 44]:
                        scatter_data.append({
                            "actualMW": p.actualMW,
                            "forecastMW": p.dayAheadForecastMW,
                            "errorMW": err,
                            "sp": p.settlementPeriod,
                            "date": p.settlementDate
                        })

        overall_metrics = MetricsEngine.compute_accuracy_metrics(all_points)
        matched_obs = overall_metrics.totalPeriods
        total_obs = len(all_dates) * 48
        coverage_pct = round((matched_obs / total_obs * 100.0), 2) if total_obs > 0 else 0.0

        # Build histogram of signed errors (15 bins)
        error_dist = []
        if all_errors:
            err_arr = np.array(all_errors)
            min_e = float(np.percentile(err_arr, 1))
            max_e = float(np.percentile(err_arr, 99))
            counts, bin_edges = np.histogram(err_arr, bins=15, range=(min_e, max_e))
            total_c = len(all_errors)
            for i in range(len(counts)):
                b_start = round(bin_edges[i], 0)
                b_end = round(bin_edges[i+1], 0)
                mid = round((b_start + b_end) / 2.0, 0)
                error_dist.append({
                    "binRange": f"{b_start:+.0f} to {b_end:+.0f} MW",
                    "binCenter": mid,
                    "count": int(counts[i]),
                    "frequencyPct": round((counts[i] / total_c) * 100.0, 2)
                })

        diurnal = MetricsEngine.compute_diurnal_profile(processor, gate_closure_time=cutoff_time)

        return AccuracyResponse(
            startDate=start_date,
            endDate=end_date,
            cutoffTime=cutoff_time,
            overallMetrics=overall_metrics,
            dailyMaeTrend=daily_mae,
            dailyBiasTrend=daily_bias,
            scatterData=scatter_data,
            errorDistribution=error_dist,
            heatmapData=heatmap_data,
            diurnalStats=diurnal,
            matchedObservations=matched_obs,
            totalObservations=total_obs,
            dataCoveragePct=coverage_pct
        )
