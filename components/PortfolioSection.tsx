'use client';

import React, { useState } from 'react';
import { Position, Order, TradeRecord, PortfolioSummary } from '@/lib/types';
import {
  Briefcase,
  Clock,
  History,
  TrendingUp,
  TrendingDown,
  XCircle,
  Download,
  Percent,
  Award,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioSectionProps {
  portfolio: PortfolioSummary;
  positions: Position[];
  orders: Order[];
  trades: TradeRecord[];
  onClosePosition: (symbol: string) => void;
  onCancelOrder: (orderId: string) => void;
  onSelectSymbol: (symbol: string) => void;
}

type PortfolioTab = 'positions' | 'orders' | 'history' | 'analytics';

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  portfolio,
  positions,
  orders,
  trades,
  onClosePosition,
  onCancelOrder,
  onSelectSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('positions');

  // Export trade history to CSV
  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const headers = ['Timestamp', 'Date', 'Symbol', 'Side', 'Shares', 'Price', 'Total', 'Realized PnL', 'Type'];
    const rows = trades.map((t) => [
      t.timestamp,
      new Date(t.timestamp).toISOString(),
      t.symbol,
      t.side,
      t.shares,
      t.price,
      t.total,
      t.realizedPnL || 0,
      t.type,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trade_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Performance calculations
  const winningTrades = trades.filter((t) => (t.realizedPnL || 0) > 0);
  const losingTrades = trades.filter((t) => (t.realizedPnL || 0) < 0);
  const grossProfit = winningTrades.reduce((acc, t) => acc + (t.realizedPnL || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + (t.realizedPnL || 0), 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? 'MAX' : '0.00';
  const bestTrade = trades.reduce((max, t) => ((t.realizedPnL || 0) > (max?.realizedPnL || 0) ? t : max), trades[0]);
  const worstTrade = trades.reduce((min, t) => ((t.realizedPnL || 0) < (min?.realizedPnL || 0) ? t : min), trades[0]);

  return (
    <div className="bg-[#0d0d10] border border-white/5 rounded-md p-4 shadow-2xl">
      {/* Portfolio Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Total Net Equity</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            ${portfolio.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            Cash: ${portfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Unrealized P&L</span>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              portfolio.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.unrealizedPnL >= 0 ? '+' : ''}$
            {portfolio.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div
            className={`text-[10px] font-mono font-semibold ${
              portfolio.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.unrealizedPnL >= 0 ? '+' : ''}
            {portfolio.unrealizedPnLPercent.toFixed(2)}% Return
          </div>
        </div>

        <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Realized P&L</span>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              portfolio.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.realizedPnL >= 0 ? '+' : ''}$
            {portfolio.realizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {trades.length} Closed Trades
          </div>
        </div>

        <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Win Rate %</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {portfolio.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            {portfolio.winCount}W / {portfolio.lossCount}L
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center space-x-1.5 bg-[#16161c] p-1 rounded-md border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1 rounded transition-all flex items-center space-x-1.5 ${
              activeTab === 'positions'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Open Positions ({positions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1 rounded transition-all flex items-center space-x-1.5 ${
              activeTab === 'orders'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Working Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded transition-all flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trade Ledger ({trades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded transition-all flex items-center space-x-1.5 ${
              activeTab === 'analytics'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Performance</span>
          </button>
        </div>

        {activeTab === 'history' && trades.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#16161c] hover:bg-[#202028] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Tab 1: Open Positions */}
      {activeTab === 'positions' && (
        <div className="mt-4 overflow-x-auto">
          {positions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium">No open positions.</p>
              <p className="text-xs text-slate-500 mt-1">
                Select an asset on the left or use the order execution panel to place a trade.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-white/5 text-[10px] uppercase tracking-widest">
                  <th className="pb-2.5 font-semibold">Symbol</th>
                  <th className="pb-2.5 font-semibold">Side</th>
                  <th className="pb-2.5 font-semibold">Shares</th>
                  <th className="pb-2.5 font-semibold">Avg Price</th>
                  <th className="pb-2.5 font-semibold">Current Price</th>
                  <th className="pb-2.5 font-semibold">Market Value</th>
                  <th className="pb-2.5 font-semibold">Unrealized P&L</th>
                  <th className="pb-2.5 font-semibold">TP / SL</th>
                  <th className="pb-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {positions.map((pos) => {
                  const isPos = pos.unrealizedPnL >= 0;
                  return (
                    <tr key={`${pos.symbol}-${pos.side}`} className="hover:bg-[#16161c]/50 transition-colors">
                      <td className="py-3 font-bold text-white cursor-pointer hover:text-emerald-400" onClick={() => onSelectSymbol(pos.symbol)}>
                        {pos.symbol}
                        <span className="block text-[10px] font-normal text-slate-500 truncate max-w-[120px] font-sans">
                          {pos.name}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === 'LONG'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="py-3 text-slate-200">{pos.shares.toLocaleString()}</td>
                      <td className="py-3 text-slate-300">${pos.avgEntryPrice.toFixed(2)}</td>
                      <td className="py-3 text-white font-bold">${pos.currentPrice.toFixed(2)}</td>
                      <td className="py-3 text-slate-200">
                        ${pos.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3">
                        <div className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPos ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({isPos ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="py-3 text-[10px] text-slate-500">
                        {pos.takeProfitPrice && <span className="text-emerald-400 block">TP: ${pos.takeProfitPrice.toFixed(2)}</span>}
                        {pos.stopLossPrice && <span className="text-rose-400 block">SL: ${pos.stopLossPrice.toFixed(2)}</span>}
                        {!pos.takeProfitPrice && !pos.stopLossPrice && <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onClosePosition(pos.symbol)}
                          className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all font-sans"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Working Orders */}
      {activeTab === 'orders' && (
        <div className="mt-4 overflow-x-auto">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium">No active limit or stop orders.</p>
              <p className="text-xs text-slate-500 mt-1">Pending limit orders will show here until triggered.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-white/5 text-[10px] uppercase tracking-widest">
                  <th className="pb-2.5 font-semibold">Symbol</th>
                  <th className="pb-2.5 font-semibold">Type</th>
                  <th className="pb-2.5 font-semibold">Side</th>
                  <th className="pb-2.5 font-semibold">Shares</th>
                  <th className="pb-2.5 font-semibold">Trigger Price</th>
                  <th className="pb-2.5 font-semibold">Created</th>
                  <th className="pb-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#16161c]/50">
                    <td className="py-3 font-bold text-white">{order.symbol}</td>
                    <td className="py-3 text-slate-300">{order.type}</td>
                    <td className="py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="py-3 text-slate-200">{order.shares}</td>
                    <td className="py-3 text-emerald-400 font-bold">
                      ${(order.limitPrice || order.stopPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-slate-500 text-[10px]">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#16161c] transition-colors"
                        title="Cancel Order"
                      >
                        <XCircle className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Trade History & Ledger */}
      {activeTab === 'history' && (
        <div className="mt-4 overflow-x-auto">
          {trades.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium">No trades recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">All executions and closed P&L are logged here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-white/5 text-[10px] uppercase tracking-widest">
                  <th className="pb-2.5 font-semibold">Time</th>
                  <th className="pb-2.5 font-semibold">Symbol</th>
                  <th className="pb-2.5 font-semibold">Side</th>
                  <th className="pb-2.5 font-semibold">Shares</th>
                  <th className="pb-2.5 font-semibold">Fill Price</th>
                  <th className="pb-2.5 font-semibold">Total Amount</th>
                  <th className="pb-2.5 font-semibold text-right">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trades.map((trade) => {
                  const hasPnL = trade.realizedPnL !== undefined;
                  const isPos = (trade.realizedPnL || 0) >= 0;
                  return (
                    <tr key={trade.id} className="hover:bg-[#16161c]/50">
                      <td className="py-3 text-slate-500 text-[10px]">
                        {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[9px] text-slate-600">
                          {new Date(trade.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-white">{trade.symbol}</td>
                      <td className="py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            trade.side === 'BUY' || trade.side === 'COVER'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-3 text-slate-200">{trade.shares}</td>
                      <td className="py-3 text-white font-semibold">${trade.price.toFixed(2)}</td>
                      <td className="py-3 text-slate-300">${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 text-right">
                        {hasPnL ? (
                          <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? '+' : ''}${trade.realizedPnL?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Performance Analytics */}
      {activeTab === 'analytics' && (
        <div className="mt-4 space-y-5">
          {/* Performance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Profit Factor</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{profitFactor}</div>
              <span className="text-[10px] text-slate-500">Gross Gain / Loss</span>
            </div>

            <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Best Trade</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {bestTrade && (bestTrade.realizedPnL || 0) > 0
                  ? `+$${bestTrade.realizedPnL?.toFixed(2)} (${bestTrade.symbol})`
                  : '—'}
              </div>
              <span className="text-[10px] text-slate-500">Top single gain</span>
            </div>

            <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Worst Trade</span>
              <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                {worstTrade && (worstTrade.realizedPnL || 0) < 0
                  ? `-$${Math.abs(worstTrade.realizedPnL || 0).toFixed(2)} (${worstTrade.symbol})`
                  : '—'}
              </div>
              <span className="text-[10px] text-slate-500">Max drawdown trade</span>
            </div>

            <div className="bg-[#16161c] p-3.5 rounded-md border border-white/10">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Total Trades Logged</span>
              <div className="text-lg font-bold font-mono text-white mt-1">{trades.length}</div>
              <span className="text-[10px] text-slate-500">Executions in session</span>
            </div>
          </div>

          {/* Equity Chart */}
          <div className="bg-[#16161c] p-4 rounded-md border border-white/10">
            <h3 className="text-xs font-semibold text-slate-300 uppercase mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Account Equity Curve
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolio.equityHistory}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tickFormatter={(time) => new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    stroke="#475569"
                    fontSize={10}
                  />
                  <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0d0d10] border border-white/10 p-2 rounded-md text-xs font-mono">
                            <p className="text-slate-500">{new Date(payload[0].payload.time).toLocaleString()}</p>
                            <p className="text-emerald-400 font-bold">Equity: ${payload[0].value?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#equityGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
