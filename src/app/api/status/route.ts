import { sendTelegramMessage } from '@/lib/sendTelegramMessage';

const MAX_BODY_BYTES = 8192;
const recentVisits = new Map<string, number>();

// Best-effort per-instance protection against duplicate/spam notifications.
function allowVisit(ip: string): boolean {
  const now = Date.now();
  for (const [key, until] of recentVisits) {
    if (until <= now) recentVisits.delete(key);
  }
  if (recentVisits.has(ip) || recentVisits.size >= 1000) return false;
  recentVisits.set(ip, now + 60_000);
  return true;
}

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error('Body too large');
      chunks.push(value);
    }
    const payload: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid payload');
    }
    return payload as Record<string, unknown>;
  } finally {
    if (size > MAX_BODY_BYTES) await reader.cancel();
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({ error: 'Expected JSON' }, { status: 415 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await readPayload(request);
  } catch {
    return Response.json({ error: 'Invalid visit payload' }, { status: 400 });
  }

  const fields = [
    'ip', 'city', 'region', 'country', 'location', 'userAgent', 'platform',
    'language', 'vendor', 'screenResolution', 'windowSize', 'timestamp',
  ] as const;
  if (fields.some((key) => typeof payload[key] !== 'string')) {
    return Response.json({ error: 'Invalid visit payload' }, { status: 400 });
  }
  const timestamp = new Date(payload.timestamp as string);
  if (!Number.isFinite(timestamp.getTime())) {
    return Response.json({ error: 'Invalid timestamp' }, { status: 400 });
  }

  // Use the hosting proxy's address for throttling, never the supplied body IP.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (!allowVisit(ip)) return Response.json({ status: 'ok' });

  const text = (key: typeof fields[number]) =>
    (payload[key] as string).replace(/[\r\n]/g, ' ').slice(0, key === 'userAgent' ? 1024 : 200);
  const message = `
📱 New Visit (${timestamp.toLocaleString()}):
🌍 Location: ${text('city')}, ${text('region')}, ${text('country')}
📍 Coordinates: ${text('location')}
🔍 IP: ${text('ip')}

💻 Device:
• Platform: ${text('platform')}
• Language: ${text('language')}
• Screen: ${text('screenResolution')}
• Window: ${text('windowSize')}
• Vendor: ${text('vendor')}

🔎 UA: ${text('userAgent')}
  `.trim();

  try {
    await sendTelegramMessage(message);
  } catch {
    // Never log the bot URL/token, visitor details, or upstream error object.
    console.error('Visit notification could not be delivered');
    recentVisits.delete(ip);
  }
  return Response.json({ status: 'ok' });
}
