import type { ServerEnv } from "../env.js";

export function isAllowedReadOrigin(env: ServerEnv, origin: string | null): boolean {
  if (!origin) return false;
  if (env.readOrigins.has(origin)) return true;
  if (env.previewReadOrigins.has(origin)) return true;
  return false;
}

export function isAllowedWriteOrigin(env: ServerEnv, origin: string | null): boolean {
  if (!origin) return false;
  return env.writeOrigins.has(origin);
}

export function isPreviewReadOrigin(env: ServerEnv, origin: string | null): boolean {
  if (!origin) return false;
  // Only write-authorized application origins may receive session-personalized reads.
  return isAllowedReadOrigin(env, origin) && !env.writeOrigins.has(origin);
}
