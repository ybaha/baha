import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export type SessionResolver = typeof getServerSession;

let resolverOverride: SessionResolver | null = null;

export function setSessionResolverForTests(resolver: SessionResolver | null) {
  resolverOverride = resolver;
}

export async function getCurrentSession() {
  if (resolverOverride) {
    return resolverOverride(authOptions);
  }
  return getServerSession(authOptions);
}
