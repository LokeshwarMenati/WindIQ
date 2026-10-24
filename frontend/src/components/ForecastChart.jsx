import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Eye, Layers, TrendingUp, Info } from 'lucide-react';

export default function ForecastChart({ points, deliveryDate, gateClosureTime, onSelectPeriod }) {
  const [showIntraday, setShowIntraday] = useState(false);
  const [showErrorBars, setShowErrorBars] = useState(true);

  if (!points || points.length === 0) {
    return (
      <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading forecast and outturn generation data...</p>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = points.map((p) => {
    const hours = Math.floor((p.settlementPeriod - 1) / 2);
    const minutes = (p.settlementPeriod % 2 === 0) ? '30' : '00';
    const timeLabel = `${String(hours).padStart(2, '0')}:${minutes}`;

    return {
      period: p.settlementPeriod,
      time: timeLabel,
      startTime: p.startTime,
      actual: p.actualMW,
      forecast: p.dayAheadForecastMW,
      intraday: p.latestForecastMW,
      error: p.errorMW,
      absError: p.absErrorMW,
      errorPct: p.errorPct,
      publishTime: p.dayAheadPublishTime
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const isDeficit = data.error > 0;

    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '14px 18px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        minWidth: '220px',
        fontSize: '0.8rem',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>
            Period {data.period} ({data.time} UTC)
          </span>
          <span style={{ color: '#00f2fe', fontSize: '0.72rem' }}>
            Click to trace evolution
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              Actual Outturn:
            </span>
            <span className="mono" style={{ fontWeight: 600, color: '#f8fafc' }}>
              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe' }}></span>
              Day-Ahead Forecast:
            </span>
            <span className="mono" style={{ fontWeight: 600, color: '#f8fafc' }}>
              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : 'N/A'}
            </span>
          </div>

          {showIntraday && data.intraday !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></span>
                Latest Intraday:
              </span>
              <span className="mono" style={{ fontWeight: 600, color: '#f8fafc' }}>
                {data.intraday.toLocaleString()} MW
              </span>
            </div>
          )}

          <div style={{ 
            marginTop: '6px', 
            paddingTop: '6px', 
            borderTop: '1px solid rgba(255,255,255,0.06)', 
            display: 'flex', 
            justifyContent: 'space-between' 
          }}>
            <span style={{ color: isDeficit ? '#f43f5e' : '#10b981' }}>
              {isDeficit ? 'Overforecast (Deficit):' : 'Underforecast (Surplus):'}
            </span>
            <span className="mono" style={{ fontWeight: 700, color: isDeficit ? '#f43f5e' : '#10b981' }}>
              {data.error > 0 ? `+${data.error}` : data.error} MW ({data.errorPct}%)
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '24px' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Day-Ahead Wind Forecast vs Actual Generation Curve
            </h2>
            <span className="badge badge-cyan">48 Settlement Periods (30m)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            Comparing Day D-1 frozen forecast (Cutoff: {gateClosureTime} UTC) against outturn generation for {deliveryDate}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowIntraday(!showIntraday)}
            className={`btn btn-outline ${showIntraday ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderColor: showIntraday ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
              color: showIntraday ? '#c4b5fd' : '#94a3b8'
            }}
          >
            <Layers size={14} />
            <span>{showIntraday ? 'Hide Intraday Curve' : 'Overlay Intraday Evolving'}</span>
          </button>

          <button
            onClick={() => setShowErrorBars(!showErrorBars)}
            className={`btn btn-outline ${showErrorBars ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderColor: showErrorBars ? '#f59e0b' : 'rgba(255,255,255,0.1)',
              color: showErrorBars ? '#fcd34d' : '#94a3b8'
            }}
          >
            <Eye size={14} />
            <span>{showErrorBars ? 'Hide Error Bars' : 'Show Error Bars'}</span>
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ width: '100%', height: '420px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload.length) {
                const spData = e.activePayload[0].payload;
                if (onSelectPeriod) onSelectPeriod(spData.startTime, spData.period);
              }
            }}
          >
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              interval={3}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '14px', fontSize: '0.8rem' }}
              iconType="circle"
            />

            {/* Day-Ahead Forecast: Gradient Area + Dashed Line */}
            <Area
              type="monotone"
              dataKey="forecast"
              name="Day-Ahead Forecast (Frozen @ D-1 Cutoff)"
              stroke="#00f2fe"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#forecastFill)"
            />

            {/* Actual Outturn: Solid Emerald Line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Outturn (FUELHH WIND)"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 2.5, fill: '#10b981', strokeWidth: 1 }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            />

            {/* Optional Latest Intraday Evolving Curve */}
            {showIntraday && (
              <Line
                type="monotone"
                dataKey="intraday"
                name="Latest Intraday Forecast (Near Delivery)"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Error Differential Chart */}
      {showErrorBars && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Settlement Period Error Differential (Forecast - Actual MW)
            </span>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
              <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#f43f5e', borderRadius: '2px' }}></span>
                Positive = Wind Overforecast (Deficit Risk)
              </span>
              <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px' }}></span>
                Negative = Wind Underforecast (Surplus Energy)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} interval={5} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" MW" />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <Bar 
                  dataKey="error" 
                  name="Error (MW)" 
                  fill="#f43f5e"
                  shape={(props) => {
                    const { x, y, width, height, value } = props;
                    const fill = value >= 0 ? '#f43f5e' : '#3b82f6';
                    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
