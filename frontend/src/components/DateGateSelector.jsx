import React from 'react';
import { Calendar, Clock, BarChart3, Calculator, Compass, Flame, ArrowRight } from 'lucide-react';

export default function DateGateSelector({
  availableDates,
  selectedDate,
  onSelectDate,
  gateClosureTime,
  onSelectGateClosure,
  activeTab,
  onSelectTab,
  decisionDate,
  cutoffUsed
}) {
  const PRESETS = [
    { label: 'Jan 15 (Typical)', date: '2026-01-15' },
    { label: 'Jan 03 (High Wind Ramp)', date: '2026-01-03' },
    { label: 'Jan 23 (Calm / Low Wind)', date: '2026-01-23' },
    { label: 'Jan 08 (High Error Spike)', date: '2026-01-08' },
  ];

  return (
    <div className="glass-panel" style={{ margin: '0 24px 20px 24px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Date and Gate Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
              <Calendar size={13} color="#00f2fe" />
              Delivery Day (D)
            </label>
            <select 
              value={selectedDate} 
              onChange={(e) => onSelectDate(e.target.value)}
              style={{ fontWeight: 600, minWidth: '150px' }}
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
              <Clock size={13} color="#f59e0b" />
              D-1 Gate Closure Cutoff
            </label>
            <select 
              value={gateClosureTime} 
              onChange={(e) => onSelectGateClosure(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="07:00">07:00 UTC (Early Desk Review)</option>
              <option value="09:30">09:30 UTC (Morning Model Run)</option>
              <option value="11:00">11:00 UTC (EPEX SPOT Auction Gate)</option>
              <option value="12:00">12:00 UTC (Nord Pool GB Gate)</option>
              <option value="15:30">15:30 UTC (Post-Auction Adjustment)</option>
              <option value="18:30">18:30 UTC (Evening Balancing Plan)</option>
            </select>
          </div>

          <div style={{ paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Trading Context
            </span>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Decision on <span className="mono" style={{ color: '#00f2fe', fontWeight: 600 }}>{decisionDate}</span> before <span className="mono" style={{ color: '#f59e0b', fontWeight: 600 }}>{gateClosureTime} UTC</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Quick Scenarios:</span>
            {PRESETS.map((p) => (
              <button
                key={p.date}
                onClick={() => onSelectDate(p.date)}
                className="btn btn-outline"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  backgroundColor: selectedDate === p.date ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: selectedDate === p.date ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  color: selectedDate === p.date ? '#00f2fe' : '#94a3b8'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => onSelectTab('forecast')}
          >
            <BarChart3 size={15} />
            <span>Forecast & Errors</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'procurement' ? 'active' : ''}`}
            onClick={() => onSelectTab('procurement')}
          >
            <Flame size={15} />
            <span>Thermal Procurement</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'diurnal' ? 'active' : ''}`}
            onClick={() => onSelectTab('diurnal')}
          >
            <Compass size={15} />
            <span>Diurnal Risk Profile</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`}
            onClick={() => onSelectTab('month')}
          >
            <Calendar size={15} />
            <span>Month Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
