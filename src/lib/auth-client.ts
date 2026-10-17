import { createAuthClient } from "better-auth/react";

import { resolveApiOrigin } from "@/lib/api-origin";

export const authClient = createAuthClient({
  baseURL: resolveApiOrigin(),
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
    timeout: 15_000,
    retry: 0,
  },
});

export const { useSession, signIn, signOut } = authClient;
