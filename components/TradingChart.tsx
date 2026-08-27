'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Candle, Quote, TimeRange, ChartInterval, ChartType, IndicatorConfig, Position } from '@/lib/types';
import { enrichCandlesWithIndicators, IndicatorDataPoint } from '@/lib/indicators';
import {
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  BarChart2,
  LineChart as LineChartIcon,
  Sliders,
  Eye,
  EyeOff,
  Crosshair,
  Volume2,
  Info,
} from 'lucide-react';

interface TradingChartProps {
  quote: Quote;
  candles: Candle[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  interval?: ChartInterval;
  setInterval?: (interval: ChartInterval) => void;
  activePosition?: Position;
  isLoading?: boolean;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  quote,
  candles,
  timeRange,
  setTimeRange,
  activePosition,
  isLoading = false,
}) => {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [hoveredPoint, setHoveredPoint] = useState<IndicatorDataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    sma20: true,
    sma50: false,
    ema20: false,
    bollinger: false,
    rsi: true,
    macd: false,
    volume: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute enriched data with indicators
  const enrichedData: IndicatorDataPoint[] = useMemo(() => {
    return enrichCandlesWithIndicators(candles);
  }, [candles]);

  const activePoint = hoveredPoint || (enrichedData.length > 0 ? enrichedData[enrichedData.length - 1] : null);

  // SVG Chart Calculations
  const chartHeight = indicators.rsi || indicators.macd ? 320 : 400;
  const subChartHeight = 90;
  const chartWidth = 900; // coordinate space
  const padding = { top: 20, right: 65, bottom: 25, left: 15 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  // Min and Max prices for main chart
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (!enrichedData || enrichedData.length === 0) {
      return { minPrice: 100, maxPrice: 200, maxVol: 100000 };
    }

    let min = Infinity;
    let max = -Infinity;
    let maxV = 0;

    enrichedData.forEach((d) => {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
      if (d.volume > maxV) maxV = d.volume;

      // Include indicators in scale if active
      if (indicators.sma20 && d.sma20 !== undefined) {
        if (d.sma20 < min) min = d.sma20;
        if (d.sma20 > max) max = d.sma20;
      }
      if (indicators.sma50 && d.sma50 !== undefined) {
        if (d.sma50 < min) min = d.sma50;
        if (d.sma50 > max) max = d.sma50;
      }
      if (indicators.bollinger && d.bbUpper !== undefined && d.bbLower !== undefined) {
        if (d.bbLower < min) min = d.bbLower;
        if (d.bbUpper > max) max = d.bbUpper;
      }
    });

    if (activePosition) {
      if (activePosition.avgEntryPrice < min) min = activePosition.avgEntryPrice;
      if (activePosition.avgEntryPrice > max) max = activePosition.avgEntryPrice;
    }

    const priceBuffer = (max - min) * 0.08 || 5;
    return {
      minPrice: Math.max(0.01, min - priceBuffer),
      maxPrice: max + priceBuffer,
      maxVol: maxV || 1,
    };
  }, [enrichedData, indicators, activePosition]);

  const priceRange = maxPrice - minPrice || 1;

  // Coordinate conversion helpers
  const getX = useCallback(
    (index: number) => {
      if (enrichedData.length <= 1) return padding.left;
      return padding.left + (index / (enrichedData.length - 1)) * usableWidth;
    },
    [enrichedData.length, padding.left, usableWidth]
  );

  const getY = useCallback(
    (price: number) => {
      return padding.top + usableHeight - ((price - minPrice) / priceRange) * usableHeight;
    },
    [padding.top, usableHeight, minPrice, priceRange]
  );

  const getVolY = useCallback(
    (vol: number) => {
      const volHeight = usableHeight * 0.28;
      return padding.top + usableHeight - (vol / maxVol) * volHeight;
    },
    [padding.top, usableHeight, maxVol]
  );

  // Generate Candlestick / Line Paths
  const candleWidth = useMemo(() => {
    if (enrichedData.length === 0) return 4;
    const spacing = usableWidth / enrichedData.length;
    return Math.max(1.5, Math.min(12, spacing * 0.72));
  }, [enrichedData.length, usableWidth]);

  // Line & Area Path
  const areaPath = useMemo(() => {
    if (enrichedData.length === 0) return '';
    let path = `M ${getX(0)} ${getY(enrichedData[0].close)}`;
    for (let i = 1; i < enrichedData.length; i++) {
      path += ` L ${getX(i)} ${getY(enrichedData[i].close)}`;
    }
    const closedPath = `${path} L ${getX(enrichedData.length - 1)} ${padding.top + usableHeight} L ${getX(0)} ${
      padding.top + usableHeight
    } Z`;
    return closedPath;
  }, [enrichedData, getX, getY, padding.top, usableHeight]);

  const linePath = useMemo(() => {
    if (enrichedData.length === 0) return '';
    let path = `M ${getX(0)} ${getY(enrichedData[0].close)}`;
    for (let i = 1; i < enrichedData.length; i++) {
      path += ` L ${getX(i)} ${getY(enrichedData[i].close)}`;
    }
    return path;
  }, [enrichedData, getX, getY]);

  // Indicator Lines
  const buildIndicatorPath = useCallback(
    (getter: (d: IndicatorDataPoint) => number | undefined) => {
      let path = '';
      let started = false;
      enrichedData.forEach((d, i) => {
        const val = getter(d);
        if (val !== undefined && !isNaN(val)) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            path = `M ${x} ${y}`;
            started = true;
          } else {
            path += ` L ${x} ${y}`;
          }
        }
      });
      return path;
    },
    [enrichedData, getX, getY]
  );

  const sma20Path = useMemo(() => (indicators.sma20 ? buildIndicatorPath((d) => d.sma20) : ''), [indicators.sma20, buildIndicatorPath]);
  const sma50Path = useMemo(() => (indicators.sma50 ? buildIndicatorPath((d) => d.sma50) : ''), [indicators.sma50, buildIndicatorPath]);
  const ema20Path = useMemo(() => (indicators.ema20 ? buildIndicatorPath((d) => d.ema20) : ''), [indicators.ema20, buildIndicatorPath]);
  const bbUpperPath = useMemo(() => (indicators.bollinger ? buildIndicatorPath((d) => d.bbUpper) : ''), [indicators.bollinger, buildIndicatorPath]);
  const bbLowerPath = useMemo(() => (indicators.bollinger ? buildIndicatorPath((d) => d.bbLower) : ''), [indicators.bollinger, buildIndicatorPath]);
  const bbMiddlePath = useMemo(() => (indicators.bollinger ? buildIndicatorPath((d) => d.bbMiddle) : ''), [indicators.bollinger, buildIndicatorPath]);

  // RSI Sub-chart calculation
  const rsiPath = useMemo(() => {
    if (!indicators.rsi) return '';
    let path = '';
    let started = false;
    enrichedData.forEach((d, i) => {
      if (d.rsi !== undefined) {
        const x = getX(i);
        const y = 15 + subChartHeight - 25 - (d.rsi / 100) * (subChartHeight - 35);
        if (!started) {
          path = `M ${x} ${y}`;
          started = true;
        } else {
          path += ` L ${x} ${y}`;
        }
      }
    });
    return path;
  }, [enrichedData, indicators.rsi, getX, subChartHeight]);

  // Mouse Move Handler for Crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const svgX = (clientX / rect.width) * chartWidth;
    const svgY = (clientY / rect.height) * (chartHeight + (indicators.rsi ? subChartHeight : 0));

    // Find closest index
    const ratio = Math.max(0, Math.min(1, (svgX - padding.left) / usableWidth));
    const index = Math.round(ratio * (enrichedData.length - 1));

    if (index >= 0 && index < enrichedData.length) {
      setHoveredPoint(enrichedData[index]);
      setHoverPos({ x: getX(index), y: svgY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  const timeRanges: TimeRange[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];
  const isPositive = quote.change >= 0;

  return (
    <div className="flex flex-col bg-[#0d0d10] border border-white/5 rounded-md p-4 lg:p-5 shadow-2xl relative">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
        {/* Symbol & Price Info */}
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold font-mono text-white tracking-tight">{quote.symbol}</h1>
              <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-[#16161c] border border-white/10">
                {quote.exchange} • {quote.assetType.toUpperCase()}
              </span>
              {activePosition && (
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    activePosition.unrealizedPnL >= 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  POS: {activePosition.shares} ({activePosition.unrealizedPnL >= 0 ? '+' : ''}$
                  {activePosition.unrealizedPnL.toFixed(2)})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-md">{quote.name}</p>
          </div>

          <div className="h-8 w-px bg-white/5 hidden sm:block" />

          {/* Current / Hovered Price Display */}
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                ${(hoveredPoint?.close ?? quote.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`font-mono text-sm font-semibold flex items-center ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4 mr-0.5 inline" /> : <TrendingDown className="w-4 h-4 mr-0.5 inline" />}
                {isPositive ? '+' : ''}
                {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
                {quote.changePercent.toFixed(2)}%)
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-3">
              <span>O: ${(activePoint?.open ?? quote.open).toFixed(2)}</span>
              <span>H: ${(activePoint?.high ?? quote.high).toFixed(2)}</span>
              <span>L: ${(activePoint?.low ?? quote.low).toFixed(2)}</span>
              <span>Vol: {(activePoint?.volume ?? quote.volume).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Controls & Indicators Toolbar */}
        <div className="flex items-center space-x-2">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-[#16161c] p-0.5 rounded-md border border-white/10 text-xs">
            <button
              onClick={() => setChartType('candlestick')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'candlestick' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5 rotate-90" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'area' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Area / Line Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicators Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all ${
                showIndicatorsMenu
                  ? 'bg-[#16161c] border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-[#16161c] border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Indicators</span>
            </button>

            {/* Indicators Menu Popover */}
            {showIndicatorsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0d0d10] border border-white/10 rounded-md shadow-2xl p-3 z-50 text-xs">
                <div className="font-semibold text-slate-200 pb-2 mb-2 border-b border-white/5">
                  Technical Overlays
                </div>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      SMA 20
                    </span>
                    <input
                      type="checkbox"
                      checked={indicators.sma20}
                      onChange={(e) => setIndicators({ ...indicators, sma20: e.target.checked })}
                      className="rounded bg-[#16161c] border-white/10 text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      SMA 50
                    </span>
                    <input
                      type="checkbox"
                      checked={indicators.sma50}
                      onChange={(e) => setIndicators({ ...indicators, sma50: e.target.checked })}
                      className="rounded bg-[#16161c] border-white/10 text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      EMA 20
                    </span>
                    <input
                      type="checkbox"
                      checked={indicators.ema20}
                      onChange={(e) => setIndicators({ ...indicators, ema20: e.target.checked })}
                      className="rounded bg-[#16161c] border-white/10 text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      Bollinger Bands
                    </span>
                    <input
                      type="checkbox"
                      checked={indicators.bollinger}
                      onChange={(e) => setIndicators({ ...indicators, bollinger: e.target.checked })}
                      className="rounded bg-[#16161c] border-white/10 text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <div className="font-semibold text-slate-200 pt-2 pb-1 border-t border-white/5">
                    Sub-Chart Oscillators
                  </div>

                  <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      RSI (14)
                    </span>
                    <input
                      type="checkbox"
                      checked={indicators.rsi}
                      onChange={(e) => setIndicators({ ...indicators, rsi: e.target.checked })}
                      className="rounded bg-[#16161c] border-white/10 text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                      Volume Bars
                    </span>
                    <input
                      type="checkbox"
                      checked={indicators.volume}
                      onChange={(e) => setIndicators({ ...indicators, volume: e.target.checked })}
                      className="rounded bg-[#16161c] border-white/10 text-emerald-500 focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Timeframe Selector Buttons */}
          <div className="flex items-center bg-[#16161c] p-0.5 rounded-md border border-white/10 text-xs">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div ref={containerRef} className="relative w-full mt-3 select-none">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-2 text-emerald-400 text-sm font-medium">
              <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Fetching real-time market data...</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + (indicators.rsi ? subChartHeight : 0)}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Area Gradient */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
            </linearGradient>

            {/* Grid Line Pattern */}
            <pattern id="grid" width="100" height="40" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={usableWidth}
            height={usableHeight}
            fill="url(#grid)"
            opacity="0.8"
          />

          {/* Horizontal Price Grid Lines & Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const price = minPrice + (1 - pct) * priceRange;
            const y = padding.top + pct * usableHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + usableWidth}
                  y2={y}
                  stroke="white"
                  strokeDasharray="3 3"
                  strokeWidth="0.5"
                  strokeOpacity="0.08"
                />
                <text
                  x={padding.left + usableWidth + 8}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  ${price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume Bars */}
          {indicators.volume &&
            enrichedData.map((d, i) => {
              const x = getX(i) - candleWidth / 2;
              const y = getVolY(d.volume);
              const h = padding.top + usableHeight - y;
              const isUp = d.close >= d.open;

              return (
                <rect
                  key={`vol-${i}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={h}
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  opacity="0.22"
                />
              );
            })}

          {/* Bollinger Bands Fill */}
          {indicators.bollinger && bbUpperPath && bbLowerPath && (
            <path
              d={`${bbUpperPath} L ${linePath.split('L').slice(1).reverse().join('L')}`}
              fill="#3b82f6"
              opacity="0.05"
            />
          )}

          {/* Chart Rendering: Area or Candlesticks */}
          {chartType === 'area' ? (
            <>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path d={linePath} fill="none" stroke={isPositive ? '#10b981' : '#f43f5e'} strokeWidth="2" />
            </>
          ) : (
            // Candlesticks (OHLC)
            enrichedData.map((d, i) => {
              const x = getX(i);
              const isUp = d.close >= d.open;
              const highY = getY(d.high);
              const lowY = getY(d.low);
              const openY = getY(d.open);
              const closeY = getY(d.close);
              const topY = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

              const color = isUp ? '#10b981' : '#f43f5e';

              return (
                <g key={`candle-${i}`}>
                  {/* Wick */}
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.2" />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={topY}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          )}

          {/* Overlays: SMA 20, SMA 50, EMA 20, Bollinger */}
          {indicators.sma20 && sma20Path && (
            <path d={sma20Path} fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.85" />
          )}
          {indicators.sma50 && sma50Path && (
            <path d={sma50Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.85" />
          )}
          {indicators.ema20 && ema20Path && (
            <path d={ema20Path} fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.85" />
          )}
          {indicators.bollinger && (
            <>
              <path d={bbUpperPath} fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
              <path d={bbMiddlePath} fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.5" />
              <path d={bbLowerPath} fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
            </>
          )}

          {/* Active Position Cost Basis Line */}
          {activePosition && (
            <g>
              <line
                x1={padding.left}
                y1={getY(activePosition.avgEntryPrice)}
                x2={padding.left + usableWidth}
                y2={getY(activePosition.avgEntryPrice)}
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.9"
              />
              <rect
                x={padding.left + usableWidth - 110}
                y={getY(activePosition.avgEntryPrice) - 10}
                width="105"
                height="18"
                rx="4"
                fill="#1e293b"
                stroke="#64748b"
                strokeWidth="1"
              />
              <text
                x={padding.left + usableWidth - 58}
                y={getY(activePosition.avgEntryPrice) + 3}
                fill="#f8fafc"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                Avg Cost: ${activePosition.avgEntryPrice.toFixed(2)}
              </text>
            </g>
          )}

          {/* RSI Sub-Chart */}
          {indicators.rsi && (
            <g transform={`translate(0, ${chartHeight})`}>
              {/* Divider */}
              <line x1={padding.left} y1="0" x2={padding.left + usableWidth} y2="0" stroke="#334155" strokeWidth="1" />

              {/* Background */}
              <rect
                x={padding.left}
                y="10"
                width={usableWidth}
                height={subChartHeight - 20}
                fill="#0f172a"
                opacity="0.6"
              />

              {/* 70 & 30 Lines */}
              <line
                x1={padding.left}
                y1={15 + (subChartHeight - 35) * 0.3}
                x2={padding.left + usableWidth}
                y2={15 + (subChartHeight - 35) * 0.3}
                stroke="#f43f5e"
                strokeDasharray="2 2"
                strokeWidth="0.8"
                opacity="0.6"
              />
              <text
                x={padding.left + usableWidth + 8}
                y={15 + (subChartHeight - 35) * 0.3 + 3}
                fill="#f43f5e"
                fontSize="9"
                fontFamily="monospace"
              >
                70
              </text>

              <line
                x1={padding.left}
                y1={15 + (subChartHeight - 35) * 0.7}
                x2={padding.left + usableWidth}
                y2={15 + (subChartHeight - 35) * 0.7}
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth="0.8"
                opacity="0.6"
              />
              <text
                x={padding.left + usableWidth + 8}
                y={15 + (subChartHeight - 35) * 0.7 + 3}
                fill="#10b981"
                fontSize="9"
                fontFamily="monospace"
              >
                30
              </text>

              {/* RSI Line */}
              {rsiPath && <path d={rsiPath} fill="none" stroke="#10b981" strokeWidth="1.6" />}

              {/* Sub-chart Label */}
              <text x={padding.left + 8} y="22" fill="#94a3b8" fontSize="10" fontWeight="bold">
                RSI (14):{' '}
                <tspan fill="#38bdf8" fontFamily="monospace">
                  {(activePoint?.rsi ?? 50).toFixed(1)}
                </tspan>
              </text>
            </g>
          )}

          {/* Interactive Crosshair & Cursor HUD */}
          {hoverPos && (
            <g>
              {/* Vertical Line */}
              <line
                x1={hoverPos.x}
                y1={padding.top}
                x2={hoverPos.x}
                y2={chartHeight + (indicators.rsi ? subChartHeight : 0) - 10}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Horizontal Line on Main Chart */}
              {hoverPos.y <= chartHeight && (
                <line
                  x1={padding.left}
                  y1={hoverPos.y}
                  x2={padding.left + usableWidth}
                  y2={hoverPos.y}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              )}

              {/* Pinned Time Stamp Tag at Bottom */}
              <rect
                x={hoverPos.x - 45}
                y={chartHeight + (indicators.rsi ? subChartHeight : 0) - 18}
                width="90"
                height="18"
                rx="3"
                fill="#0f172a"
                stroke="#475569"
                strokeWidth="1"
              />
              <text
                x={hoverPos.x}
                y={chartHeight + (indicators.rsi ? subChartHeight : 0) - 5}
                fill="#f8fafc"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {hoveredPoint?.dateStr || ''}
              </text>
            </g>
          )}
        </svg>

        {/* Indicator Legend Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-slate-400">
          {indicators.sma20 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              SMA 20: ${(activePoint?.sma20 ?? 0).toFixed(2)}
            </span>
          )}
          {indicators.sma50 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              SMA 50: ${(activePoint?.sma50 ?? 0).toFixed(2)}
            </span>
          )}
          {indicators.ema20 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              EMA 20: ${(activePoint?.ema20 ?? 0).toFixed(2)}
            </span>
          )}
          {indicators.bollinger && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              BB Upper: ${(activePoint?.bbUpper ?? 0).toFixed(2)} | Lower: ${(activePoint?.bbLower ?? 0).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
