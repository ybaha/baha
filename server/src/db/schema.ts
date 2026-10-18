import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email"),
    emailVerified: timestamp("emailVerified", { precision: 3, mode: "date" }),
    authEmailVerified: boolean("authEmailVerified").notNull().default(false),
    authCreatedAt: timestamp("authCreatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    authUpdatedAt: timestamp("authUpdatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    image: text("image"),
  },
  (table) => [uniqueIndex("User_email_key").on(table.email)],
);

export const accounts = pgTable(
  "Account",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("Account_provider_providerAccountId_key").on(
      table.provider,
      table.providerAccountId,
    ),
    foreignKey({
      name: "Account_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const sessions = pgTable(
  "Session",
  {
    id: text("id").primaryKey(),
    sessionToken: text("sessionToken").notNull(),
    userId: text("userId").notNull(),
    expires: timestamp("expires", { precision: 3, mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("Session_sessionToken_key").on(table.sessionToken),
    foreignKey({
      name: "Session_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const authAccounts = pgTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      precision: 3,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      precision: 3,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_account_providerId_accountId_key").on(
      table.providerId,
      table.accountId,
    ),
    index("auth_account_userId_idx").on(table.userId),
    foreignKey({
      name: "auth_account_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const authSessions = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    userId: text("userId").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_session_token_key").on(table.token),
    index("auth_session_userId_idx").on(table.userId),
    foreignKey({
      name: "auth_session_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const authVerifications = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)],
);

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { precision: 3, mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("VerificationToken_token_key").on(table.token),
    uniqueIndex("VerificationToken_identifier_token_key").on(
      table.identifier,
      table.token,
    ),
  ],
);

export const comments = pgTable(
  "Comment",
  {
    id: text("id").primaryKey(),
    text: text("text").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
    postSlug: text("postSlug").notNull(),
    userId: text("userId").notNull(),
  },
  (table) => [
    index("Comment_postSlug_idx").on(table.postSlug),
    foreignKey({
      name: "Comment_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const votes = pgTable(
  "Vote",
  {
    id: text("id").primaryKey(),
    value: integer("value").notNull().default(1),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
    userId: text("userId").notNull(),
    commentId: text("commentId").notNull(),
  },
  (table) => [
    uniqueIndex("Vote_userId_commentId_key").on(table.userId, table.commentId),
    foreignKey({
      name: "Vote_commentId_fkey",
      columns: [table.commentId],
      foreignColumns: [comments.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      name: "Vote_userId_fkey",
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const postViews = pgTable(
  "PostView",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    count: integer("count").notNull().default(1),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("PostView_slug_key").on(table.slug)],
);

export const visits = pgTable(
  "Visit",
  {
    id: text("id").primaryKey(),
    receivedAt: timestamp("receivedAt", { withTimezone: true, mode: "date" }).notNull(),
    visitedAt: timestamp("visitedAt", { withTimezone: true, mode: "date" }).notNull(),
    trustedIp: text("trustedIp").notNull(),
    reportedIp: text("reportedIp").notNull(),
    pageUrl: text("pageUrl"),
    referrer: text("referrer"),
    pageTitle: text("pageTitle"),
    city: text("city"),
    region: text("region"),
    country: text("country"),
    location: text("location"),
    postalCode: text("postalCode"),
    organization: text("organization"),
    userAgent: text("userAgent"),
    platform: text("platform"),
    language: text("language"),
    vendor: text("vendor"),
    screenResolution: text("screenResolution"),
    windowSize: text("windowSize"),
    timezone: text("timezone"),
    encrypted: boolean("encrypted").notNull(),
    notificationStatus: text("notificationStatus").notNull().default("pending"),
    notificationAttemptId: text("notificationAttemptId").notNull(),
    notifiedAt: timestamp("notifiedAt", { withTimezone: true, mode: "date" }),
    failureCode: text("failureCode"),
  },
  (table) => [
    index("Visit_receivedAt_idx").on(table.receivedAt),
    index("Visit_notificationStatus_receivedAt_idx").on(
      table.notificationStatus,
      table.receivedAt,
    ),
  ],
);

export const betterAuthDrizzleSchema = {
  user: users,
  account: authAccounts,
  session: authSessions,
  verification: authVerifications,
};

export const betterAuthUserFieldMap = {
  emailVerified: "authEmailVerified",
  createdAt: "authCreatedAt",
  updatedAt: "authUpdatedAt",
} as const;

export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  authAccounts,
  authSessions,
  authVerifications,
  comments,
  votes,
  postViews,
  visits,
};

export type DatabaseSchema = typeof schema;
