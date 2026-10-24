import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea
} from 'recharts';
import { Compass, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function DiurnalChart({ gateClosureTime }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDiurnal() {
      setLoading(true);
      try {
        const res = await api.getDiurnalProfile(gateClosureTime);
        if (isMounted) setData(res);
      } catch (err) {
        console.error("Failed to load diurnal profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDiurnal();
    return () => { isMounted = false; };
  }, [gateClosureTime]);

  if (loading || !data) {
    return (
      <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Aggregating 48 settlement periods across all days in January 2026...</p>
      </div>
    );
  }

  const chartData = data.periods.map(p => ({
    period: p.settlementPeriod,
    time: p.timeLabel,
    avgActual: p.avgActualMW,
    avgForecast: p.avgForecastMW,
    mae: p.maeMW,
    bias: p.biasMW,
    p90: p.p90ErrorMW
  }));

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
        minWidth: '220px'
      }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>
          Settlement Period {d.period} ({d.time} UTC)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#10b981' }}>Month Avg Actual:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{d.avgActual.toLocaleString()} MW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#00f2fe' }}>Month Avg Forecast:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{d.avgForecast.toLocaleString()} MW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#f59e0b' }}>Mean Abs Error (MAE):</span>
            <span className="mono" style={{ fontWeight: 600 }}>{d.mae.toLocaleString()} MW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8b5cf6' }}>P90 Shortfall Cushion:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{d.p90.toLocaleString()} MW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: d.bias > 0 ? '#f43f5e' : '#10b981' }}>Diurnal Bias:</span>
            <span className="mono" style={{ fontWeight: 700 }}>{d.bias > 0 ? `+${d.bias}` : d.bias} MW</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.15)' }}>
              <Compass size={20} color="#00f2fe" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
                Diurnal Error & Generation Profile (Periods 1 to 48)
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Statistical aggregation across all 31 days of January 2026. Reveals diurnal forecast error patterns and peak-risk hours.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Clock size={14} color="#f59e0b" />
            <span style={{ color: '#fcd34d' }}>Morning Ramp: 07:00 - 09:00</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(244, 63, 94, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <AlertTriangle size={14} color="#f43f5e" />
            <span style={{ color: '#fda4af' }}>Evening Peak: 17:00 - 19:30</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} interval={3} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} unit=" MW" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '14px', fontSize: '0.8rem' }} iconType="circle" />

            {/* Morning ramp highlight */}
            <ReferenceArea x1="07:00" x2="09:00" strokeOpacity={0.3} fill="#f59e0b" fillOpacity={0.06} />
            {/* Evening peak highlight */}
            <ReferenceArea x1="17:00" x2="19:30" strokeOpacity={0.3} fill="#f43f5e" fillOpacity={0.06} />

            <Line
              type="monotone"
              dataKey="avgActual"
              name="Avg Actual Generation (MW)"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="avgForecast"
              name="Avg Day-Ahead Forecast (MW)"
              stroke="#00f2fe"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="mae"
              name="Mean Absolute Error (MAE MW)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="p90"
              name="P90 Shortfall Cushion (MW)"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="2 2"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
        <div style={{ background: 'rgba(17, 24, 39, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, marginBottom: '6px' }}>
            Morning Ramp Vulnerability (SP 14-18)
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Wind forecasts during morning ramp-up exhibit elevated variance due to diurnal boundary layer mixing. Traders should size dynamic spinning reserve.
          </p>
        </div>

        <div style={{ background: 'rgba(17, 24, 39, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, marginBottom: '6px' }}>
            Evening Peak Exposure (SP 34-39)
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            System demand peaks between 17:00 and 19:30. A wind drop during these periods coincides with highest system cashout prices (SBP &gt; £200/MWh).
          </p>
        </div>
      </div>
    </div>
  );
}
