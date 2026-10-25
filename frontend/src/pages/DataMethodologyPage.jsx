import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  ExternalLink, 
  Database, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Scale, 
  FileText,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function DataMethodologyPage({ apiHealth }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto"
    >
      {/* Title */}
      <div className="bg-[#122337] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#42DDB2]/15 text-[#42DDB2]">
            <BookOpen size={20} />
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Data Architecture &amp; Methodology
          </h1>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Comprehensive documentation of Elexon BMRS data feeds, decision-time forecast freezing logic, statistical accuracy formulas, and operational boundary conditions.
        </p>
      </div>

      {/* Critical Procurement Disclaimer Alert */}
      <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-100 flex items-start gap-4 shadow-lg">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
          <AlertTriangle size={20} />
        </div>
        <div className="space-y-1.5 text-xs md:text-sm">
          <h3 className="font-bold text-white text-sm md:text-base">
            Essential Market Reality: Procurement Requirement Determination
          </h3>
          <p className="text-amber-200/90 leading-relaxed">
            National wind generation forecasts alone <strong>cannot determine a utility's actual electricity procurement requirement</strong>. 
            A power purchasing desk must additionally incorporate consumer demand curves, customer base load requirements, thermal fleet availability (CCGT/OCGT), interconnector flows, and battery storage state-of-charge to establish its net volume position prior to day-ahead auction clearing.
          </p>
        </div>
      </div>

      {/* Section 1: Elexon BMRS Datasets */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[#42DDB2]" />
            <h2 className="text-lg font-bold text-white">1. Elexon BMRS Core Datasets</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#42DDB2]/15 text-[#42DDB2] font-semibold">
            Official Data Source
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          WindIQ sources all physical power data from the <strong>Elexon Insights Solution (BMRS)</strong>, the central market operational platform for Great Britain's electricity balancing and settlement.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* FUELHH Card */}
          <div className="p-4 rounded-xl bg-[#091322] border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#42DDB2] text-sm">FUELHH (Actuals)</span>
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#78A8FF] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Docs</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-xs text-slate-300">
              Half-hourly outturn generation by fuel type for Great Britain.
            </p>
            <div className="space-y-1 text-xs text-slate-400 font-mono bg-[#122337] p-2.5 rounded-lg border border-slate-800">
              <div><strong>Filter:</strong> fuelType = "WIND"</div>
              <div><strong>Key Fields:</strong> startTime, generation</div>
              <div><strong>Timezone:</strong> UTC (GMT)</div>
            </div>
          </div>

          {/* WINDFOR Card */}
          <div className="p-4 rounded-xl bg-[#091322] border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[#78A8FF] text-sm">WINDFOR (Forecasts)</span>
              <a
                href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#78A8FF] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Docs</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-xs text-slate-300">
              National wind generation forecasts published at regular intervals across multi-day horizons.
            </p>
            <div className="space-y-1 text-xs text-slate-400 font-mono bg-[#122337] p-2.5 rounded-lg border border-slate-800">
              <div><strong>Key Fields:</strong> startTime, publishTime, generation</div>
              <div><strong>Horizons:</strong> Day D-3 down to Intraday</div>
              <div><strong>Timezone:</strong> UTC (GMT)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Decision Cutoff & Vintage Selection */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock size={18} className="text-[#78A8FF]" />
          <h2 className="text-lg font-bold text-white">2. Publication Time vs Delivery Time &amp; Look-ahead Elimination</h2>
        </div>

        <div className="space-y-3 text-xs md:text-sm text-slate-300 leading-relaxed">
          <p>
            In the UK wholesale power market, the <strong>Day-Ahead Auction (EPEX SPOT / Nord Pool GB)</strong> closes at <strong>11:00 UTC on Day D-1</strong> for power delivery across all 48 half-hour settlement periods of Day D.
          </p>

          <div className="p-4 rounded-xl bg-[#091322] border border-slate-800 space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-[#42DDB2]">
              Strict Decision-Time Selection Rule:
            </h4>
            <p className="font-mono text-xs text-slate-300">
              For every delivery period (startTime = t), select the forecast record matching:
            </p>
            <div className="p-2.5 rounded-lg bg-[#122337] text-white font-mono text-xs border border-slate-700">
              F(t) = argmax &#123; publishTime &le; Cutoff(D-1) &#125; [ publishTime ]
            </div>
            <p className="text-xs text-slate-400">
              For retrospective historical evaluation, <strong>never use any forecast published after the decision cutoff</strong>. Using an intraday or updated forecast published closer to real-time would introduce severe look-ahead bias and invalidate trading risk backtests.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Metric Definitions & Formulas */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Scale size={18} className="text-[#42DDB2]" />
          <h2 className="text-lg font-bold text-white">3. Quantitative Metric Definitions &amp; Formulas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* MAE */}
          <div className="p-4 rounded-xl bg-[#091322] border border-slate-800 space-y-2">
            <div className="font-bold text-white">Mean Absolute Error (MAE)</div>
            <div className="p-2 rounded bg-[#122337] font-mono text-slate-300">
              MAE = (1 / n) &times; &sum; |Forecast_i − Actual_i|
            </div>
            <p className="text-slate-400">
              Measures the average magnitude of errors without considering their direction. Expressed in MW.
            </p>
          </div>

          {/* RMSE */}
          <div className="p-4 rounded-xl bg-[#091322] border border-slate-800 space-y-2">
            <div className="font-bold text-white">Root Mean Squared Error (RMSE)</div>
            <div className="p-2 rounded bg-[#122337] font-mono text-slate-300">
              RMSE = &radic;[ (1 / n) &times; &sum; (Forecast_i − Actual_i)&sup2; ]
            </div>
            <p className="text-slate-400">
              Penalizes large outlier forecast misses quadratically, directly aligning with non-linear balancing penalty costs.
            </p>
          </div>

          {/* Signed Bias */}
          <div className="p-4 rounded-xl bg-[#091322] border border-slate-800 space-y-2">
            <div className="font-bold text-white">Signed Forecast Bias (MBE)</div>
            <div className="p-2 rounded bg-[#122337] font-mono text-slate-300">
              MBE = (1 / n) &times; &sum; (Forecast_i − Actual_i)
            </div>
            <p className="text-slate-400">
              Identifies systemic over-forecasting (+MW = deficit risk) versus under-forecasting (−MW = surplus).
            </p>
          </div>

          {/* WAPE */}
          <div className="p-4 rounded-xl bg-[#091322] border border-slate-800 space-y-2">
            <div className="font-bold text-white">Weighted Absolute Percentage Error (WAPE)</div>
            <div className="p-2 rounded bg-[#122337] font-mono text-slate-300">
              WAPE = [ &sum; |Forecast_i − Actual_i| / &sum; Actual_i ] &times; 100%
            </div>
            <p className="text-slate-400">
              Scale-independent metric that avoids division-by-zero artifacts during calm, low-wind periods.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Data Freshness & Verification Status */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white">4. Data Freshness &amp; Validation Status</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
            {apiHealth?.status === 'healthy' ? 'API Healthy' : 'Online'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#091322] rounded-xl border border-slate-800">
            <span className="text-slate-400">Verified Periods</span>
            <div className="text-lg font-bold text-white mt-1">1,488 SPs</div>
            <span className="text-[11px] text-[#42DDB2]">100% January 2026</span>
          </div>

          <div className="p-3 bg-[#091322] rounded-xl border border-slate-800">
            <span className="text-slate-400">Forecast Records</span>
            <div className="text-lg font-bold text-white mt-1">{apiHealth?.forecastRecordsCount || '19,856'}</div>
            <span className="text-[11px] text-[#78A8FF]">Multi-run horizons</span>
          </div>

          <div className="p-3 bg-[#091322] rounded-xl border border-slate-800">
            <span className="text-slate-400">Timezone Standard</span>
            <div className="text-lg font-bold text-white mt-1">UTC / GMT</div>
            <span className="text-[11px] text-slate-400">Consistent Elexon standard</span>
          </div>
        </div>
      </div>

      {/* Section 5: Known Limitations */}
      <div className="bg-[#122337] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <AlertCircle size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-white">5. Known Operational Limitations</h2>
        </div>

        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
          <li>
            <strong>Transmission vs Embedded Wind:</strong> BMRS datasets primarily meter transmission-connected wind farms. Embedded distribution-level wind generation reduces gross consumer demand rather than appearing directly in FUELHH.
          </li>
          <li>
            <strong>Balancing Mechanism Curtailment:</strong> In periods of severe grid transmission constraints (e.g. Scottish export bottlenecks), the Electricity System Operator (NESO) issues Bid-Offer Acceptance (BOALF) curtailments to wind farms. Actual metered generation may reflect curtailment rather than meteorological potential.
          </li>
          <li>
            <strong>Historical Scope:</strong> January 2026 is evaluated as a completed historical evaluation period.
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
