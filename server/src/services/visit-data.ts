import type { VisitNotifyInputDto } from "@baha/contracts";

// eslint-disable-next-line no-control-regex -- Untrusted controls must not reach storage or Telegram.
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;

export function sanitizeVisitField(value: string, max: number): string {
  return value.replace(CONTROL_CHARS, " ").slice(0, max);
}

export function sanitizeVisitUrl(value?: string): string | undefined {
  if (value === undefined) return undefined;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    const safe = `${url.origin}${url.pathname}`;
    return sanitizeVisitField(safe, 2048);
  } catch {
    return undefined;
  }
}

export function sanitizeVisitPayload(payload: VisitNotifyInputDto): VisitNotifyInputDto {
  const sanitized: VisitNotifyInputDto = {
    ip: sanitizeVisitField(payload.ip, 200),
    city: sanitizeVisitField(payload.city, 200),
    region: sanitizeVisitField(payload.region, 200),
    country: sanitizeVisitField(payload.country, 200),
    location: sanitizeVisitField(payload.location, 200),
    userAgent: sanitizeVisitField(payload.userAgent, 1024),
    platform: sanitizeVisitField(payload.platform, 200),
    language: sanitizeVisitField(payload.language, 200),
    vendor: sanitizeVisitField(payload.vendor, 200),
    screenResolution: sanitizeVisitField(payload.screenResolution, 200),
    windowSize: sanitizeVisitField(payload.windowSize, 200),
    timestamp: payload.timestamp,
  };

  const pageUrl = sanitizeVisitUrl(payload.pageUrl);
  if (pageUrl !== undefined) sanitized.pageUrl = pageUrl;

  const referrer = sanitizeVisitUrl(payload.referrer);
  if (referrer !== undefined) sanitized.referrer = referrer;

  if (payload.pageTitle !== undefined) {
    sanitized.pageTitle = sanitizeVisitField(payload.pageTitle, 200);
  }
  if (payload.timezone !== undefined) {
    sanitized.timezone = sanitizeVisitField(payload.timezone, 100);
  }
  if (payload.organization !== undefined) {
    sanitized.organization = sanitizeVisitField(payload.organization, 200);
  }
  if (payload.postalCode !== undefined) {
    sanitized.postalCode = sanitizeVisitField(payload.postalCode, 100);
  }

  return sanitized;
}
