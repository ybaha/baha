-- checkpoint C1: additive Better Auth data plane (User columns + auth_* tables)
DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    WHERE btrim(id) = ''
      OR name IS NULL
      OR btrim(name) = ''
      OR email IS NULL
      OR btrim(email) = ''
  ) THEN
    RAISE EXCEPTION 'better_auth_preflight: user missing non-empty name and email';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "User" WHERE email IS DISTINCT FROM btrim(email)
  ) THEN
    RAISE EXCEPTION 'better_auth_preflight: email is not trimmed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "User" WHERE email <> lower(email)
  ) THEN
    RAISE EXCEPTION 'better_auth_preflight: email is not lowercase-normalized';
  END IF;

  IF EXISTS (
    SELECT email, count(*) AS c
    FROM "User"
    GROUP BY email
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'better_auth_preflight: duplicate user emails';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Account" a
    LEFT JOIN "User" u ON u.id = a."userId"
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'better_auth_preflight: dangling legacy account';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Account"
    WHERE type <> 'oauth'
      OR provider NOT IN ('github', 'google')
      OR btrim(id) = ''
      OR btrim("providerAccountId") = ''
  ) THEN
    RAISE EXCEPTION 'better_auth_preflight: unsupported legacy account provider';
  END IF;
END
$preflight$;
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "authEmailVerified" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "authCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "authUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
UPDATE "User"
SET
  "authEmailVerified" = ("emailVerified" IS NOT NULL),
  "authCreatedAt" = CURRENT_TIMESTAMP,
  "authUpdatedAt" = CURRENT_TIMESTAMP;
--> statement-breakpoint
CREATE TABLE "auth_account" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_account_pkey" PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_providerId_accountId_key" ON "auth_account" ("providerId", "accountId");
--> statement-breakpoint
CREATE INDEX "auth_account_userId_idx" ON "auth_account" ("userId");
--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
CREATE TABLE "auth_session" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_session_token_key" ON "auth_session" ("token");
--> statement-breakpoint
CREATE INDEX "auth_session_userId_idx" ON "auth_session" ("userId");
--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
CREATE TABLE "auth_verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_verification_pkey" PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification" ("identifier");
--> statement-breakpoint
INSERT INTO "auth_account" (
  "id",
  "accountId",
  "providerId",
  "userId",
  "accessToken",
  "refreshToken",
  "idToken",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "scope",
  "password",
  "createdAt",
  "updatedAt"
)
SELECT
  a.id,
  a."providerAccountId",
  a.provider,
  a."userId",
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Account" a
WHERE a.type = 'oauth'
  AND a.provider IN ('github', 'google');
