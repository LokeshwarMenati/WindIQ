import React, { useState } from 'react';
import { 
  Menu, 
  RotateCw, 
  Calendar, 
  Clock, 
  Database, 
  Activity, 
  CheckCircle2, 
  Lock,
  Sparkles
} from 'lucide-react';
import { formatFullUTCTimestamp } from '../utils/formatters';

export default function Header({ 
  onToggleMobileMenu, 
  analysisPeriod = 'January 2026', 
  selectedDate,
  cutoffTime = '11:00',
  apiStatus = 'online',
  lastRefreshTime,
  onRefresh,
  isRefreshing = false
}) {
  return (
    <header className="sticky top-0 z-20 bg-[#091322]/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger + Selected Analysis Period */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg bg-[#122337] border border-slate-800"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#122337] border border-slate-700/80 text-xs">
            <Calendar size={14} className="text-[#42DDB2]" />
            <span className="text-slate-400">Analysis Period:</span>
            <span className="font-semibold text-white">{analysisPeriod}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#122337]/70 border border-slate-800 text-xs text-slate-300">
            <Lock size={13} className="text-[#78A8FF]" />
            <span className="hidden sm:inline text-slate-400">Decision Cutoff:</span>
            <span className="font-mono font-medium text-[#78A8FF]">{cutoffTime} UTC (D-1)</span>
          </div>
        </div>
      </div>

      {/* Right: Data freshness, API status, Last refresh, Refresh button */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Data Freshness Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#122337]/50 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42DDB2] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#42DDB2]"></span>
          </span>
          <span className="text-slate-300">Data Freshness:</span>
          <span className="font-medium text-[#42DDB2]">Verified Elexon BMRS</span>
        </div>

        {/* API Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium">
          <Activity size={13} className="text-emerald-400" />
          <span className="hidden sm:inline">API:</span>
          <span className="uppercase tracking-wider">{apiStatus}</span>
        </div>

        {/* Last Refresh Timestamp */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock size={13} className="text-slate-400" />
          <span>Refreshed:</span>
          <span className="text-slate-300">
            {lastRefreshTime ? formatFullUTCTimestamp(lastRefreshTime) : '2026-01-31 23:59 UTC'}
          </span>
        </div>

        {/* Refresh Action Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#122337] to-[#1a3350] hover:from-[#172c45] hover:to-[#224268] border border-slate-700 text-xs font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-50"
          title="Refresh cached Elexon BMRS datasets"
        >
          <RotateCw size={13} className={`text-[#42DDB2] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>
    </header>
  );
}
