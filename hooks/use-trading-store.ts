'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, Position, TradeRecord, PortfolioSummary, OrderSide, OrderType, Quote } from '@/lib/types';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'trading_simulator_state_v1';
const DEFAULT_CASH = 100000;

interface StoredState {
  cash: number;
  startingBalance: number;
  positions: Position[];
  orders: Order[];
  trades: TradeRecord[];
  equityHistory: { time: number; equity: number; cash: number }[];
  watchlist: string[];
}

function getInitialStoredState(): StoredState {
  if (typeof window === 'undefined') {
    return {
      cash: DEFAULT_CASH,
      startingBalance: DEFAULT_CASH,
      positions: [],
      orders: [],
      trades: [],
      equityHistory: [{ time: Date.now() - 86400000, equity: DEFAULT_CASH, cash: DEFAULT_CASH }, { time: Date.now(), equity: DEFAULT_CASH, cash: DEFAULT_CASH }],
      watchlist: ['AAPL', 'NVDA', 'TSLA', 'SPY', 'BTC-USD', 'ETH-USD', 'MSFT', 'AMZN'],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: StoredState = JSON.parse(raw);
      return {
        cash: data.cash ?? DEFAULT_CASH,
        startingBalance: data.startingBalance ?? DEFAULT_CASH,
        positions: data.positions || [],
        orders: data.orders || [],
        trades: data.trades || [],
        equityHistory: data.equityHistory && data.equityHistory.length > 0
          ? data.equityHistory
          : [{ time: Date.now() - 86400000, equity: DEFAULT_CASH, cash: DEFAULT_CASH }, { time: Date.now(), equity: DEFAULT_CASH, cash: DEFAULT_CASH }],
        watchlist: data.watchlist && data.watchlist.length > 0 ? data.watchlist : ['AAPL', 'NVDA', 'TSLA', 'SPY', 'BTC-USD', 'ETH-USD', 'MSFT', 'AMZN'],
      };
    }
  } catch {
    // ignore
  }

  return {
    cash: DEFAULT_CASH,
    startingBalance: DEFAULT_CASH,
    positions: [],
    orders: [],
    trades: [],
    equityHistory: [{ time: Date.now() - 86400000, equity: DEFAULT_CASH, cash: DEFAULT_CASH }, { time: Date.now(), equity: DEFAULT_CASH, cash: DEFAULT_CASH }],
    watchlist: ['AAPL', 'NVDA', 'TSLA', 'SPY', 'BTC-USD', 'ETH-USD', 'MSFT', 'AMZN'],
  };
}

export function useTradingStore() {
  const [initialData] = useState<StoredState>(getInitialStoredState);
  const [cash, setCash] = useState<number>(initialData.cash);
  const [startingBalance, setStartingBalance] = useState<number>(initialData.startingBalance);
  const [positions, setPositions] = useState<Position[]>(initialData.positions);
  const [orders, setOrders] = useState<Order[]>(initialData.orders);
  const [trades, setTrades] = useState<TradeRecord[]>(initialData.trades);
  const [equityHistory, setEquityHistory] = useState<{ time: number; equity: number; cash: number }[]>(initialData.equityHistory);
  const [watchlist, setWatchlist] = useState<string[]>(initialData.watchlist);
  const [notification, setNotification] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync to local storage on changes
  useEffect(() => {
    try {
      const stateToSave: StoredState = {
        cash,
        startingBalance,
        positions,
        orders,
        trades,
        equityHistory,
        watchlist,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [cash, startingBalance, positions, orders, trades, equityHistory, watchlist]);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString();
    setNotification({ id, message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  // Calculate live portfolio summary
  const getPortfolioSummary = useCallback((): PortfolioSummary => {
    const investedBalance = positions.reduce((acc, pos) => acc + pos.marketValue, 0);
    const totalEquity = cash + investedBalance;
    const unrealizedPnL = positions.reduce((acc, pos) => acc + pos.unrealizedPnL, 0);
    const realizedPnL = trades.reduce((acc, trade) => acc + (trade.realizedPnL || 0), 0);
    const totalPnL = totalEquity - startingBalance;
    const totalPnLPercent = startingBalance > 0 ? (totalPnL / startingBalance) * 100 : 0;
    const unrealizedPnLPercent = investedBalance > 0 ? (unrealizedPnL / (investedBalance - unrealizedPnL)) * 100 : 0;

    const winCount = trades.filter((t) => (t.realizedPnL || 0) > 0).length;
    const lossCount = trades.filter((t) => (t.realizedPnL || 0) < 0).length;
    const totalClosed = winCount + lossCount;
    const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;

    return {
      startingBalance,
      cashBalance: cash,
      investedBalance,
      totalEquity,
      unrealizedPnL,
      unrealizedPnLPercent,
      realizedPnL,
      totalPnL,
      totalPnLPercent,
      dailyPnL: unrealizedPnL,
      dailyPnLPercent: totalEquity > 0 ? (unrealizedPnL / totalEquity) * 100 : 0,
      buyingPower: Math.max(0, cash),
      winCount,
      lossCount,
      totalTrades: trades.length,
      winRate,
      equityHistory,
    };
  }, [cash, startingBalance, positions, trades, equityHistory]);

  const executeClosePosition = useCallback(
    (symbol: string, reason: string = 'Closed Position') => {
      setPositions((currentPositions) => {
        const position = currentPositions.find((p) => p.symbol === symbol);
        if (!position) return currentPositions;

        const currentPrice = position.currentPrice;
        const shares = position.shares;
        const totalCost = shares * currentPrice;

        if (position.side === 'LONG') {
          const realizedPnL = (currentPrice - position.avgEntryPrice) * shares;
          const realizedPnLPercent = ((currentPrice - position.avgEntryPrice) / position.avgEntryPrice) * 100;
          setCash((prev) => prev + totalCost);

          const trade: TradeRecord = {
            id: Math.random().toString(36).substring(2, 9),
            symbol,
            name: position.name,
            side: 'SELL',
            shares,
            price: currentPrice,
            total: totalCost,
            realizedPnL,
            realizedPnLPercent,
            timestamp: Date.now(),
            fee: 0,
            type: 'MARKET',
          };
          setTrades((prev) => [trade, ...prev]);
          showNotification(`${reason}: Closed ${shares} ${symbol} @ $${currentPrice.toFixed(2)} (${realizedPnL >= 0 ? '+' : ''}$${realizedPnL.toFixed(2)})`, realizedPnL >= 0 ? 'success' : 'info');
        } else {
          // Short position
          const realizedPnL = (position.avgEntryPrice - currentPrice) * shares;
          const realizedPnLPercent = ((position.avgEntryPrice - currentPrice) / position.avgEntryPrice) * 100;
          setCash((prev) => prev - totalCost);

          const trade: TradeRecord = {
            id: Math.random().toString(36).substring(2, 9),
            symbol,
            name: position.name,
            side: 'COVER',
            shares,
            price: currentPrice,
            total: totalCost,
            realizedPnL,
            realizedPnLPercent,
            timestamp: Date.now(),
            fee: 0,
            type: 'MARKET',
          };
          setTrades((prev) => [trade, ...prev]);
          showNotification(`${reason}: Covered short ${shares} ${symbol} @ $${currentPrice.toFixed(2)} (${realizedPnL >= 0 ? '+' : ''}$${realizedPnL.toFixed(2)})`, realizedPnL >= 0 ? 'success' : 'info');
        }

        return currentPositions.filter((p) => p.symbol !== symbol);
      });
    },
    [showNotification]
  );

  // Update positions with live current price
  const updatePricesInPositions = useCallback((quotes: Record<string, Quote>) => {
    setPositions((prevPositions) => {
      let changed = false;
      const updated = prevPositions.map((pos) => {
        const quote = quotes[pos.symbol];
        if (!quote) return pos;

        const currentPrice = quote.price;
        const marketValue = pos.side === 'LONG' ? pos.shares * currentPrice : pos.shares * pos.avgEntryPrice;
        const unrealizedPnL = pos.side === 'LONG'
          ? (currentPrice - pos.avgEntryPrice) * pos.shares
          : (pos.avgEntryPrice - currentPrice) * pos.shares;
        const costBasis = pos.shares * pos.avgEntryPrice;
        const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

        if (pos.currentPrice !== currentPrice || pos.unrealizedPnL !== unrealizedPnL) {
          changed = true;
          return {
            ...pos,
            currentPrice,
            marketValue: pos.side === 'LONG' ? marketValue : (pos.shares * pos.avgEntryPrice + unrealizedPnL),
            unrealizedPnL,
            unrealizedPnLPercent,
            lastUpdated: Date.now(),
          };
        }
        return pos;
      });

      return changed ? updated : prevPositions;
    });

    // Check bracket orders
    setPositions((currentPositions) => {
      currentPositions.forEach((pos) => {
        const quote = quotes[pos.symbol];
        if (!quote) return;

        const price = quote.price;
        if (pos.stopLossPrice && ((pos.side === 'LONG' && price <= pos.stopLossPrice) || (pos.side === 'SHORT' && price >= pos.stopLossPrice))) {
          executeClosePosition(pos.symbol, 'Stop-Loss Triggered');
        } else if (pos.takeProfitPrice && ((pos.side === 'LONG' && price >= pos.takeProfitPrice) || (pos.side === 'SHORT' && price <= pos.takeProfitPrice))) {
          executeClosePosition(pos.symbol, 'Take-Profit Triggered');
        }
      });
      return currentPositions;
    });

    // Check pending limit orders
    setOrders((prevOrders) => {
      let changed = false;
      const remainingOrders: Order[] = [];

      prevOrders.forEach((order) => {
        const quote = quotes[order.symbol];
        if (!quote || order.status !== 'PENDING') {
          remainingOrders.push(order);
          return;
        }

        const price = quote.price;
        let shouldFill = false;

        if (order.type === 'LIMIT') {
          if (order.side === 'BUY' && price <= (order.limitPrice || 0)) shouldFill = true;
          if (order.side === 'SELL' && price >= (order.limitPrice || 0)) shouldFill = true;
          if (order.side === 'SHORT' && price >= (order.limitPrice || 0)) shouldFill = true;
          if (order.side === 'COVER' && price <= (order.limitPrice || 0)) shouldFill = true;
        } else if (order.type === 'STOP_LOSS') {
          if (order.side === 'SELL' && price <= (order.stopPrice || 0)) shouldFill = true;
          if (order.side === 'COVER' && price >= (order.stopPrice || 0)) shouldFill = true;
        }

        if (shouldFill) {
          changed = true;
          const totalCost = Number((order.shares * price).toFixed(2));
          if (order.side === 'BUY') {
            setCash((prev) => Math.max(0, prev - totalCost));
            setPositions((prev) => [
              ...prev,
              {
                symbol: order.symbol,
                name: quote.name || order.symbol,
                side: 'LONG',
                shares: order.shares,
                avgEntryPrice: price,
                currentPrice: price,
                marketValue: totalCost,
                unrealizedPnL: 0,
                unrealizedPnLPercent: 0,
                stopLossPrice: order.stopLossPrice,
                takeProfitPrice: order.takeProfitPrice,
                lastUpdated: Date.now(),
              },
            ]);
          }

          const tradeRecord: TradeRecord = {
            id: Math.random().toString(36).substring(2, 9),
            symbol: order.symbol,
            name: quote.name || order.symbol,
            side: order.side,
            shares: order.shares,
            price,
            total: totalCost,
            timestamp: Date.now(),
            fee: 0,
            type: order.type,
          };
          setTrades((prev) => [tradeRecord, ...prev]);
          showNotification(`Filled ${order.side} ${order.shares} ${order.symbol} @ $${price.toFixed(2)}`, 'success');
        } else {
          remainingOrders.push(order);
        }
      });

      return changed ? remainingOrders : prevOrders;
    });
  }, [executeClosePosition, showNotification]);

  // Place Order API
  const placeOrder = (
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
  ): { success: boolean; message: string } => {
    if (shares <= 0 || isNaN(shares)) {
      return { success: false, message: 'Please enter a valid share quantity.' };
    }

    const executionPrice = type === 'MARKET' ? currentPrice : (options?.limitPrice || currentPrice);
    const totalCost = Number((shares * executionPrice).toFixed(2));

    if (side === 'BUY') {
      if (totalCost > cash) {
        return { success: false, message: `Insufficient cash ($${cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}). Required: $${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` };
      }
    }

    if (side === 'SELL') {
      const existing = positions.find((p) => p.symbol === symbol && p.side === 'LONG');
      if (!existing || existing.shares < shares) {
        return { success: false, message: `Cannot sell ${shares} shares. Current long position: ${existing ? existing.shares : 0} shares.` };
      }
    }

    if (type === 'MARKET') {
      if (side === 'BUY') {
        setCash((prev) => prev - totalCost);
        setPositions((prev) => {
          const existing = prev.find((p) => p.symbol === symbol && p.side === 'LONG');
          if (existing) {
            const totalShares = existing.shares + shares;
            const totalBasis = existing.shares * existing.avgEntryPrice + totalCost;
            const avgEntryPrice = totalBasis / totalShares;
            return prev.map((p) =>
              p.symbol === symbol && p.side === 'LONG'
                ? {
                    ...p,
                    shares: totalShares,
                    avgEntryPrice,
                    currentPrice: executionPrice,
                    marketValue: totalShares * executionPrice,
                    unrealizedPnL: (executionPrice - avgEntryPrice) * totalShares,
                    unrealizedPnLPercent: ((executionPrice - avgEntryPrice) / avgEntryPrice) * 100,
                    stopLossPrice: options?.stopLossPrice || p.stopLossPrice,
                    takeProfitPrice: options?.takeProfitPrice || p.takeProfitPrice,
                  }
                : p
            );
          } else {
            return [
              ...prev,
              {
                symbol,
                name,
                side: 'LONG',
                shares,
                avgEntryPrice: executionPrice,
                currentPrice: executionPrice,
                marketValue: totalCost,
                unrealizedPnL: 0,
                unrealizedPnLPercent: 0,
                stopLossPrice: options?.stopLossPrice,
                takeProfitPrice: options?.takeProfitPrice,
                lastUpdated: Date.now(),
              },
            ];
          }
        });

        try {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        } catch {
          // ignore
        }
      } else if (side === 'SELL') {
        const existing = positions.find((p) => p.symbol === symbol && p.side === 'LONG')!;
        const realizedPnL = (executionPrice - existing.avgEntryPrice) * shares;
        const realizedPnLPercent = ((executionPrice - existing.avgEntryPrice) / existing.avgEntryPrice) * 100;
        
        setCash((prev) => prev + totalCost);
        setPositions((prev) => {
          if (existing.shares === shares) {
            return prev.filter((p) => !(p.symbol === symbol && p.side === 'LONG'));
          } else {
            const remaining = existing.shares - shares;
            return prev.map((p) =>
              p.symbol === symbol && p.side === 'LONG'
                ? {
                    ...p,
                    shares: remaining,
                    marketValue: remaining * executionPrice,
                    unrealizedPnL: (executionPrice - p.avgEntryPrice) * remaining,
                    unrealizedPnLPercent: ((executionPrice - p.avgEntryPrice) / p.avgEntryPrice) * 100,
                  }
                : p
            );
          }
        });

        const trade: TradeRecord = {
          id: Math.random().toString(36).substring(2, 9),
          symbol,
          name,
          side: 'SELL',
          shares,
          price: executionPrice,
          total: totalCost,
          realizedPnL,
          realizedPnLPercent,
          timestamp: Date.now(),
          fee: 0,
          type: 'MARKET',
        };
        setTrades((prev) => [trade, ...prev]);

        if (realizedPnL > 0) {
          try {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
          } catch {
            // ignore
          }
        }

        showNotification(
          `Sold ${shares} ${symbol} @ $${executionPrice.toFixed(2)} (P&L: ${realizedPnL >= 0 ? '+' : ''}$${realizedPnL.toFixed(2)})`,
          realizedPnL >= 0 ? 'success' : 'info'
        );
        return { success: true, message: `Sold ${shares} shares of ${symbol} successfully.` };
      } else if (side === 'SHORT') {
        setCash((prev) => prev + totalCost);
        setPositions((prev) => [
          ...prev,
          {
            symbol,
            name,
            side: 'SHORT',
            shares,
            avgEntryPrice: executionPrice,
            currentPrice: executionPrice,
            marketValue: totalCost,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            stopLossPrice: options?.stopLossPrice,
            takeProfitPrice: options?.takeProfitPrice,
            lastUpdated: Date.now(),
          },
        ]);
      } else if (side === 'COVER') {
        const existingShort = positions.find((p) => p.symbol === symbol && p.side === 'SHORT')!;
        const realizedPnL = (existingShort.avgEntryPrice - executionPrice) * shares;
        const realizedPnLPercent = ((existingShort.avgEntryPrice - executionPrice) / existingShort.avgEntryPrice) * 100;

        setCash((prev) => prev - totalCost);
        setPositions((prev) => prev.filter((p) => !(p.symbol === symbol && p.side === 'SHORT')));

        const trade: TradeRecord = {
          id: Math.random().toString(36).substring(2, 9),
          symbol,
          name,
          side: 'COVER',
          shares,
          price: executionPrice,
          total: totalCost,
          realizedPnL,
          realizedPnLPercent,
          timestamp: Date.now(),
          fee: 0,
          type: 'MARKET',
        };
        setTrades((prev) => [trade, ...prev]);
        showNotification(`Covered ${shares} ${symbol} @ $${executionPrice.toFixed(2)}`, 'success');
        return { success: true, message: `Covered ${shares} shares of ${symbol}.` };
      }

      const trade: TradeRecord = {
        id: Math.random().toString(36).substring(2, 9),
        symbol,
        name,
        side,
        shares,
        price: executionPrice,
        total: totalCost,
        timestamp: Date.now(),
        fee: 0,
        type: 'MARKET',
      };
      setTrades((prev) => [trade, ...prev]);
      showNotification(`Executed ${side} ${shares} ${symbol} @ $${executionPrice.toFixed(2)}`, 'success');
      return { success: true, message: `Order executed: ${side} ${shares} ${symbol}` };
    } else {
      const newOrder: Order = {
        id: Math.random().toString(36).substring(2, 9),
        symbol,
        side,
        type,
        shares,
        limitPrice: options?.limitPrice,
        stopPrice: options?.stopPrice,
        takeProfitPrice: options?.takeProfitPrice,
        stopLossPrice: options?.stopLossPrice,
        status: 'PENDING',
        createdAt: Date.now(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      showNotification(`Created ${type} order for ${shares} ${symbol} @ $${(options?.limitPrice || options?.stopPrice || 0).toFixed(2)}`, 'info');
      return { success: true, message: `Placed ${type} order for ${symbol}.` };
    }
  };

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showNotification('Order cancelled', 'info');
  }, [showNotification]);

  const toggleWatchlist = useCallback((symbol: string) => {
    const cleanSym = symbol.toUpperCase().trim();
    setWatchlist((prev) => {
      if (prev.includes(cleanSym)) {
        return prev.filter((s) => s !== cleanSym);
      } else {
        return [...prev, cleanSym];
      }
    });
  }, []);

  const resetAccount = useCallback((newStartingBalance: number = DEFAULT_CASH) => {
    setStartingBalance(newStartingBalance);
    setCash(newStartingBalance);
    setPositions([]);
    setOrders([]);
    setTrades([]);
    setEquityHistory([
      { time: Date.now() - 86400000, equity: newStartingBalance, cash: newStartingBalance },
      { time: Date.now(), equity: newStartingBalance, cash: newStartingBalance },
    ]);
    showNotification(`Account reset with $${newStartingBalance.toLocaleString()} virtual cash.`, 'info');
  }, [showNotification]);

  const adjustCash = useCallback((amountDelta: number) => {
    setCash((prev) => Math.max(0, prev + amountDelta));
    setStartingBalance((prev) => Math.max(0, prev + amountDelta));
    showNotification(`Adjusted cash balance by ${amountDelta >= 0 ? '+' : ''}$${amountDelta.toLocaleString()}`, 'info');
  }, [showNotification]);

  return {
    cash,
    startingBalance,
    positions,
    orders,
    trades,
    equityHistory,
    watchlist,
    notification,
    getPortfolioSummary,
    updatePricesInPositions,
    placeOrder,
    executeClosePosition,
    cancelOrder,
    toggleWatchlist,
    resetAccount,
    adjustCash,
    showNotification,
  };
}
