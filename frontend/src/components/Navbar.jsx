import React from 'react';
import { Wind, ShieldCheck, Presentation, Code2, Database, Zap } from 'lucide-react';

export default function Navbar({ onOpenPitch, onOpenTechLead, syncStatus }) {
  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, #00f2fe 0%, #0ea5e9 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)'
        }}>
          <Wind size={24} color="#031120" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800, letterSpacing: '-0.02em' }}>
              AERO-PROCURE
            </h1>
            <span className="badge badge-cyan">UK Day-Ahead Market</span>
            <span className="badge badge-emerald">
              <span className="pulse-dot"></span>
              Live Feed
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Elexon BMRS Wind Forecasting & Thermal Procurement Intelligence Desk
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '6px 12px', 
          background: 'rgba(17, 24, 39, 0.7)', 
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.78rem'
        }}>
          <Database size={14} color="#00f2fe" />
          <span style={{ color: '#94a3b8' }}>BMRS Scope:</span>
          <span className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>Jan 2026 (FUELHH + WINDFOR)</span>
        </div>

        <button 
          onClick={onOpenPitch}
          className="btn btn-outline"
          style={{ borderColor: 'rgba(0, 242, 254, 0.3)', color: '#00f2fe' }}
          title="Open Client Pitch Presentation (Part 1)"
        >
          <Presentation size={16} />
          <span>Client Pitch (Part 1)</span>
        </button>

        <button 
          onClick={onOpenTechLead}
          className="btn btn-outline"
          style={{ borderColor: 'rgba(139, 92, 246, 0.3)', color: '#a78bfa' }}
          title="Open Tech Lead Architecture Review (Part 2)"
        >
          <Code2 size={16} />
          <span>Tech Lead Review (Part 2)</span>
        </button>
      </div>
    </header>
  );
}
