import { NextResponse } from 'next/server';
import { getAccountMetrics } from '@/lib/metaTrader';

const fallback = {
  balance: 100000,
  equity: 100420,
  dailyReturnPct: 1.8,
  winRate: 68,
  maxDrawdownPct: 4.2
};

export async function GET() {
  try {
    const metrics = await getAccountMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(fallback);
  }
}
