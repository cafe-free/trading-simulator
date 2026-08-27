'use client';

import React, { useState, useEffect } from 'react';
import { Quote, Candle, TimeRange } from '@/lib/types';
import { Sparkles, X, TrendingUp, TrendingDown, Target, Shield, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AIAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  candles: Candle[];
  timeRange: TimeRange;
}

interface AIAnalysisResult {
  summary: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  support: number;
  resistance: number;
  rsiCondition: string;
  keyFactors: string[];
  tradeIdea: string;
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({
  isOpen,
  onClose,
  quote,
  candles,
  timeRange,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (!isOpen || !quote) return;

    let isMounted = true;
    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/market/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote,
            candles: candles.slice(-20),
            timeframe: timeRange,
          }),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setAnalysis(data);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, [isOpen, quote, candles, timeRange]);

  const handleRefresh = async () => {
    if (!quote) return;
    setLoading(true);
    try {
      const res = await fetch('/api/market/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote,
          candles: candles.slice(-20),
          timeframe: timeRange,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0d0d10] border border-white/10 w-full max-w-xl rounded-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d0d10]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                AI Technical Intelligence
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#16161c] text-slate-300 border border-white/10">
                  {quote.symbol}
                </span>
              </h2>
              <p className="text-[10px] text-slate-500">Deep chart pattern & momentum breakdown</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-[#16161c] transition-colors"
              title="Refresh AI Analysis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-[#16161c] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-medium text-xs text-slate-300">Evaluating technical indicators & order flow...</p>
              <p className="text-[10px] text-slate-500">Synthesizing support/resistance zones and risk-reward targets.</p>
            </div>
          ) : analysis ? (
            <>
              {/* Trend & Summary Box */}
              <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold uppercase tracking-widest text-[10px]">
                    Technical Bias
                  </span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] uppercase flex items-center gap-1 border ${
                      analysis.trend === 'BULLISH'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : analysis.trend === 'BEARISH'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {analysis.trend === 'BULLISH' && <TrendingUp className="w-3 h-3" />}
                    {analysis.trend === 'BEARISH' && <TrendingDown className="w-3 h-3" />}
                    {analysis.trend}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">{analysis.summary}</p>
              </div>

              {/* Support & Resistance Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#16161c] p-3 rounded-md border border-white/10 text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Immediate Support</span>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    ${analysis.support > 0 ? analysis.support.toFixed(2) : (quote.low * 0.985).toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#16161c] p-3 rounded-md border border-white/10 text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Immediate Resistance</span>
                  <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                    ${analysis.resistance > 0 ? analysis.resistance.toFixed(2) : (quote.high * 1.015).toFixed(2)}
                  </div>
                </div>

                <div className="bg-[#16161c] p-3 rounded-md border border-white/10 text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">RSI Condition</span>
                  <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">
                    {analysis.rsiCondition || 'Neutral'}
                  </div>
                </div>
              </div>

              {/* Key Drivers / Catalysts */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Key Market Factors
                </h4>
                <ul className="space-y-1.5">
                  {analysis.keyFactors?.map((factor, idx) => (
                    <li key={idx} className="bg-[#16161c] p-2.5 rounded-md border border-white/5 text-slate-300 text-xs">
                      • {factor}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concrete Trade Setup Thesis */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-md space-y-1">
                <h4 className="font-semibold text-emerald-400 text-xs flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Trade Setup Thesis
                </h4>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">{analysis.tradeIdea}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
