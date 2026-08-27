export interface Candle {
  time: number; // Unix timestamp in seconds or ms
  dateStr?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  currency: string;
  exchange: string;
  timestamp: number;
  assetType: 'stock' | 'crypto' | 'etf' | 'index';
  sparkline?: number[];
  bid?: number;
  ask?: number;
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type OrderSide = 'BUY' | 'SELL' | 'SHORT' | 'COVER';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  status: OrderStatus;
  createdAt: number;
  filledAt?: number;
  filledPrice?: number;
  totalCost?: number;
  notes?: string;
}

export interface Position {
  symbol: string;
  name: string;
  side: 'LONG' | 'SHORT';
  shares: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  lastUpdated: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  name: string;
  side: OrderSide;
  shares: number;
  price: number;
  total: number;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  timestamp: number;
  fee: number;
  type: OrderType;
}

export interface PortfolioSummary {
  startingBalance: number;
  cashBalance: number;
  investedBalance: number;
  totalEquity: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  totalPnL: number;
  totalPnLPercent: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  buyingPower: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  winRate: number;
  equityHistory: { time: number; equity: number; cash: number }[];
}

export interface IndicatorConfig {
  sma20: boolean;
  sma50: boolean;
  ema20: boolean;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
  volume: boolean;
}

export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '1d' | '1wk';
export type ChartType = 'candlestick' | 'area' | 'line';
