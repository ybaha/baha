import type { VisitNotifyInputDto, VisitNotifyResultDto } from "@baha/contracts";
import { randomUUID } from "node:crypto";
import { sanitizeVisitField as sanitizeField, sanitizeVisitPayload, sanitizeVisitUrl } from "./visit-data.js";
import type { VisitNotificationStatus, VisitRecorder } from "./visit-records.js";

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
  recorder?: VisitRecorder;
  events?: VisitEventStore;
};

const DEFAULT_CHAT_ID = "1912767327";

function pageAddress(value?: string): string | undefined {
  return sanitizeVisitUrl(value)?.slice(0, 700);
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

export class TelegramDeliveryError extends Error {
  constructor(readonly failureCode: string) {
    super("Telegram notification failed");
  }
}

export async function sendTelegramVisit(
  deps: VisitsServiceDeps,
  message: string,
): Promise<"sent" | "disabled"> {
  if (deps.nodeEnv !== "production" || !deps.botToken?.trim()) {
    return "disabled";
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
    throw new TelegramDeliveryError(`telegram_http_${response.status}`);
  }
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    throw new TelegramDeliveryError("telegram_rejected");
  }
  return "sent";
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

export type VisitEventStore = Map<string, {
  until: number;
  pending: boolean;
  failed: boolean;
  recovery: { attemptId?: string };
  result: Promise<VisitNotifyResultDto>;
}>;

export function createVisitEventStore(): VisitEventStore {
  return new Map();
}

export async function notifyVisit(
  deps: VisitsServiceDeps,
  payload: VisitNotifyInputDto,
  trustedIp: string,
  dedupe: VisitDedupeStore,
  event?: { id: string; encrypted: boolean },
): Promise<VisitNotifyResultDto> {
  if (deps.nodeEnv !== "production") {
    return { status: "ok", delivery: "disabled", stored: false };
  }
  const receivedAt = deps.now?.() ?? new Date();
  const id = event?.id ?? randomUUID();
  const events = deps.events;
  if (events) {
    for (const [key, entry] of events) {
      if (entry.until <= receivedAt.getTime()) events.delete(key);
    }
  }
  const existing = events?.get(id);
  if (existing && (existing.pending || !existing.failed)) return existing.result;
  const recovery: { attemptId?: string } = existing?.recovery ?? {};
  if (events && events.size >= 1000) {
    // Cache capacity is not a visit limit; DB uniqueness remains the durable guard.
    const completed = [...events].find(([, entry]) => !entry.pending && !entry.recovery.attemptId);
    if (completed) events.delete(completed[0]);
  }
  const result = processVisit(deps, sanitizeVisitPayload(payload), trustedIp, dedupe, {
    id, receivedAt, encrypted: event?.encrypted ?? false, recovery,
  });
  const entry = {
    until: receivedAt.getTime() + 300_000, pending: true, failed: false, recovery, result,
  };
  if (events && (events.size < 1000 || events.has(id))) events.set(id, entry);
  const outcome = await result;
  entry.pending = false;
  entry.failed = outcome.delivery === "failed";
  if (!entry.failed) recovery.attemptId = undefined;
  return outcome;
}

async function processVisit(
  deps: VisitsServiceDeps,
  payload: VisitNotifyInputDto,
  trustedIp: string,
  dedupe: VisitDedupeStore,
  event: { id: string; receivedAt: Date; encrypted: boolean; recovery: { attemptId?: string } },
): Promise<VisitNotifyResultDto> {
  const attemptId = randomUUID();
  let stored = false;
  try {
    if (deps.recorder) {
      const inserted = await deps.recorder.record({
        id: event.id, attemptId, receivedAt: event.receivedAt, encrypted: event.encrypted, payload, trustedIp,
      });
      stored = true;
      if (!inserted && !await deps.recorder.retryFailed(event.id, attemptId, event.recovery.attemptId)) {
        return { status: "ok", delivery: "deduplicated", stored };
      }
    }
  } catch {
    console.error("Visit history write failed; continuing notification delivery");
  }

  const updateStatus = async (status: VisitNotificationStatus, failureCode?: string) => {
    if (!stored || !deps.recorder) return true;
    try {
      await deps.recorder.setNotificationStatus(event.id, attemptId, status, deps.now?.() ?? new Date(), failureCode);
      return true;
    } catch {
      console.error("Visit notification status could not be saved");
      return false;
    }
  };

  if (!deps.botToken?.trim()) {
    await updateStatus("skipped", "telegram_not_configured");
    return { status: "ok", delivery: "disabled", stored };
  }
  if (!allowVisit(dedupe, trustedIp, event.receivedAt.getTime())) {
    await updateStatus("deduplicated");
    return { status: "ok", delivery: "deduplicated", stored };
  }
  try {
    await sendTelegramVisit(deps, formatVisitMessage(payload, trustedIp, event.receivedAt));
  } catch (error) {
    const failureCode = error instanceof TelegramDeliveryError ? error.failureCode : "telegram_transport_failed";
    console.error(`Visit notification could not be delivered (${failureCode})`);
    dedupe.delete(trustedIp);
    // Only this process knows a pending row is safe to retry after its failed status write.
    event.recovery.attemptId = await updateStatus("failed", failureCode) ? undefined : attemptId;
    return { status: "ok", delivery: "failed", stored };
  }
  await updateStatus("sent");
  return { status: "ok", delivery: "sent", stored };
}
