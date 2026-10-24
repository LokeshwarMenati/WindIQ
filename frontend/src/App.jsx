import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DateGateSelector from './components/DateGateSelector';
import SummaryCards from './components/SummaryCards';
import ForecastChart from './components/ForecastChart';
import ProcurementCalculator from './components/ProcurementCalculator';
import DiurnalChart from './components/DiurnalChart';
import MonthlyOverviewView from './components/MonthlyOverviewView';
import ForecastEvolutionModal from './components/ForecastEvolutionModal';
import ClientPitchModal from './components/ClientPitchModal';
import TechLeadModal from './components/TechLeadModal';
import { api } from './services/api';
import { Database, ShieldCheck, ExternalLink } from 'lucide-react';

export default function App() {
  const [availableDates, setAvailableDates] = useState(['2026-01-15']);
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [gateClosureTime, setGateClosureTime] = useState('11:00');
  const [activeTab, setActiveTab] = useState('forecast');
  const [forecastData, setForecastData] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [selectedEvolution, setSelectedEvolution] = useState(null);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showTechLeadModal, setShowTechLeadModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // Load available dates and sync status on mount
  useEffect(() => {
    async function init() {
      try {
        const dates = await api.getAvailableDates();
        if (dates && dates.length > 0) {
          setAvailableDates(dates);
          if (!dates.includes(selectedDate)) {
            setSelectedDate(dates[0]);
          }
        }
        const sync = await api.getSyncStatus();
        setSyncStatus(sync);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  // Fetch Day-Ahead forecast curve whenever date or gate closure time changes
  useEffect(() => {
    let isMounted = true;
    async function loadForecast() {
      setLoadingForecast(true);
      try {
        const data = await api.getDayAheadForecast(selectedDate, gateClosureTime);
        if (isMounted) setForecastData(data);
      } catch (err) {
        console.error("Error loading day-ahead forecast:", err);
      } finally {
        if (isMounted) setLoadingForecast(false);
      }
    }
    loadForecast();
    return () => { isMounted = false; };
  }, [selectedDate, gateClosureTime]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Institutional Top Navbar */}
      <Navbar 
        onOpenPitch={() => setShowPitchModal(true)}
        onOpenTechLead={() => setShowTechLeadModal(true)}
        syncStatus={syncStatus}
      />

      {/* Date & Gate Closure Selector + Tab Navigation */}
      <DateGateSelector
        availableDates={availableDates}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
        gateClosureTime={gateClosureTime}
        onSelectGateClosure={(gc) => setGateClosureTime(gc)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        decisionDate={forecastData?.decisionDate || '2026-01-14'}
        cutoffUsed={forecastData?.actualCutoffUsed || ''}
      />

      {/* High-Level Metric & Risk Cards */}
      <SummaryCards
        metrics={forecastData?.metrics}
        points={forecastData?.halfHourlyData || []}
        selectedDate={selectedDate}
      />

      {/* Active Tab View */}
      <main style={{ flex: 1 }}>
        {activeTab === 'forecast' && (
          <ForecastChart
            points={forecastData?.halfHourlyData || []}
            deliveryDate={selectedDate}
            gateClosureTime={gateClosureTime}
            onSelectPeriod={(st, sp) => setSelectedEvolution({ startTime: st, period: sp })}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementCalculator
            deliveryDate={selectedDate}
            gateClosureTime={gateClosureTime}
          />
        )}

        {activeTab === 'diurnal' && (
          <DiurnalChart
            gateClosureTime={gateClosureTime}
          />
        )}

        {activeTab === 'month' && (
          <MonthlyOverviewView
            gateClosureTime={gateClosureTime}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setActiveTab('forecast');
            }}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer style={{
        margin: '24px',
        padding: '20px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '0.8rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={15} color="#00f2fe" />
          <span>Data Sources: <strong>Elexon Insights Solution (BMRS)</strong> — Datasets: <code>FUELHH (WIND)</code> &amp; <code>WINDFOR</code></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Trading Period: <strong>January 2026</strong></span>
          <span>•</span>
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Production Certified
          </span>
        </div>
      </footer>

      {/* Modal: Single Settlement Period Horizon Evolution */}
      {selectedEvolution && (
        <ForecastEvolutionModal
          startTime={selectedEvolution.startTime}
          period={selectedEvolution.period}
          onClose={() => setSelectedEvolution(null)}
        />
      )}

      {/* Modal: Client Pitch Presentation (Part 1 Deliverable) */}
      {showPitchModal && (
        <ClientPitchModal
          onClose={() => setShowPitchModal(false)}
        />
      )}

      {/* Modal: Tech Lead Architecture Walkthrough (Part 2 Deliverable) */}
      {showTechLeadModal && (
        <TechLeadModal
          onClose={() => setShowTechLeadModal(false)}
        />
      )}
    </div>
  );
}
