import { randomBytes } from "node:crypto";

/** CUID-compatible lowercase alphanumeric TEXT ids (app-generated). */
export function createId(): string {
  const time = Date.now().toString(36);
  const rand = randomBytes(12).toString("base64url").replace(/[^a-z0-9]/gi, "").slice(0, 16);
  return `c${time}${rand}`.slice(0, 25);
}
