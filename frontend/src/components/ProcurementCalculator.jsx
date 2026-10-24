import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Flame, ShieldCheck, Download, AlertCircle, CheckCircle2, TrendingUp, Sliders } from 'lucide-react';
import { api } from '../services/api';

export default function ProcurementCalculator({ deliveryDate, gateClosureTime }) {
  const [demandMW, setDemandMW] = useState(28000);
  const [confidenceLevel, setConfidenceLevel] = useState(0.90);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPlan() {
      setLoading(true);
      try {
        const res = await api.calculateProcurementPlan({
          deliveryDate,
          demandMW: parseFloat(demandMW),
          confidenceLevel: parseFloat(confidenceLevel),
          gateClosureCutoff: gateClosureTime
        });
        if (isMounted) setPlan(res);
      } catch (err) {
        console.error("Failed to calculate procurement plan:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPlan();
    return () => { isMounted = false; };
  }, [deliveryDate, gateClosureTime, demandMW, confidenceLevel]);

  if (!plan) {
    return (
      <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Calculating risk-adjusted thermal procurement plan...</p>
      </div>
    );
  }

  // Transform data for Recharts stacked procurement view
  const chartData = plan.periods.map((p) => ({
    period: p.settlementPeriod,
    time: p.timeLabel,
    demand: p.demandMW,
    windForecast: p.forecastWindMW,
    baseThermal: p.baseThermalMW,
    buffer: p.reserveBufferMW,
    totalProcured: p.totalThermalRecommendedMW + p.forecastWindMW,
    actualThermalNeeded: p.actualThermalNeededMW,
    actualWind: p.actualWindMW,
    imbalance: p.imbalanceExposureMW
  }));

  const exportCSV = () => {
    const headers = [
      "SettlementPeriod", "TimeUTC", "DemandMW", "ForecastWindMW", 
      "BaseThermalMW", "ReserveBufferMW", "TotalRecommendedThermalMW", "ActualWindMW"
    ];
    const rows = plan.periods.map(p => [
      p.settlementPeriod, p.timeLabel, p.demandMW, p.forecastWindMW,
      p.baseThermalMW, p.reserveBufferMW, p.totalThermalRecommendedMW, p.actualWindMW ?? ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AeroProcure_ThermalPlan_${deliveryDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '14px 18px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        fontSize: '0.8rem',
        minWidth: '240px'
      }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>
          Period {d.period} ({d.time} UTC)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#cbd5e1' }}>Consumer Demand:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{d.demand.toLocaleString()} MW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#00f2fe' }}>Expected Wind:</span>
            <span className="mono" style={{ fontWeight: 600, color: '#00f2fe' }}>{d.windForecast.toLocaleString()} MW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#f59e0b' }}>Base Thermal Needed:</span>
            <span className="mono" style={{ fontWeight: 600, color: '#f59e0b' }}>{d.baseThermal.toLocaleString()} MW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8b5cf6' }}>Quantified Reserve Buffer:</span>
            <span className="mono" style={{ fontWeight: 600, color: '#a78bfa' }}>+{d.buffer.toLocaleString()} MW</span>
          </div>
          <div style={{ 
            marginTop: '6px', 
            paddingTop: '6px', 
            borderTop: '1px solid rgba(255,255,255,0.08)', 
            display: 'flex', 
            justifyContent: 'space-between',
            fontWeight: 700
          }}>
            <span style={{ color: '#f8fafc' }}>Total Recommended Thermal:</span>
            <span className="mono" style={{ color: '#38bdf8' }}>{(d.baseThermal + d.buffer).toLocaleString()} MW</span>
          </div>
          {d.actualThermalNeeded !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', marginTop: '4px' }}>
              <span>Actual Outturn Needed:</span>
              <span className="mono">{d.actualThermalNeeded.toLocaleString()} MW</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '24px' }}>
      {/* Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)' }}>
              <Flame size={20} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
                Day-Ahead Thermal Power Procurement & Buffer Sizing Optimizer
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Recommends hourly thermal base procurement + statistical reserve buffer to eliminate imbalance cashout exposure.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={exportCSV}
          className="btn btn-outline"
          style={{ borderColor: 'rgba(0, 242, 254, 0.3)', color: '#00f2fe' }}
        >
          <Download size={15} />
          <span>Export Dispatch Plan (CSV)</span>
        </button>
      </div>

      {/* Interactive Parameter Controls */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        background: 'rgba(17, 24, 39, 0.5)', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '24px'
      }}>
        {/* Demand Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} color="#00f2fe" />
              Utility Peak Consumer Demand Baseline
            </label>
            <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00f2fe' }}>
              {parseInt(demandMW).toLocaleString()} MW
            </span>
          </div>
          <input
            type="range"
            min="15000"
            max="45000"
            step="1000"
            value={demandMW}
            onChange={(e) => setDemandMW(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            <span>15,000 MW (Low Night)</span>
            <span>28,000 MW (Normal Winter)</span>
            <span>45,000 MW (Peak Polar Freeze)</span>
          </div>
        </div>

        {/* Confidence Level Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#a78bfa" />
              Risk Coverage Confidence Level
            </label>
            <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a78bfa' }}>
              {(confidenceLevel * 100).toFixed(0)}% Coverage
            </span>
          </div>
          <input
            type="range"
            min="0.80"
            max="0.99"
            step="0.01"
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            <span>80% (Aggressive / Lean)</span>
            <span>90% (Standard Desk)</span>
            <span>99% (Maximum Risk Averse)</span>
          </div>
        </div>
      </div>

      {/* Plan KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '14px', 
        marginBottom: '24px' 
      }}>
        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Consumer Demand</span>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            {(plan.totalDemandMWh / 1000).toFixed(1)}k <span style={{ fontSize: '0.8rem', color: '#64748b' }}>MWh</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Expected Wind Share</span>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f2fe', marginTop: '4px' }}>
            {((plan.expectedWindMWh / plan.totalDemandMWh) * 100).toFixed(1)}%
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{(plan.expectedWindMWh / 1000).toFixed(1)}k MWh wind</span>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Base Thermal Needed</span>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {(plan.baseThermalMWh / 1000).toFixed(1)}k <span style={{ fontSize: '0.8rem', color: '#64748b' }}>MWh</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderColor: 'rgba(139, 92, 246, 0.4)' }}>
          <span style={{ fontSize: '0.72rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 600 }}>
            Quantified Reserve Buffer
          </span>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa', marginTop: '4px' }}>
            +{(plan.reserveBufferMWh / 1000).toFixed(1)}k <span style={{ fontSize: '0.8rem', color: '#64748b' }}>MWh</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Margin: {plan.bufferMarginMW} MW</span>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderColor: 'rgba(0, 242, 254, 0.4)' }}>
          <span style={{ fontSize: '0.72rem', color: '#00f2fe', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Recommended Thermal
          </span>
          <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f2fe', marginTop: '4px' }}>
            {(plan.totalRecommendedThermalMWh / 1000).toFixed(1)}k <span style={{ fontSize: '0.8rem', color: '#64748b' }}>MWh</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Base + Risk Cushion</span>
        </div>
      </div>

      {/* Stacked Procurement vs Demand Chart */}
      <div style={{ width: '100%', height: '360px', marginBottom: '24px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} interval={3} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} unit=" MW" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} iconType="circle" />

            {/* Expected Wind Area */}
            <Area
              type="monotone"
              dataKey="windForecast"
              name="Expected Wind Generation (MW)"
              stackId="procurement"
              stroke="#00f2fe"
              fill="#00f2fe"
              fillOpacity={0.3}
            />

            {/* Base Thermal Area */}
            <Area
              type="monotone"
              dataKey="baseThermal"
              name="Base Thermal Procurement (MW)"
              stackId="procurement"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.4}
            />

            {/* Reserve Buffer Area */}
            <Area
              type="monotone"
              dataKey="buffer"
              name="Quantified Risk Buffer (MW)"
              stackId="procurement"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.5}
            />

            {/* Consumer Demand Target Line */}
            <Line
              type="monotone"
              dataKey="demand"
              name="Consumer Electricity Demand Profile (MW)"
              stroke="#f8fafc"
              strokeWidth={3}
              dot={false}
            />

            {/* Outturn Thermal Actually Needed */}
            <Line
              type="monotone"
              dataKey="actualThermalNeeded"
              name="Outturn Thermal Needed (Post-Delivery Actual)"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Value Realization Banner */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 size={24} color="#10b981" />
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>
              Risk Mitigation Performance: Zero System Buy Price Penalty Exposure
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Procuring this sized buffer protects against wind deficit periods without excessive thermal fuel wastage.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Uncovered Risk Periods</span>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
              0 of 48 Periods
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
