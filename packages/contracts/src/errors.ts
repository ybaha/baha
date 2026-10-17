import { oc } from "@orpc/contract";
import { z } from "zod";

export const apiErrorDataSchema = z.object({
  message: z.string(),
});

/** Shared application error codes for RPC procedures. */
export const apiProcedure = oc.errors({
  VALIDATION: {
    status: 400,
    message: "Validation failed.",
    data: apiErrorDataSchema,
  },
  UNAUTHORIZED: {
    status: 401,
    message: "Unauthorized.",
    data: apiErrorDataSchema.optional(),
  },
  NOT_FOUND: {
    status: 404,
    message: "Not found.",
    data: apiErrorDataSchema,
  },
  QUOTA_EXCEEDED: {
    status: 429,
    message: "Quota exceeded.",
    data: apiErrorDataSchema,
  },
  RATE_LIMITED: {
    status: 429,
    message: "Rate limited.",
    data: apiErrorDataSchema,
  },
  UNAVAILABLE: {
    status: 503,
    message: "Service unavailable.",
    data: apiErrorDataSchema,
  },
  FORBIDDEN: {
    status: 403,
    message: "Forbidden.",
    data: apiErrorDataSchema,
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: "Payload too large.",
    data: apiErrorDataSchema,
  },
});

export type ApiErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "FORBIDDEN"
  | "PAYLOAD_TOO_LARGE";

export const API_ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  QUOTA_EXCEEDED: 429,
  RATE_LIMITED: 429,
  UNAVAILABLE: 503,
  FORBIDDEN: 403,
  PAYLOAD_TOO_LARGE: 413,
};
