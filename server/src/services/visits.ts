import type { VisitNotifyInputDto, VisitNotifyResultDto } from "@baha/contracts";

export type TelegramTransport = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export type VisitsServiceDeps = {
  nodeEnv: string;
  botToken?: string;
  chatId?: string;
  transport: TelegramTransport;
  now?: () => Date;
};

const DEFAULT_CHAT_ID = "1912767327";

function sanitizeField(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ").slice(0, max);
}

function pageAddress(value?: string): string | undefined {
  try {
    const url = new URL(value ?? "");
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    // Query strings and fragments can contain tokens, emails or private search terms.
    return sanitizeField(`${url.origin}${url.pathname}`, 700);
  } catch {
    return undefined;
  }
}

function describeBrowser(userAgent: string): string {
  for (const [pattern, name] of [
    [/(?:Edg|EdgA|EdgiOS)\/([\d.]+)/, "Edge"],
    [/(?:OPR|OPiOS)\/([\d.]+)/, "Opera"],
    [/(?:Firefox|FxiOS)\/([\d.]+)/, "Firefox"],
    [/(?:Chrome|CriOS)\/([\d.]+)/, "Chrome"],
    [/Version\/([\d.]+).*Safari\//, "Safari"],
  ] as const) {
    const match = userAgent.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  return "Unknown browser";
}

function describeDevice(userAgent: string, platform: string): string {
  if (/bot\b|crawler|spider|headless/i.test(userAgent)) return "Bot / automation (inferred)";
  if (/iPad/i.test(userAgent)) return "iPad / tablet";
  if (/iPhone|iPod/i.test(userAgent)) return "iPhone / mobile";
  if (/Android/i.test(userAgent)) return /Mobile/i.test(userAgent) ? "Android / mobile" : "Android / tablet";
  if (/Windows/i.test(userAgent)) return "Windows / desktop";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac / desktop";
  if (/Linux/i.test(userAgent)) return "Linux / desktop";
  return platform || "Unknown device";
}

function mapAddress(location: string): string | undefined {
  const parts = location.split(",").map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => !part)) return undefined;
  const [latitude, longitude] = parts.map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function formatVisitMessage(
  payload: VisitNotifyInputDto,
  trustedIp?: string,
  receivedAt?: Date,
): string {
  const timestamp = new Date(payload.timestamp);
  const text = (key: keyof VisitNotifyInputDto, max = 200) => {
    const value = sanitizeField(String(payload[key] ?? ""), max).trim();
    return value || "Unknown";
  };
  let visitorTime = "Unknown";
  if (payload.timezone) {
    try {
      visitorTime = `${timestamp.toLocaleString("en-GB", { timeZone: payload.timezone, hour12: false })} (${text("timezone", 100)})`;
    } catch {
      // Invalid or unsupported visitor time zones must not prevent delivery.
    }
  }
  const map = mapAddress(payload.location);
  const reportedIp = text("ip");
  const serverIp = trustedIp ? sanitizeField(trustedIp, 200) : undefined;
  return [
    "📱 New Visit",
    "",
    `🔗 Page: ${pageAddress(payload.pageUrl) ?? "Not provided (older client)"}`,
    `📄 Title: ${text("pageTitle", 160)}`,
    `↪️ Referrer: ${pageAddress(payload.referrer) ?? "Direct / not shared"}`,
    ...(receivedAt ? [`📨 Received (UTC, server): ${receivedAt.toISOString()}`] : []),
    `🕒 Time (UTC, visitor-reported): ${timestamp.toISOString()}`,
    `🕓 Visitor local time: ${visitorTime}`,
    "",
    `🌍 Location (approx.): ${text("city")}, ${text("region")}, ${text("country")}`,
    `📮 Postal code: ${text("postalCode", 100)}`,
    `📍 Coordinates: ${text("location")}`,
    ...(map ? [`🗺 Map: ${map}`] : []),
    `🔍 IP (server): ${serverIp ?? "Unavailable"}`,
    ...(reportedIp !== serverIp ? [`🔎 IP (location lookup): ${reportedIp}`] : []),
    `🌐 Network / ISP (lookup): ${text("organization")}`,
    "",
    "💻 Device (inferred from UA):",
    `• Device: ${sanitizeField(describeDevice(payload.userAgent, payload.platform), 200)}`,
    `• Browser: ${describeBrowser(payload.userAgent)}`,
    `• Platform: ${text("platform")}`,
    `• Language: ${text("language")}`,
    `• Screen: ${text("screenResolution")}`,
    `• Window: ${text("windowSize")}`,
    `• Vendor: ${text("vendor")}`,
    "",
    `🔎 UA: ${text("userAgent", 1024)}`,
  ].join("\n").slice(0, 4000);
}

export async function sendTelegramVisit(
  deps: VisitsServiceDeps,
  message: string,
): Promise<void> {
  if (deps.nodeEnv !== "production" || !deps.botToken) {
    return;
  }
  const chatId = deps.chatId || DEFAULT_CHAT_ID;
  const response = await deps.transport(
    `https://api.telegram.org/bot${deps.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok) {
    throw new Error("Telegram notification failed");
  }
}

export type VisitDedupeStore = Map<string, number>;

export function createVisitDedupeStore(): VisitDedupeStore {
  return new Map();
}

export function allowVisit(
  store: VisitDedupeStore,
  trustedIp: string,
  now = Date.now(),
): boolean {
  for (const [key, until] of store) {
    if (until <= now) store.delete(key);
  }
  if (store.has(trustedIp) || store.size >= 1000) return false;
  store.set(trustedIp, now + 60_000);
  return true;
}

export async function notifyVisit(
  deps: VisitsServiceDeps,
  payload: VisitNotifyInputDto,
  trustedIp: string,
  dedupe: VisitDedupeStore,
): Promise<VisitNotifyResultDto> {
  if (!allowVisit(dedupe, trustedIp)) {
    return { status: "ok" };
  }
  try {
    await sendTelegramVisit(
      deps,
      formatVisitMessage(payload, trustedIp, deps.now?.() ?? new Date()),
    );
  } catch {
    console.error("Visit notification could not be delivered");
    dedupe.delete(trustedIp);
  }
  return { status: "ok" };
}
