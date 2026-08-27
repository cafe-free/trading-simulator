'use client';

import React from 'react';
import { Quote } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerTapeProps {
  quotes: Record<string, Quote>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  quotes,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const quoteList = Object.values(quotes);

  if (quoteList.length === 0) return null;

  return (
    <div className="w-full bg-[#0d0d10] border-b border-white/5 text-xs overflow-x-auto no-scrollbar py-1.5 px-4 select-none">
      <div className="flex items-center space-x-4 min-w-max">
        <span className="text-slate-500 font-semibold tracking-widest uppercase text-[10px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          LIVE RADAR
        </span>

        {quoteList.map((q) => {
          const isPositive = q.change >= 0;
          const isSelected = q.symbol === selectedSymbol;

          return (
            <button
              key={q.symbol}
              onClick={() => onSelectSymbol(q.symbol)}
              className={`flex items-center space-x-2 px-2.5 py-1 rounded transition-all ${
                isSelected
                  ? 'bg-[#16161c] text-white font-medium border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-[#16161c]/40 hover:bg-[#16161c] text-slate-300 border border-white/5 hover:border-white/10'
              }`}
            >
              <span className="font-mono font-bold tracking-tight text-white">{q.symbol}</span>
              <span className="font-mono text-slate-300 text-xs">${q.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span
                className={`flex items-center font-mono text-[10px] font-semibold ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {isPositive ? '+' : ''}
                {q.changePercent.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
