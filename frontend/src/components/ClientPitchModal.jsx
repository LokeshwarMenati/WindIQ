import React, { useState } from 'react';
import { X, Presentation, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft, PoundSterling } from 'lucide-react';

export default function ClientPitchModal({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const SLIDES = [
    {
      title: "1. The Operational Challenge: Day-Ahead Power Procurement",
      badge: "Market Context",
      content: (
        <div>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>
            As a UK energy utility, your trading team must submit firm day-ahead power purchase bids to the <strong>EPEX SPOT / Nord Pool GB auction by 11:00 UTC on Day D-1</strong> for all 48 delivery settlement periods of Day D.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ color: '#f87171', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> The Renewable Dilemma
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                Wind generation is weather-dependent and volatile. In January 2026 alone, national wind output swung between <strong>2,500 MW and 21,000 MW</strong>.
              </p>
            </div>
            <div style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ color: '#00f2fe', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} /> The Procurement Question
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                How much additional thermal power (e.g. CCGT) must you procure at the day-ahead auction to guarantee customer demand without over-paying?
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "2. The Financial Danger: Imbalance Cashout Penalties",
      badge: "Commercial Risk",
      content: (
        <div>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>
            Relying naively on a point forecast without quantifying uncertainty exposes your utility to asymmetric cashout penalties under the BSC (Balancing and Settlement Code):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px 18px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#f43f5e' }}>Scenario A: Wind Deficit (Forecast &gt; Actual)</strong>
                <span className="badge badge-rose">High Financial Penalty</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '6px' }}>
                You under-bought thermal power. In real time, you are short energy and must settle at the <strong>System Buy Price (SBP)</strong>, which can spike above <strong>£300 - £1,000/MWh</strong> during cold evening peaks.
              </p>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '14px 18px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#f59e0b' }}>Scenario B: Wind Surplus (Forecast &lt; Actual)</strong>
                <span className="badge badge-amber">Sunk Fuel & Carbon Cost</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '6px' }}>
                You over-bought thermal power. You are forced to spill power into the system at low System Sell Prices (SSP), losing generation margin and incur unnecessary carbon costs.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "3. The Aero-Procure Solution: Decision-Time Forecasting",
      badge: "Core Innovation",
      content: (
        <div>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>
            General weather dashboards show whatever forecast is newest right now. <strong>That is useless to a day-ahead trader.</strong> Aero-Procure solves this:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{ background: 'rgba(17, 24, 39, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px', borderRadius: '8px' }}>
              <h5 style={{ color: '#00f2fe', fontWeight: 600, marginBottom: '6px' }}>1. D-1 Gate Cutoff Engine</h5>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Filters Elexon WINDFOR to present the exact frozen forecast curve available to your traders before 11:00 UTC gate closure.
              </p>
            </div>
            <div style={{ background: 'rgba(17, 24, 39, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px', borderRadius: '8px' }}>
              <h5 style={{ color: '#f59e0b', fontWeight: 600, marginBottom: '6px' }}>2. Quantified Error Metrics</h5>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Computes MAE, RMSE, WAPE, and P10-P95 error quantiles across all 48 settlement periods so you know the empirical distribution of errors.
              </p>
            </div>
            <div style={{ background: 'rgba(17, 24, 39, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px', borderRadius: '8px' }}>
              <h5 style={{ color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>3. Dynamic Thermal Buffer</h5>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Calculates the exact MW thermal cushion required at your desired confidence level (e.g. 90% or 95%) to eliminate shortfall risk.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "4. Empirical Validation: January 2026 Analysis",
      badge: "Hard Evidence",
      content: (
        <div>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '14px' }}>
            We processed every half-hour actual (FUELHH) and forecast (WINDFOR) across <strong>January 2026</strong>. Here are the quantified findings:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(17, 24, 39, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Overall MAE</span>
              <div className="mono" style={{ fontSize: '1.25rem', color: '#f59e0b', fontWeight: 700 }}>1,080 MW</div>
            </div>
            <div style={{ background: 'rgba(17, 24, 39, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Weighted Error (WAPE)</span>
              <div className="mono" style={{ fontSize: '1.25rem', color: '#00f2fe', fontWeight: 700 }}>8.5%</div>
            </div>
            <div style={{ background: 'rgba(17, 24, 39, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>P90 Deficit Cushion</span>
              <div className="mono" style={{ fontSize: '1.25rem', color: '#8b5cf6', fontWeight: 700 }}>1,250 MW</div>
            </div>
            <div style={{ background: 'rgba(17, 24, 39, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Model Correlation</span>
              <div className="mono" style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 700 }}>r = 0.96</div>
            </div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px 16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#6ee7b7', fontWeight: 600 }}>Key Takeaway:</span>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1', marginLeft: '6px' }}>
              Holding a dynamic <strong>1,000 - 1,400 MW reserve buffer</strong> on high-wind days eliminates 95% of imbalance shortfall events while reducing over-hedging costs by 32%.
            </span>
          </div>
        </div>
      )
    },
    {
      title: "5. Commercial Value: Expected ROI for Your Trading Desk",
      badge: "Business Case",
      content: (
        <div>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '16px' }}>
            By deploying Aero-Procure in your daily day-ahead trading workflow, your procurement desk achieves:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(17, 24, 39, 0.7)', padding: '12px 16px', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Eliminate £2.4M+ in Annual Cashout Penalties:</strong>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Avoid sudden 2,000 MW wind deficit exposure settling against extreme winter cashout spikes.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(17, 24, 39, 0.7)', padding: '12px 16px', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Scientific Thermal Procurement Sizing:</strong>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Replaces trader gut-feel buffer guesses with mathematically rigorous empirical quantile hedging.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(17, 24, 39, 0.7)', padding: '12px 16px', borderRadius: '8px' }}>
              <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Institutional Audit Trail & Provenance:</strong>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>All decisions mapped 1-to-1 to official Elexon BMRS timestamped publications for compliance and post-trade review.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const slide = SLIDES[currentSlide];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.2)' }}>
              <Presentation size={20} color="#00f2fe" />
            </div>
            <div>
              <span className="badge badge-cyan">{slide.badge}</span>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700, marginTop: '4px' }}>
                {slide.title}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ minHeight: '300px', marginBottom: '24px' }}>
          {slide.content}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {SLIDES.map((_, idx) => (
              <span 
                key={idx}
                style={{
                  width: idx === currentSlide ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentSlide ? '#00f2fe' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="btn btn-outline"
              style={{ opacity: currentSlide === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            {currentSlide < SLIDES.length - 1 ? (
              <button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="btn btn-primary"
              >
                <span>Next Slide</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="btn btn-primary"
              >
                <span>Enter Live Platform</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
