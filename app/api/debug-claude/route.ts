import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Reply with just: OK' }],
    });
    return NextResponse.json({
      status: 'ok',
      keyPrefix: key.slice(0, 20) + '...',
      response: msg.content[0],
    });
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      keyPrefix: key.slice(0, 20) + '...',
      error: e.message,
      httpStatus: e.status,
    }, { status: 500 });
  }
}
