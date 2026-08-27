'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { POPULAR_SYMBOLS } from '@/lib/market-data-service';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectSymbol }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ symbol: string; name: string; type: string }[]>(POPULAR_SYMBOLS);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search query debounce
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setResults(data.results);
          } else {
            setResults([
              { symbol: query.toUpperCase().trim(), name: `${query.toUpperCase()} Asset`, type: 'stock' },
            ]);
          }
        }
      } catch {
        // fallback
        setResults([
          { symbol: query.toUpperCase().trim(), name: `${query.toUpperCase()} Asset`, type: 'stock' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const displayedResults = query.trim() ? results : POPULAR_SYMBOLS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0d0d10] border border-white/10 w-full max-w-lg rounded-md shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <Search className="w-4 h-4 text-emerald-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search symbol or company (e.g. AAPL, NVDA, BTC, SPY)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300 mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-[#16161c] text-slate-500 px-1.5 py-0.5 rounded border border-white/10 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
          {isLoading && (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Searching market data...</span>
            </div>
          )}

          {!isLoading && displayedResults.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              No direct matches found. Enter custom symbol to trade.
            </div>
          )}

          {!isLoading &&
            displayedResults.map((item) => (
              <div
                key={item.symbol}
                onClick={() => {
                  onSelectSymbol(item.symbol);
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded hover:bg-[#16161c] cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                    {item.symbol}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[240px]">{item.name}</span>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#16161c] text-slate-500 border border-white/5">
                  {item.type}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
