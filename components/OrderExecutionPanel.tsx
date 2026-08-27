'use client';

import React, { useState, useMemo } from 'react';
import { Quote, OrderSide, OrderType, Position } from '@/lib/types';
import {
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Percent,
  CheckCircle2,
  DollarSign,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface OrderExecutionPanelProps {
  quote: Quote;
  cashBalance: number;
  activePosition?: Position;
  onExecuteOrder: (
    symbol: string,
    name: string,
    side: OrderSide,
    type: OrderType,
    shares: number,
    currentPrice: number,
    options?: {
      limitPrice?: number;
      stopPrice?: number;
      takeProfitPrice?: number;
      stopLossPrice?: number;
    }
  ) => { success: boolean; message: string };
}

export const OrderExecutionPanel: React.FC<OrderExecutionPanelProps> = ({
  quote,
  cashBalance,
  activePosition,
  onExecuteOrder,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [inputMode, setInputMode] = useState<'SHARES' | 'DOLLARS'>('SHARES');
  const [sharesInput, setSharesInput] = useState<string>('10');
  const [dollarsInput, setDollarsInput] = useState<string>('');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');
  const [enableBracket, setEnableBracket] = useState<boolean>(false);
  const [stopLossPercent, setStopLossPercent] = useState<string>('5');
  const [takeProfitPercent, setTakeProfitPercent] = useState<string>('10');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPrice = quote.price;
  const effectiveLimitPrice = limitPriceInput !== '' ? limitPriceInput : currentPrice.toFixed(2);

  // Compute calculated shares
  const parsedShares = useMemo(() => {
    if (inputMode === 'DOLLARS') {
      const d = parseFloat(dollarsInput);
      if (isNaN(d) || d <= 0 || currentPrice <= 0) return 0;
      return Number((d / currentPrice).toFixed(4));
    } else {
      const s = parseFloat(sharesInput);
      return isNaN(s) || s <= 0 ? 0 : s;
    }
  }, [inputMode, dollarsInput, sharesInput, currentPrice]);

  const executionPrice = orderType === 'LIMIT' ? parseFloat(effectiveLimitPrice) || currentPrice : currentPrice;
  const estimatedTotal = Number((parsedShares * executionPrice).toFixed(2));

  // Stop Loss and Take Profit prices
  const calculatedStopLoss = useMemo(() => {
    if (!enableBracket) return undefined;
    const slPct = parseFloat(stopLossPercent);
    if (isNaN(slPct) || slPct <= 0) return undefined;
    return side === 'BUY'
      ? Number((executionPrice * (1 - slPct / 100)).toFixed(2))
      : Number((executionPrice * (1 + slPct / 100)).toFixed(2));
  }, [enableBracket, stopLossPercent, executionPrice, side]);

  const calculatedTakeProfit = useMemo(() => {
    if (!enableBracket) return undefined;
    const tpPct = parseFloat(takeProfitPercent);
    if (isNaN(tpPct) || tpPct <= 0) return undefined;
    return side === 'BUY'
      ? Number((executionPrice * (1 + tpPct / 100)).toFixed(2))
      : Number((executionPrice * (1 - tpPct / 100)).toFixed(2));
  }, [enableBracket, takeProfitPercent, executionPrice, side]);

  // Max shares user can buy
  const maxBuyShares = useMemo(() => {
    if (currentPrice <= 0) return 0;
    return Math.floor(cashBalance / currentPrice);
  }, [cashBalance, currentPrice]);

  // Percentage chips handler
  const handlePercentageSelect = (pct: number) => {
    if (side === 'BUY' || side === 'SHORT') {
      const targetCash = (cashBalance * pct) / 100;
      if (inputMode === 'DOLLARS') {
        setDollarsInput(targetCash.toFixed(2));
      } else {
        const calculatedQty = Math.floor(targetCash / currentPrice);
        setSharesInput(calculatedQty.toString());
      }
    } else if (side === 'SELL' && activePosition && activePosition.side === 'LONG') {
      const qty = Math.floor((activePosition.shares * pct) / 100);
      setSharesInput(qty.toString());
    } else if (side === 'COVER' && activePosition && activePosition.side === 'SHORT') {
      const qty = Math.floor((activePosition.shares * pct) / 100);
      setSharesInput(qty.toString());
    }
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (parsedShares <= 0) {
      setErrorMsg('Please enter a valid order quantity.');
      return;
    }

    const res = onExecuteOrder(
      quote.symbol,
      quote.name,
      side,
      orderType,
      parsedShares,
      currentPrice,
      {
        limitPrice: orderType === 'LIMIT' ? parseFloat(effectiveLimitPrice) : undefined,
        stopLossPrice: calculatedStopLoss,
        takeProfitPrice: calculatedTakeProfit,
      }
    );

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setErrorMsg(null);
    }
  };

  const isBuyLike = side === 'BUY' || side === 'COVER';

  return (
    <div className="bg-[#0d0d10] border border-white/5 rounded-md p-4 shadow-2xl flex flex-col justify-between">
      <div>
        {/* Side Selector Tabs (Buy, Sell, Short, Cover) */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`py-2 rounded text-xs font-mono uppercase font-bold transition-all border ${
              side === 'BUY'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-[#16161c] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`py-2 rounded text-xs font-mono uppercase font-bold transition-all border ${
              side === 'SELL'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'bg-[#16161c] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            SELL
          </button>
          <button
            type="button"
            onClick={() => setSide('SHORT')}
            className={`py-2 rounded text-xs font-mono uppercase font-bold transition-all border ${
              side === 'SHORT'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-[#16161c] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            SHORT
          </button>
          <button
            type="button"
            onClick={() => setSide('COVER')}
            className={`py-2 rounded text-xs font-mono uppercase font-bold transition-all border ${
              side === 'COVER'
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                : 'bg-[#16161c] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            COVER
          </button>
        </div>

        {/* Order Type & Input Mode Row */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          <div>
            <label className="block text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-1">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              className="w-full bg-[#16161c] border border-white/10 text-slate-100 rounded-md px-3 py-1.5 font-medium focus:outline-none focus:border-emerald-500/50"
            >
              <option value="MARKET">Market (Instant)</option>
              <option value="LIMIT">Limit Order</option>
              <option value="STOP_LOSS">Stop Loss</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-1">Quantity Mode</label>
            <div className="grid grid-cols-2 bg-[#16161c] p-0.5 rounded-md border border-white/10">
              <button
                type="button"
                onClick={() => setInputMode('SHARES')}
                className={`py-1 rounded text-xs font-semibold text-center transition-all ${
                  inputMode === 'SHARES' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                Shares
              </button>
              <button
                type="button"
                onClick={() => setInputMode('DOLLARS')}
                className={`py-1 rounded text-xs font-semibold text-center transition-all ${
                  inputMode === 'DOLLARS' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>

        {/* Limit Price Input if Limit Order */}
        {orderType === 'LIMIT' && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
              <span className="text-slate-500 text-[10px] uppercase tracking-widest">Limit Execution Price</span>
              <span className="text-slate-500 font-mono text-[10px]">Market: ${quote.price.toFixed(2)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">$</span>
              <input
                type="number"
                step="0.01"
                value={limitPriceInput}
                onChange={(e) => setLimitPriceInput(e.target.value)}
                className="w-full bg-[#16161c] border border-white/10 text-white font-mono rounded-md pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Share / Amount Input */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
            <span className="text-slate-500 text-[10px] uppercase tracking-widest">{inputMode === 'SHARES' ? 'Number of Shares' : 'Amount to Invest'}</span>
            <span className="text-slate-500 font-mono text-[10px]">
              {side === 'BUY'
                ? `Max: ${maxBuyShares}`
                : activePosition
                ? `Hold: ${activePosition.shares}`
                : 'No pos'}
            </span>
          </div>

          <div className="relative">
            {inputMode === 'DOLLARS' && <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">$</span>}
            <input
              type="number"
              step={quote.assetType === 'crypto' ? '0.0001' : '1'}
              min="0"
              value={inputMode === 'SHARES' ? sharesInput : dollarsInput}
              onChange={(e) => {
                if (inputMode === 'SHARES') setSharesInput(e.target.value);
                else setDollarsInput(e.target.value);
              }}
              className={`w-full bg-[#16161c] border border-white/10 text-white font-mono rounded-md ${
                inputMode === 'DOLLARS' ? 'pl-7' : 'pl-3'
              } pr-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500/50`}
              placeholder="0"
            />
          </div>
        </div>

        {/* Percentage Quick Selection Chips */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentageSelect(pct)}
              className="py-1 rounded bg-[#16161c] hover:bg-[#202028] border border-white/10 text-slate-400 hover:text-white text-[10px] font-mono font-semibold transition-colors"
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Bracket Orders Toggle (Auto Stop-Loss & Take-Profit) */}
        <div className="bg-[#16161c] p-2.5 rounded-md border border-white/10 mb-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableBracket}
                onChange={(e) => setEnableBracket(e.target.checked)}
                className="rounded bg-[#0d0d10] border-white/10 text-emerald-500 focus:ring-0"
              />
              <span className="text-[11px]">Bracket Order (TP / SL)</span>
            </label>
            <span className="text-[9px] text-slate-500 font-mono uppercase">Auto Sizing</span>
          </div>

          {enableBracket && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-xs">
              <div>
                <label className="block text-[10px] text-emerald-400 font-semibold mb-0.5">Take Profit (+%)</label>
                <input
                  type="number"
                  value={takeProfitPercent}
                  onChange={(e) => setTakeProfitPercent(e.target.value)}
                  className="w-full bg-[#0d0d10] border border-white/10 text-white rounded px-2 py-1 font-mono text-xs"
                />
                {calculatedTakeProfit && (
                  <span className="text-[9px] text-slate-500 font-mono">@ ${calculatedTakeProfit}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-rose-400 font-semibold mb-0.5">Stop Loss (-%)</label>
                <input
                  type="number"
                  value={stopLossPercent}
                  onChange={(e) => setStopLossPercent(e.target.value)}
                  className="w-full bg-[#0d0d10] border border-white/10 text-white rounded px-2 py-1 font-mono text-xs"
                />
                {calculatedStopLoss && (
                  <span className="text-[9px] text-slate-500 font-mono">@ ${calculatedStopLoss}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cost Summary Breakdown */}
        <div className="space-y-1 text-xs font-mono py-2 border-t border-white/5 text-slate-500">
          <div className="flex justify-between">
            <span>Est. Shares:</span>
            <span className="text-slate-200 font-bold">{parsedShares.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Execution Price:</span>
            <span className="text-slate-200">${executionPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Commission:</span>
            <span className="text-emerald-400 font-bold">$0.00 (Zero Fee)</span>
          </div>
          <div className="flex justify-between text-sm pt-1 border-t border-white/5">
            <span className="font-sans font-semibold text-slate-300 text-xs">Estimated Total:</span>
            <span className="text-white font-bold">${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-2 p-2 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Primary Submit Button */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <button
          type="button"
          onClick={handleOrderSubmit}
          className={`w-full py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
            side === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : side === 'SELL'
              ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              : side === 'SHORT'
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
          }`}
        >
          {side === 'BUY' && <ArrowUpRight className="w-4 h-4" />}
          {side === 'SELL' && <ArrowDownRight className="w-4 h-4" />}
          <span>
            {side} {parsedShares > 0 ? `${parsedShares} ${quote.symbol}` : quote.symbol}
          </span>
        </button>

        <div className="flex justify-between text-[10px] text-slate-500 mt-2">
          <span>Available Cash:</span>
          <span className="font-mono text-slate-300 font-semibold">
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
