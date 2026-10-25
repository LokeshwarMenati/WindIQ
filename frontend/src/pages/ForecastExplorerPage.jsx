import React, { useState, useEffect, useMemo } from 'react';
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
  ReferenceLine 
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  Download, 
  Search, 
  ArrowUpDown, 
  Layers, 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  Eye, 
  SlidersHorizontal,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { exportToCSV } from '../utils/exportCsv';
import { 
  formatMW, 
  formatGW, 
  formatSignedMW, 
  formatPct, 
  formatUTCDate, 
  formatUTCTime,
  formatFullUTCTimestamp 
} from '../utils/formatters';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function ForecastExplorerPage({
  availableDates = [],
  selectedDate,
  onSelectDate,
  cutoffTime,
  onChangeCutoff,
  onShowToast,
  onSelectEvolution
}) {
  const [forecastData, setForecastData] = useState(null);
  const [vintagesData, setVintagesData] = useState(null);
  const [selectedVintageIds, setSelectedVintageIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVintages, setLoadingVintages] = useState(false);
  const [showVintagesOverlay, setShowVintagesOverlay] = useState(false);

  // Table filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('settlementPeriod');
  const [sortDirection, setSortDirection] = useState('asc');

  // Cutoffs available in GB market
  const cutoffOptions = [
    { value: '07:00', label: '07:00 UTC (D-1 Morning Trading)' },
    { value: '09:30', label: '09:30 UTC (D-1 Pre-Auction Calibration)' },
    { value: '11:00', label: '11:00 UTC (EPEX SPOT Day-Ahead Gate Closure)' },
    { value: '12:00', label: '12:00 UTC (Post-Auction Confirmation)' },
    { value: '15:30', label: '15:30 UTC (Afternoon Re-dispatch)' },
    { value: '18:30', label: '18:30 UTC (Evening Operational Freeze)' }
  ];

  // Key presets in January 2026
  const scenarioPresets = [
    { date: '2026-01-15', label: 'Jan 15 (Calm Wind)', badge: 'Low Wind' },
    { date: '2026-01-24', label: 'Jan 24 (Winter Storm)', badge: 'Storm Isha' },
    { date: '2026-01-08', label: 'Jan 08 (Steep Ramp)', badge: 'Ramping' },
    { date: '2026-01-29', label: 'Jan 29 (Peak 19GW)', badge: 'High Gen' }
  ];

  // Fetch forecast data whenever date or cutoff changes
  useEffect(() => {
    let isCurrent = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.getForecasts(selectedDate, cutoffTime);
        if (isCurrent) setForecastData(data);
      } catch (err) {
        console.error("Error fetching forecast explorer data:", err);
        onShowToast?.({
          type: 'error',
          title: 'Data Fetch Error',
          message: `Failed to load forecasts for ${selectedDate}: ${err.message}`
        });
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadData();
    return () => { isCurrent = false; };
  }, [selectedDate, cutoffTime]);

  // Fetch vintages if overlay is enabled
  useEffect(() => {
    let isCurrent = true;
    if (!showVintagesOverlay) return;

    async function loadVintages() {
      setLoadingVintages(true);
      try {
        const vData = await api.getVintages(selectedDate);
        if (isCurrent) {
          setVintagesData(vData);
          // Default select the earliest D-2 vintage and one intraday vintage
          if (vData?.availableVintages?.length > 0 && selectedVintageIds.length === 0) {
            const first = vData.availableVintages[0].vintageId;
            const mid = vData.availableVintages[Math.floor(vData.availableVintages.length / 2)].vintageId;
            setSelectedVintageIds([first, mid]);
          }
        }
      } catch (err) {
        console.error("Error fetching vintages:", err);
      } finally {
        if (isCurrent) setLoadingVintages(false);
      }
    }
    loadVintages();
    return () => { isCurrent = false; };
  }, [selectedDate, showVintagesOverlay]);

  // Chart data preparation combining base forecast, actuals, and selected vintages
  const chartData = useMemo(() => {
    if (!forecastData?.halfHourlyData) return [];
    
    return forecastData.halfHourlyData.map((pt) => {
      const row = {
        settlementPeriod: pt.settlementPeriod,
        startTime: pt.startTime,
        timeLabel: pt.timeLabel || `SP ${pt.settlementPeriod}`,
        actualMW: pt.actualMW,
        dayAheadForecastMW: pt.dayAheadForecastMW,
        errorMW: pt.errorMW,
        absErrorMW: pt.absErrorMW,
        dayAheadPublishTime: pt.dayAheadPublishTime
      };

      // If vintage overlay is active, merge vintage forecast values
      if (showVintagesOverlay && vintagesData?.availableVintages) {
        vintagesData.availableVintages.forEach((v) => {
          if (selectedVintageIds.includes(v.vintageId)) {
            const matchPt = v.points.find(p => p.settlementPeriod === pt.settlementPeriod);
            row[`vintage_${v.vintageId}`] = matchPt ? matchPt.forecastMW : null;
          }
        });
      }

      return row;
    });
  }, [forecastData, showVintagesOverlay, vintagesData, selectedVintageIds]);

  // Table filtering and sorting
  const filteredAndSortedRecords = useMemo(() => {
    if (!forecastData?.halfHourlyData) return [];

    let records = [...forecastData.halfHourlyData];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      records = records.filter(r => 
        r.settlementPeriod.toString().includes(q) ||
        (r.timeLabel && r.timeLabel.toLowerCase().includes(q)) ||
        (r.startTime && r.startTime.toLowerCase().includes(q))
      );
    }

    records.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return records;
  }, [forecastData, searchTerm, sortField, sortDirection]);

  // Handle CSV export
  const handleExportCSV = () => {
    if (!filteredAndSortedRecords.length) return;

    const headers = [
      { key: 'settlementPeriod', label: 'Settlement Period (SP)' },
      { key: 'startTime', label: 'Delivery Start Time (UTC)' },
      { key: 'actualMW', label: 'Outturn Actual (MW)' },
      { key: 'dayAheadForecastMW', label: 'Day-Ahead Forecast (MW)' },
      { key: 'errorMW', label: 'Signed Error [F - A] (MW)' },
      { key: 'absErrorMW', label: 'Absolute Error (MW)' },
      { key: 'errorPct', label: 'Percentage Error (%)' },
      { key: 'dayAheadPublishTime', label: 'Forecast Publication Time (UTC)' }
    ];

    const filename = `WindIQ_DayAhead_Forecast_${selectedDate}_cutoff_${cutoffTime.replace(':', '')}UTC`;
    const success = exportToCSV(filename, filteredAndSortedRecords, headers);

    if (success) {
      onShowToast?.({
        type: 'success',
        title: 'CSV Export Generated',
        message: `Exported 48 half-hourly settlement periods for ${selectedDate} to CSV.`
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

  const vintageColors = ['#F59E0B', '#A78BFA', '#EC4899', '#38BDF8', '#10B981'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Page Title & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#122337] border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#42DDB2]/15 text-[#42DDB2]">
              <Layers size={18} />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Forecast Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Inspect Day-Ahead forecast curve frozen at decision cutoff, compare publication vintages, and export half-hourly records.
          </p>
        </div>

        {/* Date and Cutoff Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Delivery Date Picker */}
          <div className="flex items-center gap-2 bg-[#091322] px-3 py-2 rounded-xl border border-slate-700">
            <Calendar size={15} className="text-[#42DDB2]" />
            <label className="text-xs text-slate-400">Delivery Date:</label>
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {availableDates.map(date => (
                <option key={date} value={date} className="bg-[#091322] text-white">
                  {formatUTCDate(date)} ({date})
                </option>
              ))}
            </select>
          </div>

          {/* Decision Cutoff Selector */}
          <div className="flex items-center gap-2 bg-[#091322] px-3 py-2 rounded-xl border border-slate-700">
            <Clock size={15} className="text-[#78A8FF]" />
            <label className="text-xs text-slate-400">Cutoff:</label>
            <select
              value={cutoffTime}
              onChange={(e) => onChangeCutoff(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {cutoffOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#091322] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#42DDB2] to-[#2ebd94] text-[#091322] text-xs font-bold hover:brightness-110 shadow-md transition-all"
            title="Download half-hourly settlement data as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Scenario Presets & Lookahead Bias Disclaimer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0d1b2a] border border-slate-800/80 px-4 py-3 rounded-xl text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">Quick Date Presets:</span>
          {scenarioPresets.map((preset) => (
            <button
              key={preset.date}
              onClick={() => onSelectDate(preset.date)}
              className={`px-2.5 py-1 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
                selectedDate === preset.date
                  ? 'bg-[#42DDB2]/15 text-[#42DDB2] border-[#42DDB2]/50 font-semibold'
                  : 'bg-[#122337] text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <span>{preset.label}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                {preset.badge}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-[#42DDB2]" />
          <span>Decision Date: <strong className="text-slate-200">{forecastData?.decisionDate || '2026-01-14'}</strong> (D-1) • Zero Look-ahead Bias</span>
        </div>
      </div>

      {/* Main Half-Hourly Time Series Chart */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-[#42DDB2]" />
              Half-Hourly Generation &amp; Forecast Curve — {formatUTCDate(selectedDate)}
            </h3>
            <p className="text-xs text-slate-400">
              Outturn actual generation (FUELHH) versus forecast available prior to {cutoffTime} UTC on Day D-1. Timezone: <strong className="text-white">UTC (GMT)</strong>.
            </p>
          </div>

          {/* Toggle Multi-Vintage Comparison */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVintagesOverlay(!showVintagesOverlay)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                showVintagesOverlay
                  ? 'bg-[#78A8FF]/20 text-[#78A8FF] border-[#78A8FF]/60'
                  : 'bg-[#091322] text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>{showVintagesOverlay ? 'Hide Vintages' : 'Compare Forecast Vintages'}</span>
            </button>
          </div>
        </div>

        {/* Vintage Multi-Select Sub-Bar */}
        {showVintagesOverlay && (
          <div className="p-3 bg-[#091322] border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">
                Select Forecast Publication Runs to Overlay:
              </span>
              {loadingVintages && <span className="text-[#78A8FF] animate-pulse">Loading vintage runs...</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              {vintagesData?.availableVintages?.slice(0, 5).map((v, idx) => {
                const isSelected = selectedVintageIds.includes(v.vintageId);
                const color = vintageColors[idx % vintageColors.length];

                return (
                  <button
                    key={v.vintageId}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedVintageIds(selectedVintageIds.filter(id => id !== v.vintageId));
                      } else {
                        setSelectedVintageIds([...selectedVintageIds, v.vintageId]);
                      }
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'bg-slate-800 border-slate-600 text-white font-medium shadow-sm'
                        : 'bg-[#122337]/50 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: isSelected ? color : '#475569' }} 
                    />
                    <span>{v.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (lead ~{v.leadHoursAvg}h)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart View */}
        {loading ? (
          <LoadingSkeleton rows={1} height="h-80" />
        ) : (
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42DDB2" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#42DDB2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e334d" vertical={false} />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="#64748b" 
                  tick={{ fontSize: 11 }}
                  interval={3}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)} GW`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091322',
                    borderColor: '#1e334d',
                    borderRadius: '10px',
                    fontSize: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                  }}
                  formatter={(val, name, item) => {
                    const formatted = `${Number(val).toLocaleString()} MW (${(Number(val) / 1000).toFixed(2)} GW)`;
                    if (name === 'actualMW') return [formatted, 'Outturn Actual (FUELHH)'];
                    if (name === 'dayAheadForecastMW') return [formatted, `Day-Ahead Forecast (${cutoffTime} UTC)`];
                    if (name === 'errorMW') {
                      const sign = Number(val) > 0 ? '+' : '';
                      const badge = Number(val) > 0 ? ' [OVERFORECAST / Deficit]' : ' [UNDERFORECAST / Surplus]';
                      return [`${sign}${Number(val).toLocaleString()} MW${badge}`, 'Signed Error [F - A]'];
                    }
                    return [formatted, name];
                  }}
                  labelFormatter={(label, items) => {
                    const payload = items?.[0]?.payload;
                    const pubTime = payload?.dayAheadPublishTime ? formatFullUTCTimestamp(payload.dayAheadPublishTime) : 'N/A';
                    return `Settlement Time: ${label} UTC (SP ${payload?.settlementPeriod || ''}) • Published: ${pubTime}`;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                />
                <ReferenceLine y={0} stroke="#475569" />

                {/* Actual Wind Generation Line */}
                <Line
                  type="monotone"
                  dataKey="actualMW"
                  name="Actual Outturn (WIND)"
                  stroke="#42DDB2"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#42DDB2' }}
                  isAnimationActive={true}
                />

                {/* Day-Ahead Frozen Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="dayAheadForecastMW"
                  name={`Day-Ahead Forecast (${cutoffTime} UTC)`}
                  stroke="#78A8FF"
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                  dot={{ r: 2.5, fill: '#78A8FF' }}
                  isAnimationActive={true}
                />

                {/* Optional Selected Vintages */}
                {showVintagesOverlay && vintagesData?.availableVintages?.map((v, idx) => {
                  if (!selectedVintageIds.includes(v.vintageId)) return null;
                  const color = vintageColors[idx % vintageColors.length];
                  return (
                    <Line
                      key={v.vintageId}
                      type="monotone"
                      dataKey={`vintage_${v.vintageId}`}
                      name={`Vintage: ${v.label}`}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                  );
                })}

                {/* Signed Error Differential Bar on Secondary View */}
                <Bar
                  dataKey="errorMW"
                  name="Signed Error (F - A)"
                  fill="#F59E0B"
                  opacity={0.3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart Legend / Metadata note */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-[#42DDB2]"></span> Actual Generation
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-[#78A8FF] border-b border-dashed"></span> Day-Ahead Decision Frozen
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 bg-amber-500/40"></span> Differential Bars
            </span>
          </div>
          <span>Click any table row to trace multi-horizon forecast evolution</span>
        </div>
      </div>

      {/* Half-Hourly Records Table */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye size={16} className="text-[#78A8FF]" />
              Half-Hourly Settlement Records (48 Settlement Periods)
            </h3>
            <p className="text-xs text-slate-400">
              Filterable and sortable records for {formatUTCDate(selectedDate)}. Timestamps labeled in UTC.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search SP or time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#091322] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#42DDB2]"
            />
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#091322] text-slate-400 border-b border-slate-800">
                <th 
                  onClick={() => handleSort('settlementPeriod')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>SP</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-3">Delivery Time (UTC)</th>
                <th 
                  onClick={() => handleSort('actualMW')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Actual (MW)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('dayAheadForecastMW')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Forecast (MW)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('errorMW')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Signed Error</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('absErrorMW')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Abs Error</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-3">Forecast Published (UTC)</th>
                <th className="py-3 px-3">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAndSortedRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-sans">
                    No matching half-hourly records found for search term "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredAndSortedRecords.map((r) => {
                  const isOver = (r.errorMW || 0) > 0;
                  const isSevere = Math.abs(r.errorMW || 0) > 1500;

                  return (
                    <tr 
                      key={r.settlementPeriod} 
                      onClick={() => onSelectEvolution?.(r.startTime, r.settlementPeriod)}
                      className="hover:bg-[#172c45]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">
                        #{r.settlementPeriod}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">
                        {r.timeLabel || formatUTCTime(r.startTime)}
                      </td>
                      <td className="py-2.5 px-3 text-[#42DDB2] font-semibold">
                        {formatMW(r.actualMW)}
                      </td>
                      <td className="py-2.5 px-3 text-[#78A8FF] font-semibold">
                        {formatMW(r.dayAheadForecastMW)}
                      </td>
                      <td className={`py-2.5 px-3 font-semibold ${isOver ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatSignedMW(r.errorMW)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {formatMW(r.absErrorMW)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] font-sans">
                        {r.dayAheadPublishTime ? formatFullUTCTimestamp(r.dayAheadPublishTime) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
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
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>Showing {filteredAndSortedRecords.length} of 48 half-hour settlement periods</span>
          <span>Tip: Click any row to trace multi-horizon forecast evolution</span>
        </div>
      </div>
    </motion.div>
  );
}
