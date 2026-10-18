import type { VisitNotifyInputDto, VisitNotifyResultDto } from "@baha/contracts";
import { api } from "@/lib/api";
import { encryptVisit } from "@/lib/visit-crypto";

/** Keep one event ID across retries so history and alerts remain idempotent. */
export async function notifyEncryptedVisit(payload: VisitNotifyInputDto): Promise<VisitNotifyResultDto> {
  const eventId = crypto.randomUUID();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Fetch again on retry to handle server key rotation without plaintext fallback.
      const key = await api.visits.publicKey({});
      const envelope = await encryptVisit(payload, key, eventId);
      const result = await api.visits.notifyEncrypted(envelope);
      if (result.delivery === "failed") throw new Error("Visit notification delivery failed.");
      if (result.delivery === "disabled") {
        console.warn("Visit notifications are disabled on the API.");
      }
      return result;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 500 : 1500));
    }
  }
  throw new Error("Visit notification could not be sent.");
}
