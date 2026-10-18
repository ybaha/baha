import type { VisitNotifyInputDto } from "@baha/contracts";
import { eq } from "drizzle-orm";

import type { AppDatabase } from "../db/client.js";
import { visits } from "../db/schema.js";
import { sanitizeVisitField, sanitizeVisitPayload } from "./visit-data.js";

export type VisitNotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped"
  | "deduplicated";

export interface VisitRecorder {
  record(input: {
    id: string;
    payload: VisitNotifyInputDto;
    trustedIp: string;
    receivedAt: Date;
    encrypted: boolean;
  }): Promise<boolean>;
  setNotificationStatus(
    id: string,
    status: VisitNotificationStatus,
    at: Date,
    failureCode?: string,
  ): Promise<void>;
}

export function createVisitRecorder(db: AppDatabase): VisitRecorder {
  return {
    async record({ id, payload, trustedIp, receivedAt, encrypted }) {
      const sanitized = sanitizeVisitPayload(payload);
      const visitedAt = new Date(sanitized.timestamp);
      if (Number.isNaN(visitedAt.getTime())) {
        throw new Error("Invalid visit timestamp");
      }

      const [row] = await db
        .insert(visits)
        .values({
          id,
          receivedAt,
          visitedAt,
          trustedIp: sanitizeVisitField(trustedIp, 200),
          reportedIp: sanitized.ip,
          pageUrl: sanitized.pageUrl,
          referrer: sanitized.referrer,
          pageTitle: sanitized.pageTitle,
          city: sanitized.city,
          region: sanitized.region,
          country: sanitized.country,
          location: sanitized.location,
          postalCode: sanitized.postalCode,
          organization: sanitized.organization,
          userAgent: sanitized.userAgent,
          platform: sanitized.platform,
          language: sanitized.language,
          vendor: sanitized.vendor,
          screenResolution: sanitized.screenResolution,
          windowSize: sanitized.windowSize,
          timezone: sanitized.timezone,
          encrypted,
        })
        .onConflictDoNothing({ target: visits.id })
        .returning({ id: visits.id });

      return row !== undefined;
    },

    async setNotificationStatus(id, status, at, failureCode) {
      await db
        .update(visits)
        .set({
          notificationStatus: status,
          failureCode: failureCode ?? null,
          ...(status === "sent" ? { notifiedAt: at } : {}),
        })
        .where(eq(visits.id, id));
    },
  };
}
