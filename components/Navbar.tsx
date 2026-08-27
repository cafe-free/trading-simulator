'use client';

import React, { useState, useEffect } from 'react';
import { PortfolioSummary, Quote } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Wallet,
  Sparkles,
  Calculator,
  RefreshCcw,
  SlidersHorizontal,
  Clock,
  CircleDollarSign,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  portfolio: PortfolioSummary;
  selectedQuote: Quote | null;
  onOpenSearch: () => void;
  onOpenAIInsights: () => void;
  onOpenRiskCalc: () => void;
  onOpenSettings: () => void;
  activeView: 'trade' | 'portfolio' | 'analytics';
  setActiveView: (view: 'trade' | 'portfolio' | 'analytics') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portfolio,
  selectedQuote,
  onOpenSearch,
  onOpenAIInsights,
  onOpenRiskCalc,
  onOpenSettings,
  activeView,
  setActiveView,
}) => {
  const [marketStatus, setMarketStatus] = useState<{ status: 'OPEN' | 'CLOSED' | 'PRE' | 'AFTER'; label: string }>({
    status: 'OPEN',
    label: 'Market Open',
  });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      // Convert to NY Time (EST/EDT)
      const nyString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const nyDate = new Date(nyString);
      const day = nyDate.getDay(); // 0 is Sun, 6 is Sat
      const hours = nyDate.getHours();
      const minutes = nyDate.getMinutes();
      const totalMinutes = hours * 60 + minutes;

      if (day === 0 || day === 6) {
        setMarketStatus({ status: 'CLOSED', label: 'Weekend • Crypto 24/7' });
      } else if (totalMinutes >= 570 && totalMinutes < 960) {
        // 9:30 AM to 4:00 PM EST
        setMarketStatus({ status: 'OPEN', label: 'US Regular Session' });
      } else if (totalMinutes >= 240 && totalMinutes < 570) {
        // 4:00 AM to 9:30 AM EST
        setMarketStatus({ status: 'PRE', label: 'Pre-Market' });
      } else {
        setMarketStatus({ status: 'AFTER', label: 'After-Hours' });
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const isDailyPos = portfolio.dailyPnL >= 0;
  const isTotalPos = portfolio.totalPnL >= 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d10] border-b border-white/5 text-slate-100">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand & Active Asset & Navigation */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveView('trade')}>
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded flex items-center justify-center text-black font-bold text-base shadow-[0_0_14px_rgba(16,185,129,0.35)]">
              Δ
            </div>
            <div className="flex items-center">
              <span className="font-bold tracking-tight text-white text-base">QUANTUM<span className="text-emerald-500">TRX</span></span>
            </div>
          </div>

          {/* Active Asset Quick Badge */}
          {selectedQuote && (
            <div className="hidden sm:flex items-center gap-3 bg-[#16161c] px-3 py-1.5 rounded-md border border-white/10">
              <span className="text-white font-medium text-xs font-mono">{selectedQuote.symbol}</span>
              <span className="text-emerald-400 font-mono text-xs font-bold">
                ${selectedQuote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                  selectedQuote.change >= 0
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {selectedQuote.change >= 0 ? '+' : ''}
                {selectedQuote.changePercent.toFixed(2)}%
              </span>
            </div>
          )}

          {/* View Mode Nav */}
          <nav className="hidden xl:flex items-center space-x-1 bg-[#16161c] p-1 rounded-md border border-white/10">
            <button
              onClick={() => setActiveView('trade')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeView === 'trade'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trading Station
            </button>
            <button
              onClick={() => setActiveView('portfolio')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeView === 'portfolio'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Positions & Orders
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeView === 'analytics'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Center: Search Trigger & Market Status */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-3 bg-[#16161c] hover:bg-[#1c1c24] text-slate-300 px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 transition-all text-xs w-40 sm:w-56 justify-between group"
          >
            <span className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-200">
              <Search className="w-3.5 h-3.5" />
              <span>Search markets...</span>
            </span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-slate-400 border border-white/10">
              ⌘K
            </kbd>
          </button>

          {/* Market Status Badge */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#16161c] border border-white/10 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                marketStatus.status === 'OPEN'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : marketStatus.status === 'PRE' || marketStatus.status === 'AFTER'
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300 font-mono text-[10px] uppercase tracking-wider">{marketStatus.label}</span>
          </div>
        </div>

        {/* Right: Portfolio Metrics, AI & Actions */}
        <div className="flex items-center space-x-3">
          {/* AI Insights Button */}
          <button
            onClick={onOpenAIInsights}
            className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-md border border-emerald-500/30 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            title="AI Technical & Market Analysis"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI Analysis</span>
          </button>

          {/* Risk Sizing Tool */}
          <button
            onClick={onOpenRiskCalc}
            className="hidden sm:flex items-center space-x-1.5 bg-[#16161c] hover:bg-[#1c1c24] text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md border border-white/10 text-xs font-medium transition-all"
            title="Position Size & Risk Calculator"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Risk Calc</span>
          </button>

          {/* Account Balance Widget */}
          <div
            onClick={onOpenSettings}
            className="flex items-center space-x-3 bg-[#16161c] hover:bg-[#1c1c24] px-3 py-1.5 rounded-md border border-white/10 cursor-pointer transition-all group"
            title="Click to Deposit / Manage Balance"
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Available Balance</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-xs font-bold text-white">
                  ${portfolio.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`font-mono text-[10px] font-semibold ${
                    isDailyPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isDailyPos ? '+' : ''}
                  {portfolio.dailyPnLPercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
