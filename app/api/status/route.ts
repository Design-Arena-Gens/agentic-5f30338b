import { NextResponse } from 'next/server';
import { getBrokerStatus } from '@/lib/metaTrader';

export async function GET() {
  try {
    const status = await getBrokerStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        accountId: null,
        broker: null,
        lastSync: null
      },
      { status: 200 }
    );
  }
}
