import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import type { AppDatabase } from "./db/client.js";
import {
  betterAuthDrizzleSchema,
  betterAuthUserFieldMap,
} from "./db/schema.js";
import type { AuthConfig } from "./env.js";
import type { SessionResolver, SessionUser } from "./rpc/context.js";

type SiteAuth = ReturnType<typeof createSiteAuth>;
export type AuthRuntime = ReturnType<typeof createAuthRuntime>;

function forwardSetCookieHeaders(source: Headers, target?: Headers): void {
  if (!target) return;
  for (const value of source.getSetCookie()) {
    target.append("set-cookie", value);
  }
}

function mapSessionUser(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): SessionUser {
  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  };
}

export function createAuthSessionResolver(auth: SiteAuth): SessionResolver {
  return async (headers, responseHeaders) => {
    const result = await auth.api.getSession({ headers, returnHeaders: true });
    forwardSetCookieHeaders(result.headers, responseHeaders);
    return result.response?.user ? { user: mapSessionUser(result.response.user) } : null;
  };
}

function createSiteAuth(options: {
  db: AppDatabase;
  config: AuthConfig;
}) {
  const { config } = options;
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseUrl,
    basePath: "/auth",
    trustedOrigins: [...config.trustedOrigins],
    database: drizzleAdapter(options.db, {
      schema: betterAuthDrizzleSchema,
      provider: "pg",
      transaction: true,
    }),
    user: {
      fields: betterAuthUserFieldMap,
    },
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        allowDifferentEmails: false,
        trustedProviders: ["github", "google"],
      },
    },
    session: {
      cookieCache: {
        enabled: false,
      },
    },
    socialProviders: {
      github: {
        clientId: config.githubClientId,
        clientSecret: config.githubClientSecret,
      },
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
      useSecureCookies: config.secureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.secureCookies,
      },
    },
    logger: {
      level: "error",
      log: () => console.error("Authentication operation failed"),
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 120,
    },
  });

}

export function createAuthRuntime(options: Parameters<typeof createSiteAuth>[0]) {
  const auth = createSiteAuth(options);
  return {
    auth,
    handler: auth.handler,
    sessionResolver: createAuthSessionResolver(auth),
  };
}
