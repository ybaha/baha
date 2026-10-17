import { contract } from "@baha/contracts";
import { implement } from "@orpc/server";

import type { AppDatabase } from "../db/client.js";
import { throwApiError } from "../lib/api-error.js";
import type { ServerEnv } from "../env.js";
import { createComment, listComments } from "../services/comments.js";
import { notifyVisit, type TelegramTransport } from "../services/visits.js";
import { getViews, incrementView } from "../services/views.js";
import { toggleVote } from "../services/votes.js";
import type { AppServices, RpcContext, SessionUser } from "./context.js";

export type RouterDeps = {
  db: AppDatabase;
  env: ServerEnv;
  services: AppServices;
  telegramTransport: TelegramTransport;
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
      notify: base.visits.notify.handler(async ({ input, context }) => {
        if (context.isPreviewOrigin) {
          return { status: "ok" };
        }
        return notifyVisit(
          {
            nodeEnv: deps.env.nodeEnv,
            botToken: deps.env.telegramBotToken,
            chatId: deps.env.telegramChatId,
            transport: deps.telegramTransport,
          },
          input,
          context.trustedIp,
          deps.services.visitDedupe,
        );
      }),
    },
  });
}
