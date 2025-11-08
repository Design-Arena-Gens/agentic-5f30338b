import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeSignal } from '@/lib/metaTrader';

const schema = z.object({
  symbol: z.string(),
  action: z.enum(['BUY', 'SELL', 'HOLD']),
  takeProfit: z.number(),
  stopLoss: z.number(),
  confidence: z.number(),
  timestamp: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = schema.parse(payload);
    const ticket = await executeSignal({
      ...parsed,
      timestamp: parsed.timestamp ?? new Date().toISOString()
    });
    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json(
      {
        ticket: null,
        error: 'Execution fallback - check MetaTrader bridge credentials.'
      },
      { status: 200 }
    );
  }
}
