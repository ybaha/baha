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
  return value.replace(/[\r\n]/g, " ").slice(0, max);
}

export function formatVisitMessage(payload: VisitNotifyInputDto): string {
  const timestamp = new Date(payload.timestamp);
  const text = (key: keyof VisitNotifyInputDto, max = 200) =>
    sanitizeField(String(payload[key]), key === "userAgent" ? 1024 : max);
  return `
📱 New Visit (${timestamp.toLocaleString()}):
🌍 Location: ${text("city")}, ${text("region")}, ${text("country")}
📍 Coordinates: ${text("location")}
🔍 IP: ${text("ip")}

💻 Device:
• Platform: ${text("platform")}
• Language: ${text("language")}
• Screen: ${text("screenResolution")}
• Window: ${text("windowSize")}
• Vendor: ${text("vendor")}

🔎 UA: ${text("userAgent")}
  `.trim();
}

export async function sendTelegramVisit(
  deps: VisitsServiceDeps,
  message: string,
): Promise<void> {
  if (deps.nodeEnv !== "production" || !deps.botToken) {
    return;
  }
  const chatId = deps.chatId || DEFAULT_CHAT_ID;
  const time = (deps.now?.() ?? new Date()).toLocaleTimeString("tr-TR");
  const response = await deps.transport(
    `https://api.telegram.org/bot${deps.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: `${message}\n${time}` }),
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
    await sendTelegramVisit(deps, formatVisitMessage(payload));
  } catch {
    console.error("Visit notification could not be delivered");
    dedupe.delete(trustedIp);
  }
  return { status: "ok" };
}
