import type { AppClient } from "@baha/contracts";
import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";

import { resolveApiOrigin } from "@/lib/api-origin";

const DEFAULT_TIMEOUT_MS = 30_000;

function fetchWithCredentials(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const callerSignal = init?.signal;

  if (callerSignal && typeof AbortSignal.any === "function") {
    const timeoutSignal = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
    return fetch(input, {
      ...init,
      credentials: "include",
      signal: AbortSignal.any([callerSignal, timeoutSignal]),
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const abortFromCaller = () => {
    clearTimeout(timeoutId);
    controller.abort();
  };

  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", abortFromCaller, { once: true });
    }
  }

  return fetch(input, {
    ...init,
    credentials: "include",
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
    if (callerSignal) {
      callerSignal.removeEventListener("abort", abortFromCaller);
    }
  });
}

function createApiClient(): AppClient {
  const link = new RPCLink({
    url: `${resolveApiOrigin()}/rpc`,
    fetch: fetchWithCredentials,
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
  });
  return createORPCClient<AppClient>(link);
}

/** Typed application RPC client. */
export const api: AppClient = createApiClient();

export function apiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ORPCError) {
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
