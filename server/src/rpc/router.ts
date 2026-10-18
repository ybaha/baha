import { contract, visitsNotifyInputSchema } from "@baha/contracts";
import { implement } from "@orpc/server";

import type { AppDatabase } from "../db/client.js";
import { throwApiError } from "../lib/api-error.js";
import type { ServerEnv } from "../env.js";
import { createComment, listComments } from "../services/comments.js";
import { notifyVisit, type TelegramTransport, type VisitsServiceDeps } from "../services/visits.js";
import type { createVisitCipher } from "../services/visit-crypto.js";
import type { VisitRecorder } from "../services/visit-records.js";
import { getViews, incrementView } from "../services/views.js";
import { toggleVote } from "../services/votes.js";
import type { AppServices, RpcContext, SessionUser } from "./context.js";

export type RouterDeps = {
  db: AppDatabase;
  env: ServerEnv;
  services: AppServices;
  telegramTransport: TelegramTransport;
  visitCipher?: ReturnType<typeof createVisitCipher>;
  visitRecorder: VisitRecorder;
};

const base = implement(contract).$context<RpcContext>();

async function resolveSessionUser(
  context: RpcContext,
): Promise<SessionUser | null> {
  if (context.user) {
    return context.user;
  }
  const session = await context.getSession(
    context.headers,
    context.resHeaders,
  );
  if (session?.user) {
    context.user = session.user;
    return session.user;
  }
  return null;
}

async function requireUser(context: RpcContext): Promise<SessionUser> {
  const user = await resolveSessionUser(context);
  if (!user) {
    throwApiError("UNAUTHORIZED");
  }
  return user;
}

export function buildRouter(deps: RouterDeps) {
  const commentsDeps = { db: deps.db, knownSlugs: deps.services.knownSlugs };
  const viewsDeps = { db: deps.db, knownSlugs: deps.services.knownSlugs };
  const visitsDeps: VisitsServiceDeps = {
    nodeEnv: deps.env.nodeEnv,
    botToken: deps.env.telegramBotToken,
    chatId: deps.env.telegramChatId,
    transport: deps.telegramTransport,
    recorder: deps.visitRecorder,
    events: deps.services.visitEvents,
  };

  return base.router({
    comments: {
      list: base.comments.list.handler(async ({ input, context }) => {
        const limit = input.limit ?? 10;
        const user = await resolveSessionUser(context);
        return listComments(
          { ...commentsDeps, db: deps.db },
          { postSlug: input.postSlug, limit, cursor: input.cursor },
          user?.id,
        );
      }),
      create: base.comments.create.handler(async ({ input, context }) => {
        if (context.isPreviewOrigin) {
          throwApiError("UNAUTHORIZED", "Preview origins are read-only.");
        }
        const user = await requireUser(context);
        return createComment(commentsDeps, input, user.id);
      }),
    },
    votes: {
      toggle: base.votes.toggle.handler(async ({ input, context }) => {
        if (context.isPreviewOrigin) {
          throwApiError("UNAUTHORIZED", "Preview origins are read-only.");
        }
        const user = await requireUser(context);
        return toggleVote({ db: deps.db }, input, user.id);
      }),
    },
    views: {
      get: base.views.get.handler(async ({ input }) => {
        return getViews(viewsDeps, input.slugs, deps.services.viewsCache);
      }),
      increment: base.views.increment.handler(async ({ input, context }) => {
        if (context.isPreviewOrigin) {
          throwApiError("UNAUTHORIZED", "Preview origins are read-only.");
        }
        return incrementView(
          viewsDeps,
          input.slug,
          deps.services.viewsCache,
        );
      }),
    },
    visits: {
      publicKey: base.visits.publicKey.handler(async () => {
        if (!deps.visitCipher) throwApiError("UNAVAILABLE", "Visit encryption is not configured.");
        return deps.visitCipher.publicKey();
      }),
      notifyEncrypted: base.visits.notifyEncrypted.handler(async ({ input, context }) => {
        if (context.isPreviewOrigin) throwApiError("FORBIDDEN", "Preview origins are read-only.");
        if (!deps.visitCipher) throwApiError("UNAVAILABLE", "Visit encryption is not configured.");
        let decrypted: unknown;
        try {
          decrypted = deps.visitCipher.decrypt(input);
        } catch {
          throwApiError("VALIDATION", "Invalid encrypted visit.");
        }
        const parsed = visitsNotifyInputSchema.safeParse(decrypted);
        if (!parsed.success) throwApiError("VALIDATION", "Invalid visit payload.");
        return notifyVisit(visitsDeps, parsed.data, context.trustedIp, deps.services.visitDedupe, {
          id: input.eventId, encrypted: true,
        });
      }),
      notify: base.visits.notify.handler(async ({ input, context }) => {
        if (context.isPreviewOrigin) {
          return { status: "ok" };
        }
        return notifyVisit(
          visitsDeps,
          input,
          context.trustedIp,
          deps.services.visitDedupe,
        );
      }),
    },
  });
}
