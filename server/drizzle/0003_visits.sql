CREATE TABLE "Visit" (
  "id" TEXT NOT NULL,
  "receivedAt" TIMESTAMPTZ NOT NULL,
  "visitedAt" TIMESTAMPTZ NOT NULL,
  "trustedIp" TEXT NOT NULL,
  "reportedIp" TEXT NOT NULL,
  "pageUrl" TEXT,
  "referrer" TEXT,
  "pageTitle" TEXT,
  "city" TEXT,
  "region" TEXT,
  "country" TEXT,
  "location" TEXT,
  "postalCode" TEXT,
  "organization" TEXT,
  "userAgent" TEXT,
  "platform" TEXT,
  "language" TEXT,
  "vendor" TEXT,
  "screenResolution" TEXT,
  "windowSize" TEXT,
  "timezone" TEXT,
  "encrypted" boolean NOT NULL,
  "notificationStatus" TEXT NOT NULL DEFAULT 'pending',
  "notificationAttemptId" TEXT NOT NULL,
  "notifiedAt" TIMESTAMPTZ,
  "failureCode" TEXT,
  CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE INDEX "Visit_receivedAt_idx" ON "Visit" ("receivedAt");
--> statement-breakpoint
CREATE INDEX "Visit_notificationStatus_receivedAt_idx" ON "Visit" ("notificationStatus", "receivedAt");
