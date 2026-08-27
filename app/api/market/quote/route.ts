import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveQuote, POPULAR_SYMBOLS } from '@/lib/market-data-service';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');

  try {
    if (symbols) {
      const symbolList = symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      const quotes = await Promise.all(symbolList.map((sym) => fetchLiveQuote(sym)));
      return NextResponse.json({ quotes });
    }

    if (symbol) {
      const quote = await fetchLiveQuote(symbol);
      return NextResponse.json({ quote });
    }

    // Default: Return all popular symbols
    const quotes = await Promise.all(POPULAR_SYMBOLS.map((item) => fetchLiveQuote(item.symbol)));
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Quote fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
