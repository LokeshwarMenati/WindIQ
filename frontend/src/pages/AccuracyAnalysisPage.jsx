import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  BarChart3, 
  Download, 
  Search, 
  ArrowUpDown, 
  Info, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  Grid3X3,
  Flame,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { exportToCSV } from '../utils/exportCsv';
import { 
  formatMW, 
  formatGW, 
  formatSignedMW, 
  formatPct, 
  formatUTCDate, 
  formatUTCTime 
} from '../utils/formatters';
import AnimatedCounter from '../components/AnimatedCounter';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function AccuracyAnalysisPage({ 
  cutoffTime, 
  onShowToast, 
  onNavigateToExplorer 
}) {
  const [accuracyData, setAccuracyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState(null);

  // Error table filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('deliveryDate');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedErrorFilter, setSelectedErrorFilter] = useState('all'); // 'all', 'overforecast', 'underforecast', 'extreme'

  useEffect(() => {
    let isCurrent = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.getAccuracy('2026-01-01', '2026-01-31', cutoffTime);
        if (isCurrent) setAccuracyData(data);
      } catch (err) {
        console.error("Error loading accuracy analysis:", err);
        onShowToast?.({
          type: 'error',
          title: 'Accuracy Data Error',
          message: `Failed to load accuracy analytics: ${err.message}`
        });
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadData();
    return () => { isCurrent = false; };
  }, [cutoffTime]);

  const metrics = accuracyData?.overallMetrics;
  const scatterPoints = accuracyData?.scatterData || [];
  const dailyMae = accuracyData?.dailyMaeTrend || [];
  const dailyBias = accuracyData?.dailyBiasTrend || [];
  const errorDist = accuracyData?.errorDistribution || [];
  const heatmapCells = accuracyData?.heatmapData || [];

  // Table rows prepared from heatmap / scatter dataset
  const tableRows = useMemo(() => {
    if (!heatmapCells.length) return [];
    
    let rows = heatmapCells.map(c => ({
      ...c,
      absErrorMW: Math.abs(c.errorMW || 0),
      errorPct: c.actualMW > 100 ? (((c.errorMW || 0) / c.actualMW) * 100) : null
    }));

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(r => 
        r.deliveryDate.includes(q) || 
        r.settlementPeriod.toString().includes(q)
      );
    }

    if (selectedErrorFilter === 'overforecast') {
      rows = rows.filter(r => r.errorMW > 0);
    } else if (selectedErrorFilter === 'underforecast') {
      rows = rows.filter(r => r.errorMW < 0);
    } else if (selectedErrorFilter === 'extreme') {
      rows = rows.filter(r => Math.abs(r.errorMW) > 1500);
    }

    rows.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [heatmapCells, searchTerm, selectedErrorFilter, sortField, sortDirection]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (!tableRows.length) return;

    const headers = [
      { key: 'deliveryDate', label: 'Delivery Date (YYYY-MM-DD)' },
      { key: 'settlementPeriod', label: 'Settlement Period (1-48)' },
      { key: 'actualMW', label: 'Outturn Actual (MW)' },
      { key: 'forecastMW', label: 'Day-Ahead Forecast (MW)' },
      { key: 'errorMW', label: 'Signed Forecast Error [F - A] (MW)' },
      { key: 'absErrorMW', label: 'Absolute Error |F - A| (MW)' }
    ];

    const filename = `WindIQ_Accuracy_Analysis_Jan2026_cutoff_${cutoffTime.replace(':', '')}UTC`;
    const success = exportToCSV(filename, tableRows, headers);

    if (success) {
      onShowToast?.({
        type: 'success',
        title: 'CSV Export Generated',
        message: `Exported ${tableRows.length} matched half-hourly error observations to CSV.`
      });
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Heatmap rendering helpers (31 days x 48 SPs)
  const heatmapDates = useMemo(() => {
    const dates = Array.from(new Set(heatmapCells.map(c => c.deliveryDate))).sort();
    return dates;
  }, [heatmapCells]);

  const getHeatmapColor = (errorMW) => {
    if (errorMW === null || errorMW === undefined) return '#1e293b';
    // Overforecast (positive error): Amber / Coral
    if (errorMW > 2500) return '#ef4444'; // intense red
    if (errorMW > 1500) return '#f97316'; // strong orange
    if (errorMW > 750)  return '#f59e0b'; // amber
    if (errorMW > 200)  return '#d97706'; // soft amber
    // Near parity (-200 to +200)
    if (errorMW >= -200) return '#1e334d'; // neutral navy
    // Underforecast (negative error): Mint / Cyan
    if (errorMW < -2500) return '#3b82f6'; // intense electric blue
    if (errorMW < -1500) return '#2563eb';
    if (errorMW < -750)  return '#0d9488'; // teal
    if (errorMW < -200)  return '#42DDB2'; // mint
    return '#1e334d';
  };

  if (loading && !accuracyData) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <LoadingSkeleton rows={1} height="h-28" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LoadingSkeleton rows={4} height="h-24" />
        </div>
        <LoadingSkeleton rows={2} height="h-80" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Title Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#122337] border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#78A8FF]/15 text-[#78A8FF]">
              <BarChart3 size={18} />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Forecast Accuracy Analysis
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Quantitative evaluation of national day-ahead wind forecasts vs actuals across January 2026.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-[#091322] border border-slate-700 text-xs text-slate-300">
            <span>Cutoff: <strong className="text-white">{cutoffTime} UTC (D-1)</strong></span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#42DDB2] to-[#2ebd94] text-[#091322] text-xs font-bold hover:brightness-110 shadow-md transition-all"
          >
            <Download size={14} />
            <span>Download Accuracy CSV</span>
          </button>
        </div>
      </div>

      {/* Explanatory Convention Banner */}
      <div className="p-4 rounded-xl bg-[#0f1d2e] border border-slate-800 flex items-start gap-3.5 text-xs text-slate-300">
        <div className="p-2 rounded-lg bg-[#42DDB2]/15 text-[#42DDB2] shrink-0">
          <Info size={18} />
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-white">Statistical Error Definition &amp; Convention</div>
          <p className="leading-relaxed">
            Signed forecast error is strictly defined as <code className="px-1.5 py-0.5 rounded bg-slate-800 text-[#42DDB2]">Forecast − Actual</code>. 
            A <strong>positive bias (+MW)</strong> indicates <em>overforecasting</em> (leading to physical shortfall risk where the utility must procure emergency thermal power or pay System Buy Price). 
            A <strong>negative bias (−MW)</strong> indicates <em>underforecasting</em> (resulting in unanticipated wind surplus). 
            Metrics are calculated exclusively on matched, valid observations; zero actual generation is explicitly preserved without synthetic replacement.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* MAE */}
        <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] text-slate-400 font-medium">Mean Absolute Error</span>
          <div className="text-xl font-bold text-white mt-1">
            <AnimatedCounter value={metrics?.mae} decimals={1} suffix=" MW" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Avg Error Magnitude</span>
        </div>

        {/* RMSE */}
        <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] text-slate-400 font-medium">Root Mean Sq Error</span>
          <div className="text-xl font-bold text-[#78A8FF] mt-1">
            <AnimatedCounter value={metrics?.rmse} decimals={1} suffix=" MW" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Penalizes large swings</span>
        </div>

        {/* Bias MBE */}
        <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] text-slate-400 font-medium">Signed Mean Bias</span>
          <div className={`text-xl font-bold mt-1 ${(metrics?.mbe || 0) > 0 ? 'text-amber-400' : 'text-[#42DDB2]'}`}>
            <AnimatedCounter value={metrics?.mbe} decimals={1} prefix={(metrics?.mbe || 0) > 0 ? '+' : ''} suffix=" MW" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {(metrics?.mbe || 0) > 0 ? 'Net Overforecast' : 'Net Underforecast'}
          </span>
        </div>

        {/* MAPE */}
        <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] text-slate-400 font-medium">MAPE</span>
          <div className="text-xl font-bold text-white mt-1">
            <AnimatedCounter value={metrics?.mape} decimals={1} suffix="%" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Floor &gt; 100 MW</span>
        </div>

        {/* Correlation */}
        <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] text-slate-400 font-medium">Pearson Correlation</span>
          <div className="text-xl font-bold text-[#42DDB2] mt-1">
            <AnimatedCounter value={metrics?.correlation} decimals={3} />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Directional tracking</span>
        </div>

        {/* Coverage */}
        <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] text-slate-400 font-medium">Valid Coverage</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            <AnimatedCounter value={accuracyData?.dataCoveragePct || 100} decimals={1} suffix="%" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{accuracyData?.matchedObservations || 1488} / 1488 SPs</span>
        </div>
      </div>

      {/* Charts Grid: 1. Daily MAE & Daily Bias + 2. Error Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily MAE & Bias Trends */}
        <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-[#42DDB2]" />
              Daily MAE &amp; Signed Bias Trends (31 Days)
            </h3>
            <p className="text-xs text-slate-400">
              Mean Absolute Error bars (MW) with Signed Forecast Bias overlay across January 2026.
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyMae} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e334d" vertical={false} />
                <XAxis 
                  dataKey="deliveryDate" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => d.slice(8)}
                  label={{ value: 'Day of January 2026', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091322',
                    borderColor: '#1e334d',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(val, name) => [`${Number(val).toLocaleString()} MW`, name]}
                  labelFormatter={(d) => `Date: ${formatUTCDate(d)}`}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="maeMW" name="Daily MAE (MW)" fill="#78A8FF" radius={[3, 3, 0, 0]} />
                <Line 
                  dataKey="biasMW" 
                  name="Signed Bias (MW)" 
                  stroke="#42DDB2" 
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#42DDB2' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Distribution Chart (Histogram) */}
        <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-[#78A8FF]" />
              Signed Error Distribution Histogram
            </h3>
            <p className="text-xs text-slate-400">
              Distribution of forecast errors [F − A] (MW). Centered around 0 with skewness indicators.
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={errorDist} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e334d" vertical={false} />
                <XAxis 
                  dataKey="binLabel" 
                  stroke="#64748b" 
                  tick={{ fontSize: 9 }}
                  interval={1}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091322',
                    borderColor: '#1e334d',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(val, name, item) => [
                    `${val} observations (${item.payload.pct}%)`,
                    'Count in Error Bracket'
                  ]}
                />
                <ReferenceLine x="[-200, 200]" stroke="#42DDB2" strokeDasharray="3 3" />
                <Bar 
                  dataKey="count" 
                  name="Observations" 
                  fill="#42DDB2" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Forecast vs Actual Scatter Plot */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame size={16} className="text-[#42DDB2]" />
            Forecast vs Actual Scatter Plot (45° Parity Line)
          </h3>
          <p className="text-xs text-slate-400">
            Each point represents a half-hour settlement period. Points above the 45° diagonal line indicate overforecasting; points below indicate underforecasting.
          </p>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e334d" />
              <XAxis 
                type="number" 
                dataKey="actualMW" 
                name="Actual Outturn" 
                unit=" MW" 
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                domain={[0, 22000]}
                label={{ value: 'Outturn Actual Wind Generation (MW)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="forecastMW" 
                name="Day-Ahead Forecast" 
                unit=" MW" 
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                domain={[0, 22000]}
                label={{ value: 'Day-Ahead Forecast (MW)', angle: -90, position: 'insideLeft', offset: 12, fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#091322',
                  borderColor: '#1e334d',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(val, name) => [`${Number(val).toLocaleString()} MW`, name]}
                labelFormatter={() => 'Settlement Period'}
              />
              {/* 45 Degree Line */}
              <Line
                type="linear"
                data={[{ actualMW: 0, forecastMW: 0 }, { actualMW: 22000, forecastMW: 22000 }]}
                dataKey="forecastMW"
                stroke="#475569"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Scatter 
                name="Observations" 
                data={scatterPoints} 
                fill="#42DDB2" 
                opacity={0.65} 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Half-Hourly Delivery Date x SP Heatmap (31 Days x 48 SPs) */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Grid3X3 size={16} className="text-[#78A8FF]" />
              Error Heatmap: Delivery Date × Settlement Period (31 × 48 Grid)
            </h3>
            <p className="text-xs text-slate-400">
              Visualizes timing and severity of forecast deviations across all 1,488 January 2026 periods. Hover any cell for details.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            <span>Underforecast (−MW)</span>
            <div className="flex h-3 w-28 rounded overflow-hidden">
              <div className="flex-1 bg-[#2563eb]"></div>
              <div className="flex-1 bg-[#42DDB2]"></div>
              <div className="flex-1 bg-[#1e334d]"></div>
              <div className="flex-1 bg-[#f59e0b]"></div>
              <div className="flex-1 bg-[#ef4444]"></div>
            </div>
            <span>Overforecast (+MW)</span>
          </div>
        </div>

        {/* Interactive Heatmap Matrix */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 p-2 bg-[#091322]">
          <div className="min-w-[760px] space-y-1">
            {/* SP Header row */}
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono pb-1 border-b border-slate-800">
              <span className="w-16 shrink-0">Date (Jan)</span>
              {Array.from({ length: 48 }, (_, i) => i + 1).map(sp => (
                <span key={sp} className="flex-1 text-center">
                  {sp % 6 === 1 ? sp : ''}
                </span>
              ))}
            </div>

            {/* Days Rows */}
            {heatmapDates.map(date => {
              const dayCells = heatmapCells.filter(c => c.deliveryDate === date);

              return (
                <div key={date} className="flex items-center gap-1">
                  <span className="w-16 shrink-0 text-[10px] text-slate-400 font-mono">
                    {date.slice(5)}
                  </span>
                  {Array.from({ length: 48 }, (_, i) => i + 1).map(sp => {
                    const cell = dayCells.find(c => c.settlementPeriod === sp);
                    const error = cell?.errorMW;
                    const bg = getHeatmapColor(error);

                    return (
                      <div
                        key={sp}
                        onMouseEnter={() => setSelectedHeatmapCell(cell || { deliveryDate: date, settlementPeriod: sp, errorMW: 0 })}
                        onClick={() => onNavigateToExplorer?.(date)}
                        title={`${date} SP ${sp}: Error ${error ? (error > 0 ? '+' : '') + error.toFixed(0) + ' MW' : 'N/A'}`}
                        className="flex-1 h-3.5 rounded-[2px] transition-transform hover:scale-125 cursor-pointer shadow-sm"
                        style={{ backgroundColor: bg }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Heatmap Cell Detail */}
        {selectedHeatmapCell && (
          <div className="p-3 bg-[#091322] border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span>Date: <strong className="text-white">{formatUTCDate(selectedHeatmapCell.deliveryDate)}</strong></span>
              <span>Settlement Period: <strong className="text-white">SP {selectedHeatmapCell.settlementPeriod}</strong></span>
              <span>Actual: <strong className="text-[#42DDB2]">{formatMW(selectedHeatmapCell.actualMW)}</strong></span>
              <span>Forecast: <strong className="text-[#78A8FF]">{formatMW(selectedHeatmapCell.forecastMW)}</strong></span>
              <span>
                Error: <strong className={(selectedHeatmapCell.errorMW || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {formatSignedMW(selectedHeatmapCell.errorMW)}
                </strong>
              </span>
            </div>
            <button
              onClick={() => onNavigateToExplorer?.(selectedHeatmapCell.deliveryDate)}
              className="text-[#42DDB2] hover:text-white font-semibold text-xs"
            >
              Explore this day &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Filterable Error Table */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#42DDB2]" />
              Filterable Forecast Error Dataset
            </h3>
            <p className="text-xs text-slate-400">
              Search and filter all matched settlement periods across January 2026.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex rounded-xl bg-[#091322] p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setSelectedErrorFilter('all')}
                className={`px-2.5 py-1 rounded-lg ${selectedErrorFilter === 'all' ? 'bg-[#122337] text-white font-semibold' : 'text-slate-400'}`}
              >
                All (1,488)
              </button>
              <button
                onClick={() => setSelectedErrorFilter('overforecast')}
                className={`px-2.5 py-1 rounded-lg ${selectedErrorFilter === 'overforecast' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400'}`}
              >
                Overforecasts
              </button>
              <button
                onClick={() => setSelectedErrorFilter('underforecast')}
                className={`px-2.5 py-1 rounded-lg ${selectedErrorFilter === 'underforecast' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400'}`}
              >
                Underforecasts
              </button>
              <button
                onClick={() => setSelectedErrorFilter('extreme')}
                className={`px-2.5 py-1 rounded-lg ${selectedErrorFilter === 'extreme' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400'}`}
              >
                Severe &gt; 1.5GW
              </button>
            </div>

            {/* Search */}
            <div className="relative w-44">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#091322] border border-slate-700 rounded-xl pl-9 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#091322] text-slate-400 border-b border-slate-800">
                <th onClick={() => handleSort('deliveryDate')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('settlementPeriod')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>SP</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('actualMW')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Actual (MW)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('forecastMW')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Forecast (MW)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('errorMW')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Signed Error</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('absErrorMW')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Absolute Error</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-2.5 px-3">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {tableRows.slice(0, 10).map((r, idx) => {
                const isOver = r.errorMW > 0;
                const isSevere = Math.abs(r.errorMW) > 1500;

                return (
                  <tr key={`${r.deliveryDate}-${r.settlementPeriod}`} className="hover:bg-[#172c45]/40 transition-colors">
                    <td className="py-2 px-3 font-sans text-white">{formatUTCDate(r.deliveryDate)}</td>
                    <td className="py-2 px-3 text-slate-300 font-bold">#{r.settlementPeriod}</td>
                    <td className="py-2 px-3 text-[#42DDB2] font-semibold">{formatMW(r.actualMW)}</td>
                    <td className="py-2 px-3 text-[#78A8FF] font-semibold">{formatMW(r.forecastMW)}</td>
                    <td className={`py-2 px-3 font-semibold ${isOver ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatSignedMW(r.errorMW)}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{formatMW(r.absErrorMW)}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSevere
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isOver
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isSevere ? 'Severe Error' : isOver ? 'Overforecast' : 'Underforecast'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Showing top 10 of {tableRows.length} filtered records</span>
          <button
            onClick={handleExportCSV}
            className="text-[#42DDB2] hover:underline font-semibold"
          >
            Export all {tableRows.length} rows to CSV &rarr;
          </button>
        </div>
      </div>
    </motion.div>
  );
}
