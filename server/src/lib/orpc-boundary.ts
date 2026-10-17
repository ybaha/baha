import { StandardRPCJsonSerializer, StandardRPCSerializer } from "@orpc/client/standard";
import { StandardRPCCodec } from "@orpc/server/standard";
import { toFetchResponse } from "@orpc/standard-server-fetch";
import type { ApiErrorCode } from "@baha/contracts";
import { createApiError } from "./api-error.js";

const codec = new StandardRPCCodec(
  new StandardRPCSerializer(new StandardRPCJsonSerializer()),
);

export function orpcErrorResponse(
  code: ApiErrorCode,
  message: string,
  init?: { headers?: Record<string, string> },
): Response {
  const response = toFetchResponse(codec.encodeError(createApiError(code, message)));
  response.headers.set("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(init?.headers ?? {})) {
    response.headers.set(name, value);
  }
  return response;
}
