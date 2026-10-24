from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class HalfHourlyDataPoint(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    actualMW: Optional[float] = None
    dayAheadForecastMW: Optional[float] = None
    latestForecastMW: Optional[float] = None
    dayAheadPublishTime: Optional[str] = None
    errorMW: Optional[float] = None  # forecast - actual (positive = overforecast/shortfall risk)
    absErrorMW: Optional[float] = None
    errorPct: Optional[float] = None
    thermalBaseMW: Optional[float] = None
    thermalBufferMW: Optional[float] = None
    totalThermalMW: Optional[float] = None

class AccuracyMetrics(BaseModel):
    totalPeriods: int
    mae: float
    rmse: float
    wape: float
    mape: float
    mbe: float  # Mean Bias Error (forecast - actual)
    p10Error: float
    p25Error: float
    p50Error: float
    p75Error: float
    p90Error: float
    p95Error: float
    maxOverforecastMW: float
    maxUnderforecastMW: float
    overforecastRatePct: float
    underforecastRatePct: float
    totalActualMWh: float
    totalForecastMWh: float
    correlation: float

class DiurnalPeriodStat(BaseModel):
    settlementPeriod: int
    timeLabel: str
    avgActualMW: float
    avgForecastMW: float
    maeMW: float
    biasMW: float
    rmseMW: float
    p90ErrorMW: float

class DailySummary(BaseModel):
    deliveryDate: str
    totalPeriods: int
    avgActualMW: float
    avgForecastMW: float
    maeMW: float
    rmseMW: float
    biasMW: float
    maxErrorMW: float

class DayAheadAnalysisResponse(BaseModel):
    deliveryDate: str
    decisionDate: str
    gateClosureTime: str
    actualCutoffUsed: str
    metrics: AccuracyMetrics
    halfHourlyData: List[HalfHourlyDataPoint]

class DiurnalAnalysisResponse(BaseModel):
    month: str
    periods: List[DiurnalPeriodStat]

class MonthOverviewResponse(BaseModel):
    month: str
    totalDays: int
    totalPeriods: int
    overallMetrics: AccuracyMetrics
    dailyBreakdown: List[DailySummary]

class ProcurementPlanRequest(BaseModel):
    deliveryDate: str
    demandMW: float = 28000.0  # Representative UK peak winter consumer demand baseline
    confidenceLevel: float = 0.90  # 90% risk coverage against wind deficit
    gateClosureCutoff: str = "11:00"

class ProcurementPeriodItem(BaseModel):
    settlementPeriod: int
    startTime: str
    timeLabel: str
    demandMW: float
    forecastWindMW: float
    actualWindMW: Optional[float]
    netDemandMW: float  # demand - forecastWind
    baseThermalMW: float  # max(0, netDemand)
    reserveBufferMW: float  # quantified thermal cushion for wind drops
    totalThermalRecommendedMW: float
    actualThermalNeededMW: Optional[float]
    imbalanceExposureMW: Optional[float]

class ProcurementPlanResponse(BaseModel):
    deliveryDate: str
    confidenceLevel: float
    bufferMarginMW: float
    totalDemandMWh: float
    expectedWindMWh: float
    actualWindMWh: Optional[float]
    baseThermalMWh: float
    reserveBufferMWh: float
    totalRecommendedThermalMWh: float
    uncoveredDeficitPeriods: int
    periods: List[ProcurementPeriodItem]

class ForecastHorizonPoint(BaseModel):
    leadTimeHours: float
    publishTime: str
    forecastMW: float
    actualMW: Optional[float]
    errorMW: Optional[float]

class ForecastEvolutionResponse(BaseModel):
    targetStartTime: str
    settlementPeriod: int
    actualMW: Optional[float]
    evolution: List[ForecastHorizonPoint]
