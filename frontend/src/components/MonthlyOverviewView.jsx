import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function MonthlyOverviewView({ gateClosureTime, onSelectDate }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.getMonthlyOverview(gateClosureTime);
        if (isMounted) setOverview(res);
      } catch (err) {
        console.error("Failed to load monthly overview:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [gateClosureTime]);

  if (loading || !overview) {
    return (
      <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Aggregating 31 delivery days for January 2026...</p>
      </div>
    );
  }

  const chartData = overview.dailyBreakdown.map(d => ({
    date: d.deliveryDate.substring(5), // MM-DD
    fullDate: d.deliveryDate,
    mae: d.maeMW,
    rmse: d.rmseMW,
    actual: d.avgActualMW,
    forecast: d.avgForecastMW,
    bias: d.biasMW
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '14px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        fontSize: '0.8rem',
        minWidth: '200px'
      }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>{d.fullDate}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#f59e0b' }}>MAE:</span>
          <span className="mono" style={{ fontWeight: 600 }}>{d.mae.toLocaleString()} MW</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#10b981' }}>Avg Actual:</span>
          <span className="mono" style={{ fontWeight: 600 }}>{d.actual.toLocaleString()} MW</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#00f2fe' }}>Avg Forecast:</span>
          <span className="mono" style={{ fontWeight: 600 }}>{d.forecast.toLocaleString()} MW</span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.15)' }}>
            <Calendar size={20} color="#00f2fe" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
              Full Month Performance: January 2026
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Comprehensive 31-day evaluation across 1,488 half-hour settlement periods from Elexon BMRS.
            </p>
          </div>
        </div>
      </div>

      {/* Daily MAE and Generation Trend */}
      <div style={{ width: '100%', height: '340px', marginBottom: '24px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} unit=" MW" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} iconType="circle" />

            <Bar dataKey="mae" name="Mean Absolute Error (MW)" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Line type="monotone" dataKey="actual" name="Avg Actual Generation (MW)" stroke="#10b981" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="forecast" name="Avg Day-Ahead Forecast (MW)" stroke="#00f2fe" strokeWidth={2} strokeDasharray="3 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Breakdown Table */}
      <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Delivery Date</th>
              <th>Avg Actual (MW)</th>
              <th>Avg Forecast (MW)</th>
              <th>MAE (MW)</th>
              <th>RMSE (MW)</th>
              <th>Bias (MBE)</th>
              <th>Max Error (MW)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {overview.dailyBreakdown.map((row) => (
              <tr key={row.deliveryDate}>
                <td className="mono" style={{ fontWeight: 600, color: '#f8fafc' }}>
                  {row.deliveryDate}
                </td>
                <td className="mono" style={{ color: '#10b981' }}>{row.avgActualMW.toLocaleString()}</td>
                <td className="mono" style={{ color: '#00f2fe' }}>{row.avgForecastMW.toLocaleString()}</td>
                <td className="mono" style={{ color: '#f59e0b', fontWeight: 600 }}>{row.maeMW.toLocaleString()}</td>
                <td className="mono">{row.rmseMW.toLocaleString()}</td>
                <td className="mono" style={{ color: row.biasMW > 0 ? '#f43f5e' : '#10b981' }}>
                  {row.biasMW > 0 ? `+${row.biasMW}` : row.biasMW}
                </td>
                <td className="mono" style={{ color: '#f43f5e' }}>{row.maxErrorMW.toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => onSelectDate(row.deliveryDate)}
                    className="btn btn-outline"
                    style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: 'rgba(0,242,254,0.3)', color: '#00f2fe' }}
                  >
                    <span>Inspect</span>
                    <ArrowUpRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
