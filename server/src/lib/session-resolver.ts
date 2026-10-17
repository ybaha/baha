import { throwApiError } from "./api-error.js";
import type { SessionResolver } from "../rpc/context.js";

export function createMemoizedSessionResolver(
  resolver: SessionResolver,
): SessionResolver {
  let lookup: Promise<Awaited<ReturnType<SessionResolver>>> | null = null;
  return (headers, responseHeaders) => {
    lookup ??= Promise.resolve()
      .then(() => resolver(headers, responseHeaders))
      .catch(() => {
      console.error("Session lookup unavailable");
      throwApiError("UNAVAILABLE", "Session lookup failed.", {
        message: "Session lookup failed.",
      });
    });
    return lookup;
  };
}
