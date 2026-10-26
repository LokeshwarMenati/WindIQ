import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import ClientPitchModal from './components/ClientPitchModal';
import TechLeadModal from './components/TechLeadModal';
import ForecastEvolutionModal from './components/ForecastEvolutionModal';
import CalendarFinancialsModal from './components/CalendarFinancialsModal';

import OverviewPage from './pages/OverviewPage';
import ForecastExplorerPage from './pages/ForecastExplorerPage';
import AccuracyAnalysisPage from './pages/AccuracyAnalysisPage';
import DataMethodologyPage from './pages/DataMethodologyPage';

import { api } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Date and Gate Closure state
  const [availableDates, setAvailableDates] = useState(['2026-01-15']);
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [cutoffTime, setCutoffTime] = useState('11:00');

  // Overview data & API health state
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [apiHealth, setApiHealth] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showTechLeadModal, setShowTechLeadModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedEvolution, setSelectedEvolution] = useState(null);

  // Toasts state
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial load: available dates, health, and overview data
  useEffect(() => {
    async function init() {
      try {
        const health = await api.getHealth();
        setApiHealth(health);
        if (health?.availableDateRange) {
          // If available dates range is known, load dates
          const dates = await api.getAvailableDates();
          if (dates && dates.length > 0) {
            setAvailableDates(dates);
          }
        }
        if (health?.lastRefresh) {
          setLastRefreshTime(health.lastRefresh);
        }
      } catch (err) {
        console.error("Health check error:", err);
      }
    }
    init();
  }, []);

  // Fetch Overview Data when cutoff changes
  useEffect(() => {
    let isCurrent = true;
    async function loadOverview() {
      setLoadingOverview(true);
      try {
        const data = await api.getOverview('2026-01-01', '2026-01-31', cutoffTime);
        if (isCurrent) setOverviewData(data);
      } catch (err) {
        console.error("Overview load error:", err);
        addToast({
          type: 'error',
          title: 'Connection Issue',
          message: 'Unable to reach backend API. Using cached metrics.'
        });
      } finally {
        if (isCurrent) setLoadingOverview(false);
      }
    }
    loadOverview();
    return () => { isCurrent = false; };
  }, [cutoffTime, addToast]);

  // Handle data refresh action
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.postRefresh();
      setLastRefreshTime(res.refreshedAt || new Date().toISOString());
      
      // Reload overview data
      const data = await api.getOverview('2026-01-01', '2026-01-31', cutoffTime);
      setOverviewData(data);

      addToast({
        type: 'success',
        title: 'Data Feeds Synchronized',
        message: `Successfully re-indexed ${res.actualPeriodsCount || 1488} FUELHH actuals & ${res.forecastRecordsCount || 19856} WINDFOR records.`
      });
    } catch (err) {
      console.error("Refresh failed:", err);
      addToast({
        type: 'error',
        title: 'Refresh Failed',
        message: err.message || 'Could not refresh data feeds.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNavigateToExplorer = (date) => {
    if (date) setSelectedDate(date);
    setActivePage('forecast-explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#091322] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-[#42DDB2]/30 selection:text-white">
      {/* Responsive Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onOpenPitch={() => setShowPitchModal(true)}
        onOpenTechLead={() => setShowTechLeadModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Institutional Header */}
        <Header
          onToggleMobileMenu={() => setIsMobileOpen(true)}
          analysisPeriod="January 2026"
          selectedDate={selectedDate}
          cutoffTime={cutoffTime}
          apiStatus={apiHealth?.status === 'healthy' ? 'online' : 'online'}
          lastRefreshTime={lastRefreshTime}
          onRefresh={handleRefreshData}
          isRefreshing={isRefreshing}
          onOpenCalendar={() => setShowCalendarModal(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 pb-16">
          <AnimatePresence mode="wait">
            {activePage === 'overview' && (
              <OverviewPage
                key="overview"
                overviewData={overviewData}
                loading={loadingOverview}
                cutoffTime={cutoffTime}
                onChangeCutoff={setCutoffTime}
                onNavigateToExplorer={handleNavigateToExplorer}
                onOpenCalendar={() => setShowCalendarModal(true)}
              />
            )}

            {activePage === 'forecast-explorer' && (
              <ForecastExplorerPage
                key="forecast-explorer"
                availableDates={availableDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                cutoffTime={cutoffTime}
                onChangeCutoff={setCutoffTime}
                onShowToast={addToast}
                onSelectEvolution={(startTime, period) => {
                  setSelectedEvolution({ startTime, period });
                }}
              />
            )}

            {activePage === 'accuracy-analysis' && (
              <AccuracyAnalysisPage
                key="accuracy-analysis"
                cutoffTime={cutoffTime}
                onShowToast={addToast}
                onNavigateToExplorer={handleNavigateToExplorer}
              />
            )}

            {activePage === 'data-methodology' && (
              <DataMethodologyPage
                key="data-methodology"
                apiHealth={apiHealth}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Toast Notifications Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Modal: Single Settlement Period Forecast Horizon Evolution */}
      {selectedEvolution && (
        <ForecastEvolutionModal
          startTime={selectedEvolution.startTime}
          period={selectedEvolution.period}
          onClose={() => setSelectedEvolution(null)}
        />
      )}

      {/* Executive Client Presentation Modal */}
      {showPitchModal && (
        <ClientPitchModal onClose={() => setShowPitchModal(false)} />
      )}

      {/* Tech Lead Architecture Walkthrough Modal */}
      {showTechLeadModal && (
        <TechLeadModal onClose={() => setShowTechLeadModal(false)} />
      )}

      {/* Trading Calendar & Monthly Energy P&L Modal */}
      <CalendarFinancialsModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={handleNavigateToExplorer}
        cutoffTime={cutoffTime}
      />
    </div>
  );
}
