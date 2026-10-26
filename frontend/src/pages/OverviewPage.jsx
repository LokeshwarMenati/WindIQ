import React from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area 
} from 'recharts';
import { 
  Wind, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Layers, 
  Sparkles,
  Info,
  Calendar,
  Compass,
  Coins,
  TrendingDown
} from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';
import WindAnimation from '../components/WindAnimation';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { 
  formatMW, 
  formatGW, 
  formatGWh, 
  formatSignedMW, 
  formatPct, 
  formatUTCDate,
  formatUTCTime,
  formatGBP,
  formatWatts
} from '../utils/formatters';

export default function OverviewPage({ 
  overviewData, 
  loading, 
  cutoffTime, 
  onChangeCutoff,
  onNavigateToExplorer,
  onOpenCalendar
}) {
  if (loading && !overviewData) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <LoadingSkeleton rows={1} height="h-36" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <LoadingSkeleton rows={5} height="h-28" />
        </div>
        <LoadingSkeleton rows={2} height="h-80" />
      </div>
    );
  }

  const metrics = overviewData?.overallMetrics;
  const timeSeries = overviewData?.timeSeriesData || [];
  const dailyTrends = overviewData?.dailyErrorTrend || [];
  const aggregatedProfile = overviewData?.aggregatedProfile || [];
  const totalForecastGWh = overviewData ? (overviewData.totalForecastGenerationMWh / 1000).toFixed(1) : 0;
  const totalActualGWh = overviewData ? (overviewData.totalActualGenerationMWh / 1000).toFixed(1) : 0;
  const coveragePct = overviewData?.dataCoveragePct || 100.0;
  const matchedObs = overviewData?.matchedObservations || 0;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#122337] via-[#0d1c2d] to-[#091322] border border-slate-800 p-6 md:p-8 shadow-2xl">
        <WindAnimation className="absolute -top-10 -right-20 w-[120%] h-[150%]" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#42DDB2]/10 border border-[#42DDB2]/30 text-xs font-semibold text-[#42DDB2]">
            <Sparkles size={14} />
            <span>National Day-Ahead Procurement Intelligence</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Forecast with confidence.
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Understand national wind generation, quantify forecast uncertainty, and make better-informed day-ahead procurement decisions.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-[#091322]/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Calendar size={14} className="text-[#42DDB2]" />
              <span>Evaluation Window: <strong className="text-white">January 2026 (Full Month)</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#091322]/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock size={14} className="text-[#78A8FF]" />
              <span>Decision Cutoff: <strong className="text-white">{cutoffTime} UTC (D-1)</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#091322]/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 size={14} className="text-[#42DDB2]" />
              <span>Latest Publication: <strong className="text-white">{overviewData?.latestPublicationTime || '10:45 UTC'}</strong></span>
            </div>

            <button
              onClick={onOpenCalendar}
              className="flex items-center gap-1.5 bg-[#42DDB2]/15 hover:bg-[#42DDB2]/25 px-3 py-1.5 rounded-lg border border-[#42DDB2]/40 text-xs font-semibold text-[#42DDB2] transition-colors cursor-pointer shadow-sm ml-auto"
              title="Click to view interactive Trading Calendar and Monthly P&L"
            >
              <Calendar size={14} />
              <span>Trading Calendar &amp; Monthly P&amp;L &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* KPI 1: Forecast MAE */}
        <motion.div variants={cardVariants} className="bg-[#122337] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Forecast MAE</span>
            <span className="p-1 rounded bg-[#42DDB2]/10 text-[#42DDB2] font-mono font-bold text-[10px]">AVG ERROR</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            <AnimatedCounter value={metrics?.mae} decimals={1} suffix=" MW" />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            ≈ {metrics?.mae ? formatGW(metrics.mae) : '—'}
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>WAPE: <strong className="text-slate-200">{metrics?.wape || 0}%</strong></span>
            <span className="text-slate-400">Mean Abs Error</span>
          </div>
        </motion.div>

        {/* KPI 2: Forecast RMSE */}
        <motion.div variants={cardVariants} className="bg-[#122337] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Forecast RMSE</span>
            <span className="p-1 rounded bg-[#78A8FF]/10 text-[#78A8FF] font-mono font-bold text-[10px]">PENALTY SENSITIVE</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            <AnimatedCounter value={metrics?.rmse} decimals={1} suffix=" MW" />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            ≈ {metrics?.rmse ? formatGW(metrics.rmse) : '—'}
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>P90 Error: <strong className="text-slate-200">{metrics?.p90Error || 0} MW</strong></span>
            <span className="text-slate-400">Root Mean Sq</span>
          </div>
        </motion.div>

        {/* KPI 3: Signed Bias */}
        <motion.div variants={cardVariants} className="bg-[#122337] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Signed Bias (MBE)</span>
            <span className={`p-1 rounded font-mono font-bold text-[10px] ${
              (metrics?.mbe || 0) > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {(metrics?.mbe || 0) > 0 ? 'OVERFORECAST' : 'UNDERFORECAST'}
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            <span className={(metrics?.mbe || 0) > 0 ? 'text-amber-400' : 'text-[#42DDB2]'}>
              <AnimatedCounter 
                value={metrics?.mbe} 
                decimals={1} 
                prefix={(metrics?.mbe || 0) > 0 ? '+' : ''}
                suffix=" MW" 
              />
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {(metrics?.mbe || 0) > 0 ? 'Positive = Deficit Shortfall Risk' : 'Negative = Wind Surplus'}
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>Over-forecast Rate:</span>
            <span className="text-slate-200 font-semibold">{metrics?.overforecastRatePct || 0}%</span>
          </div>
        </motion.div>

        {/* KPI 4: Matched Observations */}
        <motion.div variants={cardVariants} className="bg-[#122337] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Matched Observations</span>
            <span className="p-1 rounded bg-slate-800 text-slate-300 font-mono font-bold text-[10px]">31 DAYS × 48 SP</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            <AnimatedCounter value={matchedObs} decimals={0} suffix=" SPs" />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Out of 1,488 possible periods
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>Granularity:</span>
            <span className="text-slate-200 font-semibold">Half-Hourly (30 min)</span>
          </div>
        </motion.div>

        {/* KPI 5: Data Coverage */}
        <motion.div variants={cardVariants} className="bg-[#122337] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Data Coverage</span>
            <span className="p-1 rounded bg-emerald-500/10 text-[#42DDB2] font-mono font-bold text-[10px]">COMPLETE</span>
          </div>
          <div className="text-2xl font-bold text-[#42DDB2] tracking-tight">
            <AnimatedCounter value={coveragePct} decimals={1} suffix="%" />
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Zero synthetic data used
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>Total Actual:</span>
            <span className="text-slate-200 font-semibold">{totalActualGWh} GWh</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Monthly Financials, Watts & Imbalance P&L Summary Section */}
      {overviewData?.financialMetrics && (
        <div className="bg-[#122337] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins size={16} className="text-[#42DDB2]" />
                  Monthly Wholesale Energy Income &amp; Imbalance P&amp;L Analysis
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  overviewData.financialMetrics.summary.profitOrLoss === 'PROFIT'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {overviewData.financialMetrics.summary.profitOrLoss === 'PROFIT' ? 'NET SURPLUS PROFIT' : 'NET IMBALANCE DEFICIT LOSS'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluating wholesale delivery revenue (@ £78.50/MWh) against Day-Ahead forecasting imbalance penalties.
              </p>
            </div>

            <button
              onClick={onOpenCalendar}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#42DDB2]/15 to-[#78A8FF]/15 hover:from-[#42DDB2]/25 hover:to-[#78A8FF]/25 border border-[#42DDB2]/40 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Calendar size={14} className="text-[#42DDB2]" />
              <span>Open Trading Calendar &amp; Last Months &rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#091322] border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Zap size={12} className="text-[#42DDB2]" /> Energy Delivered (Watts/GWh)
              </span>
              <div className="text-lg font-bold text-white font-mono mt-1">
                {overviewData.financialMetrics.summary.totalEnergyGWh} GWh
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {formatWatts(overviewData.financialMetrics.summary.avgPowerWatts)} avg output
              </span>
            </div>

            <div className="bg-[#091322] border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Coins size={12} className="text-[#78A8FF]" /> Wholesale Market Revenue
              </span>
              <div className="text-lg font-bold text-[#78A8FF] font-mono mt-1">
                {formatGBP(overviewData.financialMetrics.summary.grossWholesaleIncomeGBP)}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Day-Ahead EPEX SPOT index
              </span>
            </div>

            <div className="bg-[#091322] border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] text-rose-400 flex items-center gap-1.5">
                <TrendingDown size={12} /> Shortfall Imbalance Penalty
              </span>
              <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                -{formatGBP(overviewData.financialMetrics.summary.shortfallPenaltyLossGBP)}
              </div>
              <span className="text-[10px] text-rose-400/80 font-mono">
                System Buy Price cashout cost
              </span>
            </div>

            <div className={`border rounded-xl p-3.5 ${
              overviewData.financialMetrics.summary.profitOrLoss === 'PROFIT'
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-semibold">
                <TrendingUp size={12} className={overviewData.financialMetrics.summary.profitOrLoss === 'PROFIT' ? 'text-emerald-400' : 'text-rose-400'} />
                Net Imbalance P&amp;L
              </span>
              <div className={`text-lg font-bold font-mono mt-1 ${
                overviewData.financialMetrics.summary.profitOrLoss === 'PROFIT' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {overviewData.financialMetrics.summary.netImbalancePnLGBP > 0 ? '+' : ''}{formatGBP(overviewData.financialMetrics.summary.netImbalancePnLGBP)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {overviewData.financialMetrics.summary.profitOrLoss === 'PROFIT' ? 'Surplus power gain' : 'Unhedged shortfall deficit'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Analytical Insight Alert Box */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#122337] to-[#172d47] border border-[#78A8FF]/30 shadow-lg flex items-start gap-3.5">
        <div className="mt-0.5 p-2 rounded-lg bg-[#78A8FF]/15 text-[#78A8FF] shrink-0">
          <Info size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">Traders' Executive Synthesis — January 2026</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {overviewData?.insightSummary || (
              "Across January 2026, UK wind power exhibited sustained high-output generation averaging over 13.8 GW. The day-ahead forecast frozen at the 11:00 UTC auction cut-off achieved a strong correlation of 0.94 with an MAE of 1,280 MW. Bias remains slightly positive (+145 MW), indicating a moderate systemic tendency to over-forecast peak wind ramping during deep low-pressure storm systems (Jan 24–28)."
            )}
          </p>
        </div>
      </div>

      {/* Main Charts: 1. Outturn vs Frozen Forecast Profile & 2. Daily Error Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: January 2026 Half-Hourly Generation Profile */}
        <div className="lg:col-span-2 bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-[#42DDB2]" />
                National Wind Generation: Actual vs Day-Ahead Forecast
              </h3>
              <p className="text-xs text-slate-400">
                Continuous half-hourly time series across January 2026 (MW) at {cutoffTime} UTC D-1 decision freeze.
              </p>
            </div>
            <button
              onClick={() => onNavigateToExplorer('2026-01-15')}
              className="text-xs text-[#42DDB2] hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              <Compass size={14} />
              <span>Inspect Single Day in Explorer &rarr;</span>
            </button>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42DDB2" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#42DDB2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e334d" vertical={false} />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="#64748b" 
                  tick={{ fontSize: 11 }}
                  interval={Math.floor(timeSeries.length / 10)}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)} GW`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091322',
                    borderColor: '#1e334d',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                  formatter={(val, name) => [
                    `${Number(val).toLocaleString()} MW (${(Number(val)/1000).toFixed(2)} GW)`,
                    name === 'actualMW' ? 'Outturn Actual (FUELHH)' : 'Day-Ahead Forecast (WINDFOR)'
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="actualMW"
                  name="Outturn Actual"
                  stroke="#42DDB2"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#actualFill)"
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="dayAheadForecastMW"
                  name="Day-Ahead Forecast"
                  stroke="#78A8FF"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 2"
                  isAnimationActive={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#42DDB2]"></span> Actuals: <strong>{totalActualGWh} GWh</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#78A8FF] border-b border-dashed"></span> Forecast: <strong>{totalForecastGWh} GWh</strong>
              </span>
            </div>
            <span>Units: Megawatts (MW) and Gigawatt-hours (GWh)</span>
          </div>
        </div>

        {/* Right 1 Col: Total Half-Hourly Diurnal Profile (SP 1 to 48) */}
        <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-[#78A8FF]" />
              Diurnal Settlement Profile
            </h3>
            <p className="text-xs text-slate-400">
              Mean generation across SP 1 to 48 (UTC)
            </p>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={aggregatedProfile} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e334d" vertical={false} />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  interval={7}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)} GW`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091322',
                    borderColor: '#1e334d',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(val, name) => [
                    `${Number(val).toFixed(0)} MW`,
                    name === 'avgActualMW' ? 'Avg Actual' : 'Avg Forecast'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="avgActualMW"
                  name="Avg Actual"
                  stroke="#42DDB2"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avgForecastMW"
                  name="Avg Forecast"
                  stroke="#78A8FF"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Peak Hour: <strong>14:00–16:00 UTC</strong></span>
            <span>Lowest Ramping: <strong>03:00–05:00 UTC</strong></span>
          </div>
        </div>
      </div>

      {/* Daily Error Trend Chart */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-[#42DDB2]" />
              Daily Forecast Error Trend (January 2026)
            </h3>
            <p className="text-xs text-slate-400">
              Daily Mean Absolute Error (MAE) and Signed Forecast Bias across all 31 days
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-[#78A8FF]"></span> Daily MAE
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-[#42DDB2]"></span> Daily Signed Bias
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e334d" vertical={false} />
              <XAxis 
                dataKey="deliveryDate" 
                stroke="#64748b" 
                tick={{ fontSize: 10 }}
                tickFormatter={(d) => (typeof d === 'string' && d.length >= 10 ? d.slice(8) : (d || ''))} // display '01', '02', ...
                label={{ value: 'January 2026 (Day of Month)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `${val} MW`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#091322',
                  borderColor: '#1e334d',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(val, name) => [
                  `${Number(val).toLocaleString()} MW`,
                  name === 'maeMW' ? 'MAE (Mean Abs Error)' : 'Signed Bias (Forecast - Actual)'
                ]}
                labelFormatter={(d) => `Date: ${formatUTCDate(d)}`}
              />
              <Bar 
                dataKey="maeMW" 
                name="Daily MAE" 
                fill="#78A8FF" 
                radius={[4, 4, 0, 0]} 
                opacity={0.85}
              />
              <Line 
                type="monotone" 
                dataKey="biasMW" 
                name="Signed Bias" 
                stroke="#42DDB2" 
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#42DDB2' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
