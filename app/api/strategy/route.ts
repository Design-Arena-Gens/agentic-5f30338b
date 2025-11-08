import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStrategy, updateStrategy } from '@/lib/state';

const schema = z.object({
  shortWindow: z.number().min(4).max(48),
  longWindow: z.number().min(12).max(240),
  riskReward: z.number().min(1).max(5),
  maxConcurrentPositions: z.number().min(1).max(20),
  riskPerTradePct: z.number().min(0.1).max(5)
});

export async function GET() {
  return NextResponse.json(getStrategy());
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = schema.parse(payload);
    updateStrategy(parsed);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid strategy payload' }, { status: 400 });
  }
}
