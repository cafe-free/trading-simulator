'use client';

import React, { useState, useMemo } from 'react';
import { Quote } from '@/lib/types';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
} from 'lucide-react';

interface WatchlistSidebarProps {
  quotes: Record<string, Quote>;
  watchlistSymbols: string[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onToggleWatchlist: (symbol: string) => void;
  onOpenSearch: () => void;
}

type TabType = 'watchlist' | 'gainers' | 'losers' | 'active';

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  quotes,
  watchlistSymbols,
  selectedSymbol,
  onSelectSymbol,
  onToggleWatchlist,
  onOpenSearch,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('watchlist');
  const [filterText, setFilterText] = useState('');

  const quoteList = useMemo(() => Object.values(quotes), [quotes]);

  // Tab Filtering logic
  const displayedQuotes = useMemo(() => {
    let list: Quote[] = [];

    if (activeTab === 'watchlist') {
      list = quoteList.filter((q) => watchlistSymbols.includes(q.symbol));
      // If empty, show first few
      if (list.length === 0) list = quoteList.slice(0, 8);
    } else if (activeTab === 'gainers') {
      list = [...quoteList].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
    } else if (activeTab === 'losers') {
      list = [...quoteList].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
    } else if (activeTab === 'active') {
      list = [...quoteList].sort((a, b) => b.volume - a.volume).slice(0, 10);
    }

    if (filterText.trim()) {
      const q = filterText.toUpperCase().trim();
      return list.filter((item) => item.symbol.includes(q) || item.name.toUpperCase().includes(q));
    }

    return list;
  }, [quoteList, watchlistSymbols, activeTab, filterText]);

  return (
    <div className="bg-[#0d0d10] border border-white/5 rounded-md p-4 shadow-2xl flex flex-col h-full max-h-[850px]">
      {/* Header & Tabs */}
      <div className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Market Radar</h3>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#16161c] text-emerald-400 border border-white/5">
              {displayedQuotes.length}
            </span>
          </div>
          <button
            onClick={onOpenSearch}
            className="p-1 rounded bg-[#16161c] hover:bg-[#202028] text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Search and add symbol"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-4 gap-1 bg-[#16161c] p-1 rounded-md border border-white/10 text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'watchlist'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Starred
          </button>
          <button
            onClick={() => setActiveTab('gainers')}
            className={`py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'gainers'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gainers
          </button>
          <button
            onClick={() => setActiveTab('losers')}
            className={`py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'losers'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Losers
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'active'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active
          </button>
        </div>
      </div>

      {/* Quick Search in list */}
      <div className="py-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter radar..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-[#16161c] border border-white/10 text-slate-200 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Quote List with Mini Sparklines */}
      <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 no-scrollbar">
        {displayedQuotes.map((q) => {
          const isSelected = q.symbol === selectedSymbol;
          const isPositive = q.change >= 0;
          const isStarred = watchlistSymbols.includes(q.symbol);

          // Simple Sparkline SVG
          const sparklineData = q.sparkline || [q.previousClose, q.open, q.low, q.high, q.price];
          const minVal = Math.min(...sparklineData);
          const maxVal = Math.max(...sparklineData);
          const range = maxVal - minVal || 1;
          const sparklinePoints = sparklineData
            .map((val, idx) => {
              const x = (idx / (sparklineData.length - 1)) * 48;
              const y = 20 - ((val - minVal) / range) * 16;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <div
              key={q.symbol}
              onClick={() => onSelectSymbol(q.symbol)}
              className={`flex items-center justify-between p-2.5 rounded-md border transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-[#16161c] border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                  : 'bg-[#16161c]/40 hover:bg-[#16161c] border-white/5 hover:border-white/10'
              }`}
            >
              {/* Star + Symbol info */}
              <div className="flex items-center space-x-2.5 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(q.symbol);
                  }}
                  className="text-slate-600 hover:text-amber-400 transition-colors p-0.5"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-xs text-white tracking-tight">{q.symbol}</span>
                    <span className="text-[8px] uppercase px-1 rounded bg-[#0d0d10] text-slate-400 font-mono border border-white/5">
                      {q.assetType === 'crypto' ? 'CRYPTO' : q.assetType === 'etf' ? 'ETF' : 'STOCK'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate max-w-[90px]">{q.name}</p>
                </div>
              </div>

              {/* Mini Sparkline */}
              <div className="hidden sm:block px-1">
                <svg width="48" height="24" className="overflow-visible">
                  <polyline
                    fill="none"
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={sparklinePoints}
                  />
                </svg>
              </div>

              {/* Price & Change % */}
              <div className="text-right">
                <div className="font-mono text-xs font-bold text-white">
                  ${q.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div
                  className={`font-mono text-[10px] font-semibold flex items-center justify-end ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {q.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
