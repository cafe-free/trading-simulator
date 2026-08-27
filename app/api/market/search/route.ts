import { NextRequest, NextResponse } from 'next/server';
import { POPULAR_SYMBOLS } from '@/lib/market-data-service';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || '';
  const cleanQ = query.trim().toUpperCase();

  if (!cleanQ) {
    return NextResponse.json({ results: POPULAR_SYMBOLS.slice(0, 10) });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQ)}&quotesCount=8&newsCount=0`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      const quotes = data.quotes || [];
      const results = quotes
        .filter((q: { symbol?: string; quoteType?: string }) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'INDEX'))
        .map((q: { symbol: string; shortname?: string; longname?: string; quoteType: string; exchange?: string }) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          type: q.quoteType === 'CRYPTOCURRENCY' ? 'crypto' : (q.quoteType === 'ETF' ? 'etf' : 'stock'),
          exchange: q.exchange,
        }));

      if (results.length > 0) {
        return NextResponse.json({ results });
      }
    }
  } catch {
    // fallback to local filter
  }

  const localMatches = POPULAR_SYMBOLS.filter(
    (item) => item.symbol.toUpperCase().includes(cleanQ) || item.name.toUpperCase().includes(cleanQ)
  );

  if (localMatches.length === 0 && cleanQ.length >= 1) {
    localMatches.push({
      symbol: cleanQ,
      name: `${cleanQ} Custom Asset`,
      type: cleanQ.includes('-USD') ? 'crypto' : 'stock',
      basePrice: 100,
    });
  }

  return NextResponse.json({ results: localMatches });
}
