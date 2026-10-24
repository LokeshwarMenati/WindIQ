import React from 'react';
import { Wind, Activity, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, Target } from 'lucide-react';

export default function SummaryCards({ metrics, points, selectedDate }) {
  if (!metrics) return null;

  const validPoints = points.filter(p => p.actualMW !== null && p.dayAheadForecastMW !== null);
  const avgActual = validPoints.length ? Math.round(validPoints.reduce((acc, p) => acc + p.actualMW, 0) / validPoints.length) : 0;
  const avgForecast = validPoints.length ? Math.round(validPoints.reduce((acc, p) => acc + p.dayAheadForecastMW, 0) / validPoints.length) : 0;

  // Determine bias severity
  const isOverforecast = metrics.mbe > 0;
  const biasLabel = isOverforecast ? 'Overforecasting (Shortfall Risk)' : 'Underforecasting (Surplus Risk)';
  const biasColor = isOverforecast ? '#f43f5e' : '#10b981';

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
      gap: '16px', 
      margin: '0 24px 20px 24px' 
    }}>
      {/* 1. Actual Outturn Generation */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Actual Outturn (WIND)
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)' }}>
            <Wind size={16} color="#10b981" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {avgActual.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>MW avg</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>Total Energy:</span>
          <span className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>
            {metrics.totalActualMWh.toLocaleString()} MWh
          </span>
        </div>
      </div>

      {/* 2. Day-Ahead Forecast */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Day-Ahead Forecast
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.1)' }}>
            <Target size={16} color="#00f2fe" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00f2fe' }}>
            {avgForecast.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>MW avg</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>Expected Energy:</span>
          <span className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>
            {metrics.totalForecastMWh.toLocaleString()} MWh
          </span>
        </div>
      </div>

      {/* 3. Mean Absolute Error (MAE & WAPE) */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Mean Absolute Error (MAE)
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)' }}>
            <Activity size={16} color="#f59e0b" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {metrics.mae.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>MW</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>WAPE / RMSE:</span>
          <span className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>
            {metrics.wape}% / {metrics.rmse} MW
          </span>
        </div>
      </div>

      {/* 4. Bias & Imbalance Direction */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Forecast Bias (MBE)
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: isOverforecast ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
            {isOverforecast ? <TrendingUp size={16} color="#f43f5e" /> : <TrendingDown size={16} color="#10b981" />}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: biasColor }}>
            {metrics.mbe > 0 ? `+${metrics.mbe}` : metrics.mbe}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>MW</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>Risk Skew:</span>
          <span style={{ color: biasColor, fontWeight: 600 }}>
            {metrics.overforecastRatePct}% Shortfall Periods
          </span>
        </div>
      </div>

      {/* 5. Max Single-Period Deficit Risk */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            Max Period Deficit Risk
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)' }}>
            <AlertTriangle size={16} color="#f43f5e" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e' }}>
            {metrics.maxOverforecastMW.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>MW peak drop</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>P90 Error Margin:</span>
          <span className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>
            {metrics.p90Error} MW
          </span>
        </div>
      </div>

      {/* 6. Thermal Reserve Cushion Recommendation */}
      <div className="glass-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 600 }}>
            P95 Thermal Buffer Cushion
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)' }}>
            <ShieldCheck size={16} color="#a78bfa" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa' }}>
            {metrics.p95Error > 0 ? metrics.p95Error.toLocaleString() : '1,250'}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>MW reserve</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>Model Correlation:</span>
          <span className="mono" style={{ color: '#00f2fe', fontWeight: 600 }}>
            r = {metrics.correlation}
          </span>
        </div>
      </div>
    </div>
  );
}
