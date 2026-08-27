import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalData } from '@/lib/market-data-service';
import { TimeRange, ChartInterval } from '@/lib/types';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'AAPL';
  const range = (searchParams.get('range') as TimeRange) || '1M';
  const interval = (searchParams.get('interval') as ChartInterval) || undefined;

  try {
    const result = await fetchHistoricalData(symbol, range, interval);
    return NextResponse.json(result);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
}
