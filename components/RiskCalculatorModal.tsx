'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, X, Shield, ArrowRight, Target, AlertCircle } from 'lucide-react';
import { Quote } from '@/lib/types';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashBalance: number;
  selectedQuote: Quote | null;
  onApplyQuantity?: (shares: number) => void;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  cashBalance,
  selectedQuote,
  onApplyQuantity,
}) => {
  if (!isOpen) return null;

  return (
    <RiskCalculatorModalContent
      onClose={onClose}
      cashBalance={cashBalance}
      selectedQuote={selectedQuote}
      onApplyQuantity={onApplyQuantity}
    />
  );
};

interface ContentProps {
  onClose: () => void;
  cashBalance: number;
  selectedQuote: Quote | null;
  onApplyQuantity?: (shares: number) => void;
}

const RiskCalculatorModalContent: React.FC<ContentProps> = ({
  onClose,
  cashBalance,
  selectedQuote,
  onApplyQuantity,
}) => {
  const currentPrice = selectedQuote ? selectedQuote.price : 100;

  const [accountSize, setAccountSize] = useState<string>(cashBalance.toString());
  const [riskPercent, setRiskPercent] = useState<string>('2');
  const [entryPrice, setEntryPrice] = useState<string>(currentPrice.toFixed(2));
  const [stopLossPrice, setStopLossPrice] = useState<string>((currentPrice * 0.96).toFixed(2));
  const [targetPrice, setTargetPrice] = useState<string>((currentPrice * 1.08).toFixed(2));

  // Calculations
  const results = useMemo(() => {
    const acc = parseFloat(accountSize) || cashBalance;
    const rPct = parseFloat(riskPercent) || 2;
    const entry = parseFloat(entryPrice) || 1;
    const sl = parseFloat(stopLossPrice) || entry * 0.95;
    const tp = parseFloat(targetPrice) || entry * 1.1;

    const maxRiskDollars = (acc * rPct) / 100;
    const riskPerShare = Math.abs(entry - sl);
    const rewardPerShare = Math.abs(tp - entry);

    const recommendedShares = riskPerShare > 0 ? Math.floor(maxRiskDollars / riskPerShare) : 0;
    const totalCapitalRequired = recommendedShares * entry;
    const potentialGain = recommendedShares * rewardPerShare;
    const riskRewardRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(2) : '0';

    return {
      maxRiskDollars,
      riskPerShare,
      recommendedShares,
      totalCapitalRequired,
      potentialGain,
      riskRewardRatio,
      isOverLeveraged: totalCapitalRequired > acc,
    };
  }, [accountSize, riskPercent, entryPrice, stopLossPrice, targetPrice, cashBalance]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0d0d10] border border-white/10 w-full max-w-lg rounded-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d0d10]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wider text-white">Position Size & Risk Calculator</h2>
              <p className="text-[10px] text-slate-500">Fixed-fractional capital allocation model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white hover:bg-[#16161c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-semibold mb-1">Portfolio Cash ($)</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="w-full bg-[#16161c] border border-white/10 text-white rounded-md px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-semibold mb-1">Max Risk per Trade (%)</label>
              <div className="grid grid-cols-4 gap-1">
                {['1', '2', '3', '5'].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRiskPercent(pct)}
                    className={`py-1.5 rounded font-mono text-xs font-semibold transition-all border ${
                      riskPercent === pct
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold'
                        : 'bg-[#16161c] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase tracking-widest font-semibold mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[#16161c] border border-white/10 text-white rounded-md px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-rose-400 text-[10px] uppercase tracking-widest font-semibold mb-1">Stop Loss ($)</label>
              <input
                type="number"
                step="0.01"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="w-full bg-[#16161c] border border-white/10 text-white rounded-md px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-rose-500/50"
              />
            </div>
            <div>
              <label className="block text-emerald-400 text-[10px] uppercase tracking-widest font-semibold mb-1">Target Profit ($)</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-[#16161c] border border-white/10 text-white rounded-md px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Sizing Output Box */}
          <div className="bg-[#16161c] p-4 rounded-md border border-white/10 space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-slate-400 font-sans text-xs">Recommended Position Size:</span>
              <span className="text-sm font-bold text-emerald-400">
                {results.recommendedShares.toLocaleString()} Shares
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex justify-between text-slate-500">
                <span>Max Risk:</span>
                <span className="text-rose-400 font-bold">${results.maxRiskDollars.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Risk/Reward:</span>
                <span className="text-emerald-400 font-bold">1 : {results.riskRewardRatio}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Capital Cost:</span>
                <span className="text-slate-200 font-bold">${results.totalCapitalRequired.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Target Gain:</span>
                <span className="text-emerald-400 font-bold">+${results.potentialGain.toFixed(2)}</span>
              </div>
            </div>

            {results.isOverLeveraged && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-[10px] flex items-center gap-1.5 font-sans">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Requires more capital than currently in cash. Scale down or use smaller % risk.</span>
              </div>
            )}
          </div>

          {onApplyQuantity && (
            <button
              type="button"
              onClick={() => {
                onApplyQuantity(results.recommendedShares);
                onClose();
              }}
              className="w-full py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              Apply {results.recommendedShares} Shares to Order Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
