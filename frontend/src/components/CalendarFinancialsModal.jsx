import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Coins, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Info,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { 
  formatMW, 
  formatGW, 
  formatGWh, 
  formatGBP, 
  formatWatts, 
  formatUTCDate 
} from '../utils/formatters';

export default function CalendarFinancialsModal({
  isOpen,
  onClose,
  onSelectDate,
  cutoffTime = '11:00'
}) {
  const [selectedMonth, setSelectedMonth] = useState('2026-01');
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    async function loadFinancials() {
      setLoading(true);
      try {
        const data = await api.getFinancials(selectedMonth, cutoffTime);
        if (isCurrent) setFinancialData(data);
      } catch (err) {
        console.error("Error loading financial data:", err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadFinancials();
    return () => { isCurrent = false; };
  }, [isOpen, selectedMonth, cutoffTime]);

  if (!isOpen) return null;

  const summary = financialData?.summary || {};
  const dailyList = financialData?.dailyBreakdown || [];
  const comparison = financialData?.comparisonMonths || {};
  const currentMonthData = comparison[selectedMonth] || {};

  const isNetProfit = summary.netImbalancePnLGBP >= 0;

  // Calendar setup for January 2026 (starts on Thursday = index 3)
  // For standard calendar rendering with leading empty slots:
  const getLeadingEmptySlots = (monthKey) => {
    if (monthKey === '2026-01') return 3; // Thu (0=Mon, 1=Tue, 2=Wed, 3=Thu)
    if (monthKey === '2025-12') return 0; // Mon
    if (monthKey === '2025-11') return 5; // Sat
    return 0;
  };

  const leadingEmptySlots = getLeadingEmptySlots(selectedMonth);
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl bg-[#091322] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-[#0d1b2a] via-[#122337] to-[#091322] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#42DDB2]/15 border border-[#42DDB2]/30 flex items-center justify-center text-[#42DDB2]">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Trading Calendar &amp; Monthly Energy P&amp;L Analysis
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#78A8FF]/15 border border-[#78A8FF]/30 text-[#78A8FF]">
                  GB Wholesale EPEX SPOT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Browse historical calendar months, power output (Watts/MWh), and forecast imbalance Profit/Loss.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Month Selector Tabs */}
        <div className="px-6 pt-4 pb-2 bg-[#0d1b2a]/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#122337] rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedMonth('2026-01')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedMonth === '2026-01'
                  ? 'bg-[#42DDB2] text-[#091322] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              January 2026 (Live BMRS)
            </button>
            <button
              onClick={() => setSelectedMonth('2025-12')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedMonth === '2025-12'
                  ? 'bg-[#78A8FF] text-[#091322] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              December 2025 (Last Month)
            </button>
            <button
              onClick={() => setSelectedMonth('2025-11')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedMonth === '2025-11'
                  ? 'bg-purple-400 text-[#091322] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              November 2025 (Last Last Month)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Decision Cutoff:</span>
            <span className="text-[#42DDB2] font-semibold">{cutoffTime} UTC (D-1)</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Key Monthly Power & P&L Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Total Energy Delivered (Watts & GWh) */}
            <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#42DDB2]" /> Total Generation
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Watts / GWh</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                {formatGWh(summary.totalEnergyMWh)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Avg Power:</span>
                <span className="text-[#42DDB2] font-mono font-semibold">{formatMW(summary.avgPowerMW)}</span>
              </div>
            </div>

            {/* 2. Gross Wholesale Market Value */}
            <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Coins size={14} className="text-[#78A8FF]" /> Wholesale Revenue
                </span>
                <span className="text-[10px] text-slate-500 font-mono">@ £78.50/MWh</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#78A8FF] font-mono">
                {formatGBP(summary.grossWholesaleIncomeGBP)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Total Delivery MWh:</span>
                <span className="text-white font-mono">{Number(summary.totalEnergyMWh || 0).toLocaleString()} MWh</span>
              </div>
            </div>

            {/* 3. Shortfall Imbalance Penalty (Loss) */}
            <div className="bg-[#122337] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <TrendingDown size={14} /> Shortfall Penalty Loss
                </span>
                <span className="text-[10px] text-rose-400/80 font-mono">F &gt; A Deficit</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono">
                -{formatGBP(summary.shortfallPenaltyLossGBP)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>System Buy Price:</span>
                <span className="text-rose-300 font-mono">£98.00/MWh</span>
              </div>
            </div>

            {/* 4. Net Forecast Imbalance P&L Status */}
            <div className={`border rounded-xl p-4 space-y-2 ${
              isNetProfit 
                ? 'bg-emerald-950/20 border-emerald-500/30' 
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  {isNetProfit ? <TrendingUp size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-rose-400" />}
                  Net Imbalance Status
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isNetProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {isNetProfit ? 'NET PROFIT' : 'NET IMBALANCE LOSS'}
                </span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold font-mono ${
                isNetProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {summary.netImbalancePnLGBP > 0 ? '+' : ''}{formatGBP(summary.netImbalancePnLGBP)}
              </div>
              <div className="text-[11px] text-slate-400">
                {isNetProfit ? 'Surplus wind exceeded shortfalls' : 'Shortfall penalties exceeded surplus value'}
              </div>
            </div>
          </div>

          {/* Selected Month Calendar View */}
          <div className="bg-[#122337] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarIcon size={16} className="text-[#42DDB2]" />
                  {selectedMonth === '2026-01' ? 'January 2026 Daily Trading Calendar' : `${currentMonthData.label || selectedMonth} Calendar`}
                </h3>
                <p className="text-xs text-slate-400">
                  Click any day to jump to its half-hourly delivery curve in Forecast Explorer. Hover to view daily P&amp;L breakdown.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Profit / Surplus
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Loss / Shortfall
                </span>
              </div>
            </div>

            {/* Calendar Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
              {weekdays.map(w => (
                <div key={w} className="py-1">{w}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Leading Empty Slots */}
              {Array.from({ length: leadingEmptySlots }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 bg-[#091322]/30 rounded-xl border border-slate-800/40 opacity-30"></div>
              ))}

              {/* Days of Month */}
              {dailyList.map((dayItem) => {
                const isDayProfit = dayItem.netImbalancePnLGBP >= 0;
                const isHovered = hoveredDay?.date === dayItem.date;

                return (
                  <div
                    key={dayItem.date}
                    onMouseEnter={() => setHoveredDay(dayItem)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => {
                      if (selectedMonth === '2026-01') {
                        onSelectDate?.(dayItem.date);
                        onClose();
                      }
                    }}
                    className={`relative h-20 p-2 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                      isHovered 
                        ? 'border-[#42DDB2] shadow-lg shadow-[#42DDB2]/15 bg-[#172c45] scale-105 z-10' 
                        : isDayProfit
                        ? 'bg-[#0f2334] border-emerald-500/20 hover:border-emerald-500/50'
                        : 'bg-[#1e1724] border-rose-500/20 hover:border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-white">
                        {dayItem.day}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        isDayProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {isDayProfit ? 'PROFIT' : 'LOSS'}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono text-[#78A8FF] font-semibold">
                        {formatMW(dayItem.avgPowerMW, 0)}
                      </div>
                      <div className={`text-[10px] font-mono font-bold ${
                        isDayProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {dayItem.netImbalancePnLGBP > 0 ? '+' : ''}{formatGBP(dayItem.netImbalancePnLGBP)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hovered Day Details Popover / Banner */}
            {hoveredDay ? (
              <div className="p-3 bg-[#091322] border border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-white font-sans font-bold">
                    {formatUTCDate(hoveredDay.date)}:
                  </span>
                  <span>Avg Output: <strong className="text-[#42DDB2]">{formatMW(hoveredDay.avgPowerMW)}</strong> ({formatWatts(hoveredDay.avgPowerWatts)})</span>
                  <span>Energy: <strong className="text-white">{Number(hoveredDay.energyMWh).toLocaleString()} MWh</strong></span>
                </div>

                <div className="flex items-center gap-4">
                  <span>Gross Value: <strong className="text-[#78A8FF]">{formatGBP(hoveredDay.grossIncomeGBP)}</strong></span>
                  <span>Imbalance: <strong className={hoveredDay.netImbalancePnLGBP >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {hoveredDay.netImbalancePnLGBP > 0 ? '+' : ''}{formatGBP(hoveredDay.netImbalancePnLGBP)}
                  </strong></span>
                  <span className="text-slate-400 font-sans text-[11px]">Click to view in Explorer &rarr;</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-1 text-[11px] text-slate-500">
                Hover over any date square for detailed energy (Watts/MWh) &amp; P&amp;L breakdown.
              </div>
            )}
          </div>

          {/* Historical Multi-Month Comparison ("view last last month data") */}
          <div className="bg-[#122337] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-[#78A8FF]" />
              Multi-Month Historical Comparison (January 2026 vs Last Month vs Last Last Month)
            </h3>
            <p className="text-xs text-slate-400">
              Benchmarking power delivered (Watts/GWh), wholesale market revenue, and unhedged imbalance penalties.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {['2026-01', '2025-12', '2025-11'].map((mKey) => {
                const mData = comparison[mKey] || {};
                const isSelected = selectedMonth === mKey;
                const mProfit = mData.status === 'PROFIT';

                return (
                  <div
                    key={mKey}
                    onClick={() => setSelectedMonth(mKey)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected 
                        ? 'bg-[#172c45] border-[#42DDB2] shadow-md shadow-[#42DDB2]/10' 
                        : 'bg-[#091322] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{mData.label}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        mProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {mData.status || 'PROFIT'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Total Energy:</span>
                        <span className="text-white font-semibold">{mData.totalEnergyGWh} GWh</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Avg Power Output:</span>
                        <span className="text-[#42DDB2]">{formatMW(mData.avgPowerMW)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Wholesale Revenue:</span>
                        <span className="text-[#78A8FF]">{formatGBP(mData.grossWholesaleIncomeGBP)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                        <span>Net Imbalance P&amp;L:</span>
                        <span className={`font-bold ${mProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {mData.netImbalancePnLGBP > 0 ? '+' : ''}{formatGBP(mData.netImbalancePnLGBP)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                      {mData.highlight}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0d1b2a] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-[#42DDB2]" />
            <span>EPEX SPOT Day-Ahead wholesale benchmark: £78.50/MWh. Cashout penalty: £98.00/MWh.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Calendar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
