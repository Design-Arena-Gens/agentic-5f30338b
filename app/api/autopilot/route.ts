import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAutopilotState, setAutopilotState } from '@/lib/state';

const schema = z.object({
  enabled: z.boolean()
});

export async function GET() {
  return NextResponse.json({ enabled: getAutopilotState() });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { enabled } = schema.parse(payload);
    setAutopilotState(enabled);
    return NextResponse.json({ enabled });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid toggle payload' }, { status: 400 });
  }
}
