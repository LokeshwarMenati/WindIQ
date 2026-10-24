import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { X, Layers, Clock, Wind } from 'lucide-react';
import { api } from '../services/api';

export default function ForecastEvolutionModal({ startTime, period, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchEvolution() {
      if (!startTime) return;
      setLoading(true);
      try {
        const res = await api.getForecastEvolution(startTime);
        if (isMounted) setData(res);
      } catch (err) {
        console.error("Failed to load forecast evolution:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchEvolution();
    return () => { isMounted = false; };
  }, [startTime]);

  if (!startTime) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)' }}>
              <Layers size={18} color="#a78bfa" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                Forecast Horizon Convergence (Settlement Period {period})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Target Delivery Time: <span className="mono" style={{ color: '#00f2fe' }}>{startTime}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading forecast horizon records...</p>
        ) : !data || data.evolution.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No prior forecast runs found for this period.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(17, 24, 39, 0.6)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Actual Outturn</span>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
                  {data.actualMW !== null ? `${data.actualMW.toLocaleString()} MW` : 'N/A'}
                </div>
              </div>

              <div style={{ background: 'rgba(17, 24, 39, 0.6)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Forecast Updates</span>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#00f2fe' }}>
                  {data.evolution.length} Runs Published
                </div>
              </div>
            </div>

            {/* Convergence Line Chart */}
            <div style={{ width: '100%', height: '240px', marginBottom: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={[...data.evolution].reverse()} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    dataKey="leadTimeHours" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickFormatter={(v) => `T-${v}h`} 
                    label={{ value: 'Lead Time Before Delivery', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis stroke="#64748b" fontSize={11} unit=" MW" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div style={{ background: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px', borderRadius: '6px', fontSize: '0.78rem' }}>
                          <div style={{ fontWeight: 600 }}>Published: {p.publishTime}</div>
                          <div>Lead Time: T-{p.leadTimeHours} hours</div>
                          <div style={{ color: '#00f2fe' }}>Forecast: {p.forecastMW.toLocaleString()} MW</div>
                          <div style={{ color: p.errorMW > 0 ? '#f43f5e' : '#10b981' }}>
                            Error: {p.errorMW > 0 ? `+${p.errorMW}` : p.errorMW} MW
                          </div>
                        </div>
                      );
                    }}
                  />
                  {data.actualMW !== null && (
                    <ReferenceLine y={data.actualMW} stroke="#10b981" strokeWidth={2} label={{ value: 'Actual Outturn', fill: '#10b981', fontSize: 11 }} />
                  )}
                  <Line 
                    type="stepAfter" 
                    dataKey="forecastMW" 
                    name="Forecast Evolution" 
                    stroke="#00f2fe" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, fill: '#00f2fe' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Table of runs */}
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Elexon Publish Time</th>
                    <th>Lead Time</th>
                    <th>Forecast (MW)</th>
                    <th>Error (MW)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evolution.map((run, idx) => (
                    <tr key={idx}>
                      <td className="mono">{run.publishTime}</td>
                      <td className="mono" style={{ color: '#a78bfa' }}>T-{run.leadTimeHours} hrs</td>
                      <td className="mono" style={{ color: '#00f2fe' }}>{run.forecastMW.toLocaleString()}</td>
                      <td className="mono" style={{ color: run.errorMW > 0 ? '#f43f5e' : '#10b981' }}>
                        {run.errorMW > 0 ? `+${run.errorMW}` : run.errorMW}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
