export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type SessionResolver = (
  headers: Headers,
  responseHeaders?: Headers,
) => Promise<{ user: SessionUser } | null>;

export type RpcContext = {
  headers: Headers;
  reqHeaders?: Headers;
  resHeaders?: Headers;
  user: SessionUser | null;
  trustedIp: string;
  isPreviewOrigin: boolean;
  getSession: SessionResolver;
};

export type AppServices = {
  knownSlugs: Set<string>;
  viewsCache: Map<string, { value: number; expiresAt: number }>;
  visitDedupe: Map<string, number>;
};
