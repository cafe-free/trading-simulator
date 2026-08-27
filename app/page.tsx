'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote, Candle, TimeRange, ChartInterval, OrderSide, OrderType } from '@/lib/types';
import { useTradingStore } from '@/hooks/use-trading-store';
import { Navbar } from '@/components/Navbar';
import { TickerTape } from '@/components/TickerTape';
import { TradingChart } from '@/components/TradingChart';
import { OrderExecutionPanel } from '@/components/OrderExecutionPanel';
import { WatchlistSidebar } from '@/components/WatchlistSidebar';
import { PortfolioSection } from '@/components/PortfolioSection';
import { SearchModal } from '@/components/SearchModal';
import { AIAnalystModal } from '@/components/AIAnalystModal';
import { RiskCalculatorModal } from '@/components/RiskCalculatorModal';
import { AccountSettingsModal } from '@/components/AccountSettingsModal';
import { POPULAR_SYMBOLS } from '@/lib/market-data-service';
import { AlertCircle, CheckCircle2, Info, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

export default function TradingSimulatorApp() {
  const store = useTradingStore();

  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [currentCandles, setCurrentCandles] = useState<Candle[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'trade' | 'portfolio' | 'analytics'>('trade');

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { updatePricesInPositions, watchlist } = store;

  // Initial popular quotes fetch
  const fetchAllQuotes = useCallback(async () => {
    try {
      const symbolsToFetch = Array.from(
        new Set([...POPULAR_SYMBOLS.map((s) => s.symbol), ...watchlist, selectedSymbol])
      );
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbolsToFetch.join(','))}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quotes && Array.isArray(data.quotes)) {
          const map: Record<string, Quote> = {};
          data.quotes.forEach((q: Quote) => {
            map[q.symbol] = q;
          });
          setQuotes((prev) => ({ ...prev, ...map }));
          updatePricesInPositions(map);
        }
      }
    } catch {
      // ignore
    }
  }, [selectedSymbol, watchlist, updatePricesInPositions]);

  // Fetch historical data & candles for selected symbol
  const fetchHistoricalCandles = useCallback(
    async (sym: string, range: TimeRange) => {
      setIsLoadingChart(true);
      try {
        const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(sym)}&range=${range}`);
        if (res.ok) {
          const data = await res.json();
          if (data.candles) {
            setCurrentCandles(data.candles);
          }
          if (data.quote) {
            setQuotes((prev) => {
              const updated = { ...prev, [data.quote.symbol]: data.quote };
              updatePricesInPositions(updated);
              return updated;
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingChart(false);
      }
    },
    [updatePricesInPositions]
  );

  // Fetch candles & quotes when symbol or timeRange changes
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await fetchAllQuotes();
      if (!active) return;
      await fetchHistoricalCandles(selectedSymbol, timeRange);
    };
    run();
    return () => {
      active = false;
    };
  }, [selectedSymbol, timeRange, fetchAllQuotes, fetchHistoricalCandles]);

  // Real-time tick updates stream & quote polling (every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllQuotes();

      // Simulate micro-tick on current symbol to provide lively real-time execution feedback
      setQuotes((prev) => {
        const current = prev[selectedSymbol];
        if (!current) return prev;

        const delta = (Math.random() - 0.49) * 0.0015 * current.price;
        const newPrice = Number((current.price + delta).toFixed(2));
        const newChange = Number((newPrice - current.previousClose).toFixed(2));
        const newPct = Number(((newChange / current.previousClose) * 100).toFixed(2));

        const updatedQuote: Quote = {
          ...current,
          price: newPrice,
          change: newChange,
          changePercent: newPct,
          high: Math.max(current.high, newPrice),
          low: Math.min(current.low, newPrice),
          timestamp: Date.now(),
        };

        const updatedMap = { ...prev, [selectedSymbol]: updatedQuote };
        updatePricesInPositions(updatedMap);
        return updatedMap;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedSymbol, fetchAllQuotes, updatePricesInPositions]);

  // Active position for currently selected symbol
  const activePosition = store.positions.find((p) => p.symbol === selectedSymbol);
  const selectedQuote = quotes[selectedSymbol] || {
    symbol: selectedSymbol,
    name: `${selectedSymbol} Asset`,
    price: 150.0,
    change: 2.5,
    changePercent: 1.68,
    previousClose: 147.5,
    open: 148.0,
    high: 151.2,
    low: 147.8,
    volume: 3200000,
    currency: 'USD',
    exchange: 'NASDAQ',
    timestamp: 0,
    assetType: selectedSymbol.includes('-USD') ? 'crypto' : 'stock',
  };

  const portfolioSummary = store.getPortfolioSummary();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white antialiased">
      {/* Navbar */}
      <Navbar
        portfolio={portfolioSummary}
        selectedQuote={selectedQuote}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAIInsights={() => setIsAIOpen(true)}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Real-time Ticker Tape Bar */}
      <TickerTape
        quotes={quotes}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={(sym) => setSelectedSymbol(sym)}
      />

      {/* Notification Toast Alert */}
      {store.notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-3 text-xs font-semibold backdrop-blur-md ${
              store.notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : store.notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {store.notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : store.notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{store.notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-5">
        {activeView === 'trade' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left Watchlist Sidebar (3 Cols on XL) */}
            <div className="xl:col-span-3">
              <WatchlistSidebar
                quotes={quotes}
                watchlistSymbols={store.watchlist}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
                onToggleWatchlist={(sym) => store.toggleWatchlist(sym)}
                onOpenSearch={() => setIsSearchOpen(true)}
              />
            </div>

            {/* Center Chart Station (6 Cols on XL) */}
            <div className="xl:col-span-6 space-y-5">
              <TradingChart
                quote={selectedQuote}
                candles={currentCandles}
                timeRange={timeRange}
                setTimeRange={(range) => setTimeRange(range)}
                activePosition={activePosition}
                isLoading={isLoadingChart}
              />

              {/* Bottom Quick Positions / Orders Summary */}
              <PortfolioSection
                portfolio={portfolioSummary}
                positions={store.positions}
                orders={store.orders}
                trades={store.trades}
                onClosePosition={(sym) => store.executeClosePosition(sym)}
                onCancelOrder={(id) => store.cancelOrder(id)}
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              />
            </div>

            {/* Right Order Execution Ticket (3 Cols on XL) */}
            <div className="xl:col-span-3">
              <OrderExecutionPanel
                quote={selectedQuote}
                cashBalance={store.cash}
                activePosition={activePosition}
                onExecuteOrder={(sym, name, side, type, shares, price, opts) =>
                  store.placeOrder(sym, name, side, type, shares, price, opts)
                }
              />
            </div>
          </div>
        )}

        {(activeView === 'portfolio' || activeView === 'analytics') && (
          <div className="max-w-6xl mx-auto space-y-5">
            <PortfolioSection
              portfolio={portfolioSummary}
              positions={store.positions}
              orders={store.orders}
              trades={store.trades}
              onClosePosition={(sym) => store.executeClosePosition(sym)}
              onCancelOrder={(id) => store.cancelOrder(id)}
              onSelectSymbol={(sym) => {
                setSelectedSymbol(sym);
                setActiveView('trade');
              }}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={(sym) => setSelectedSymbol(sym)}
      />

      <AIAnalystModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        quote={selectedQuote}
        candles={currentCandles}
        timeRange={timeRange}
      />

      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        cashBalance={store.cash}
        selectedQuote={selectedQuote}
      />

      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cashBalance={store.cash}
        startingBalance={store.startingBalance}
        onResetAccount={(bal) => store.resetAccount(bal)}
        onAdjustCash={(delta) => store.adjustCash(delta)}
      />
    </div>
  );
}
