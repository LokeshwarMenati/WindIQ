import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Compass, 
  BarChart3, 
  BookOpen, 
  Wind,
  ShieldCheck,
  Zap,
  Menu,
  X,
  SlidersHorizontal,
  FileCode2,
  Presentation
} from 'lucide-react';

export default function Sidebar({ 
  activePage, 
  onSelectPage, 
  isMobileOpen, 
  setIsMobileOpen,
  onOpenPitch,
  onOpenTechLead
}) {
  const navItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: LayoutDashboard,
      description: 'Executive KPIs & national profile'
    },
    {
      id: 'forecast-explorer',
      name: 'Forecast Explorer',
      icon: Compass,
      description: 'Half-hourly vintages & delivery records'
    },
    {
      id: 'accuracy-analysis',
      name: 'Accuracy Analysis',
      icon: BarChart3,
      description: 'Error metrics, scatter & SP heatmap'
    },
    {
      id: 'data-methodology',
      name: 'Data & Methodology',
      icon: BookOpen,
      description: 'Elexon datasets & metric formulas'
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d1b2a] border-r border-slate-800/80 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#42DDB2] to-[#78A8FF] p-0.5 shadow-lg shadow-[#42DDB2]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#091322] rounded-[10px] flex items-center justify-center">
              <Wind className="w-5 h-5 text-[#42DDB2]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white font-sans">Wind<span className="text-[#42DDB2]">IQ</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#42DDB2]/15 text-[#42DDB2] border border-[#42DDB2]/30">
                UK Day-Ahead
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">BMRS Forecast Intelligence</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          Platform Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectPage(item.id);
                if (setIsMobileOpen) setIsMobileOpen(false);
              }}
              className={`w-full group flex items-start gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 text-left relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#122337] to-[#122337]/90 text-white font-medium shadow-md shadow-black/20 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#122337]/40'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-[#42DDB2] to-[#78A8FF] rounded-r-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#42DDB2]/15 text-[#42DDB2]' 
                  : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/60'
              }`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className={`text-sm ${isActive ? 'text-white font-semibold' : 'text-slate-300'}`}>
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}

        {/* Stakeholder Walkthrough Modals */}
        <div className="pt-6 px-3 pb-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          Executive &amp; Technical
        </div>
        <button
          onClick={onOpenPitch}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs text-slate-300 hover:text-[#42DDB2] hover:bg-[#122337]/50 border border-transparent hover:border-slate-800 transition-colors"
        >
          <Presentation size={16} className="text-[#42DDB2]" />
          <span>Client Pitch Deck (Part 1)</span>
        </button>
        <button
          onClick={onOpenTechLead}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs text-slate-300 hover:text-[#78A8FF] hover:bg-[#122337]/50 border border-transparent hover:border-slate-800 transition-colors"
        >
          <FileCode2 size={16} className="text-[#78A8FF]" />
          <span>Tech Lead Walkthrough (Part 2)</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-[#091322]/80">
        <div className="p-3 rounded-xl bg-[#122337]/70 border border-slate-800/70 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 text-[11px]">Wholesale Market</span>
            <span className="text-[10px] font-mono text-[#78A8FF] font-semibold">EPEX / N2EX</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <Zap size={13} className="text-[#42DDB2]" />
            <span>Auction Gate: <strong>11:00 UTC</strong></span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-emerald-400">
            <ShieldCheck size={12} />
            <span>Real Elexon Data • Jan 2026</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-72 max-w-[85vw] h-full z-10"
          >
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  );
}
