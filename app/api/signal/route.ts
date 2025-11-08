import { NextResponse } from 'next/server';
import { getSignal } from '@/lib/metaTrader';
import { computeSignal } from '@/lib/strategyEngine';
import { getStrategy } from '@/lib/state';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') ?? 'EURUSD';
  try {
    const signal = await getSignal(symbol);
    return NextResponse.json(signal);
  } catch (error) {
    const candles = mockCandles(symbol);
    const signal = computeSignal({ symbol, candles, strategy: getStrategy() });
    return NextResponse.json(signal);
  }
}

function mockCandles(symbol: string) {
  const base = symbol === 'XAUUSD' ? 2300 : 1.08;
  const candles = Array.from({ length: 120 }).map((_, idx) => {
    const drift = Math.sin(idx / 6) * 0.001 + Math.random() * 0.0004;
    const close = base + drift;
    return {
      time: new Date(Date.now() - (120 - idx) * 3600 * 1000).toISOString(),
      open: close - Math.random() * 0.0004,
      high: close + Math.random() * 0.0007,
      low: close - Math.random() * 0.0007,
      close,
      volume: 800 + Math.random() * 200
    };
  });
  return candles;
}
