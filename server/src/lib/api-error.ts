import { ORPCError } from "@orpc/server";
import {
  API_ERROR_HTTP_STATUS,
  type ApiErrorCode,
} from "@baha/contracts";

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION: "Validation failed.",
  UNAUTHORIZED: "Unauthorized.",
  NOT_FOUND: "Not found.",
  QUOTA_EXCEEDED: "Quota exceeded.",
  RATE_LIMITED: "Rate limited.",
  UNAVAILABLE: "Service unavailable.",
  FORBIDDEN: "Forbidden.",
  PAYLOAD_TOO_LARGE: "Payload too large.",
};

export function createApiError(
  code: ApiErrorCode,
  message?: string,
  data?: { message: string },
) {
  const resolvedMessage = message ?? DEFAULT_MESSAGES[code];
  const payload =
    code === "UNAUTHORIZED"
      ? data
      : (data ?? { message: resolvedMessage });
  return new ORPCError(code, {
    defined: true,
    status: API_ERROR_HTTP_STATUS[code],
    message: resolvedMessage,
    ...(payload ? { data: payload } : {}),
  });
}

export function throwApiError(
  code: ApiErrorCode,
  message?: string,
  data?: { message: string },
): never {
  throw createApiError(code, message, data);
}
