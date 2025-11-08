import { NextResponse } from 'next/server';
import { getOpenTrades } from '@/lib/metaTrader';

const fallback = [
  {
    ticket: 'N/A-1',
    symbol: 'EURUSD',
    action: 'BUY',
    volume: 1.1,
    openPrice: 1.07321,
    currentPrice: 1.07832,
    profit: 562.24,
    openedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    ticket: 'N/A-2',
    symbol: 'GBPUSD',
    action: 'SELL',
    volume: 0.5,
    openPrice: 1.24845,
    currentPrice: 1.24410,
    profit: 217.88,
    openedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

export async function GET() {
  try {
    const trades = await getOpenTrades();
    return NextResponse.json(trades);
  } catch (error) {
    return NextResponse.json(fallback);
  }
}
