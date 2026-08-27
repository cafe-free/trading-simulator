import { Candle } from './types';

export interface IndicatorDataPoint {
  time: number;
  dateStr?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  ema20?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
}

export function calculateSMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  const multiplier = 2 / (period + 1);
  let previousEMA: number | undefined = undefined;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[j];
      }
      previousEMA = sum / period;
      result.push(previousEMA);
    } else {
      const prev: number = previousEMA as number;
      const currentEMA: number = (data[i] - prev) * multiplier + prev;
      previousEMA = currentEMA;
      result.push(currentEMA);
    }
  }
  return result;
}

export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: (number | undefined)[]; middle: (number | undefined)[]; lower: (number | undefined)[] } {
  const sma = calculateSMA(data, period);
  const upper: (number | undefined)[] = [];
  const middle: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < data.length; i++) {
    const ma = sma[i];
    if (ma === undefined) {
      upper.push(undefined);
      middle.push(undefined);
      lower.push(undefined);
    } else {
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(data[i - j] - ma, 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);
      middle.push(ma);
      upper.push(ma + stdDev * stdDevMultiplier);
      lower.push(ma - stdDev * stdDevMultiplier);
    }
  }
  return { upper, middle, lower };
}

export function calculateRSI(closes: number[], period: number = 14): (number | undefined)[] {
  const rsi: (number | undefined)[] = [];
  if (closes.length <= period) {
    return closes.map(() => undefined);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      rsi.push(undefined);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    } else {
      const diff = closes[i] - closes[i - 1];
      const currentGain = diff > 0 ? diff : 0;
      const currentLoss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
  }
  return rsi;
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: (number | undefined)[]; signal: (number | undefined)[]; hist: (number | undefined)[] } {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | undefined)[] = [];
  for (let i = 0; i < closes.length; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== undefined && s !== undefined) {
      macdLine.push(f - s);
    } else {
      macdLine.push(undefined);
    }
  }

  // Filter valid macd points for signal calculation
  const validMacdIndices: number[] = [];
  const validMacdValues: number[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== undefined) {
      validMacdIndices.push(idx);
      validMacdValues.push(val);
    }
  });

  const signalEMAValues = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | undefined)[] = Array(closes.length).fill(undefined);
  const histLine: (number | undefined)[] = Array(closes.length).fill(undefined);

  validMacdIndices.forEach((origIdx, valIdx) => {
    const sig = signalEMAValues[valIdx];
    signalLine[origIdx] = sig;
    const macdVal = macdLine[origIdx];
    if (macdVal !== undefined && sig !== undefined) {
      histLine[origIdx] = macdVal - sig;
    }
  });

  return { macd: macdLine, signal: signalLine, hist: histLine };
}

export function enrichCandlesWithIndicators(candles: Candle[]): IndicatorDataPoint[] {
  if (!candles || candles.length === 0) return [];
  const closes = candles.map((c) => c.close);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema20 = calculateEMA(closes, 20);
  const bb = calculateBollingerBands(closes, 20, 2);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);

  return candles.map((c, i) => ({
    ...c,
    sma20: sma20[i],
    sma50: sma50[i],
    ema20: ema20[i],
    bbUpper: bb.upper[i],
    bbMiddle: bb.middle[i],
    bbLower: bb.lower[i],
    rsi: rsi[i],
    macd: macd.macd[i],
    macdSignal: macd.signal[i],
    macdHist: macd.hist[i],
  }));
}
