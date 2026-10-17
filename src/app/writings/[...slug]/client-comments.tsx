"use client";

import { useEffect, useRef, useState } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr";
import { Comments } from "@/components/comments/comments";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { isAuthDisabledClient } from "@/lib/preview";

function useViewIncrement(slug: string, enabled: boolean) {
  const lastSlugRef = useRef<string | null>(null);
  const didIncrementRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (lastSlugRef.current !== slug) {
      lastSlugRef.current = slug;
      didIncrementRef.current = false;
    }

    if (didIncrementRef.current) {
      return;
    }

    didIncrementRef.current = true;
    void api.views.increment({ slug }).catch(() => {
      // Counts are approximate; retrying a mutation could double-count a visit.
    });
  }, [slug, enabled]);
}

function CommentsLoadingShell() {
  return (
    <section id="comments-section" className="mb-8 space-y-8" aria-label="Comments">
      <h2 className="text-section-title font-semibold text-content">Comments</h2>
      <div
        className="flex flex-col items-center justify-center py-6 space-y-4 text-subtle"
        role="status"
        aria-live="polite"
      >
        <SpinnerGapIcon className="h-6 w-6 animate-spin" />
      </div>
    </section>
  );
}

function AuthenticatedComments({ slug }: { slug: string }) {
  const { data: session, isPending, isRefetching, error, refetch } = useSession();
  useViewIncrement(slug, true);

  if (isPending && !session) return <CommentsLoadingShell />;

  const sessionStatus = isPending
    ? "loading"
    : error
      ? "unavailable"
      : session?.user
        ? "authenticated"
        : "unauthenticated";

  const commentsSession = session?.user
    ? {
        user: {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image,
        },
      }
    : null;

  return (
    <Comments
      key={`${slug}:${commentsSession?.user.id ?? "anonymous"}`}
      postSlug={slug}
      session={commentsSession}
      sessionStatus={sessionStatus}
      onSessionRetry={() => void refetch()}
      sessionRetryPending={isRefetching}
    />
  );
}

function PreviewPublicComments({ slug }: { slug: string }) {
  return (
    <Comments
      key={slug}
      postSlug={slug}
      session={null}
      sessionStatus="unauthenticated"
      readOnly
      readOnlyMessage="Comments are read-only on preview deployments."
    />
  );
}

export function ClientComments({ slug }: { slug: string }) {
  const [authDisabled, setAuthDisabled] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthDisabled(isAuthDisabledClient());
  }, []);

  if (authDisabled === null) {
    return <CommentsLoadingShell />;
  }

  if (authDisabled) {
    return <PreviewPublicComments slug={slug} />;
  }

  return <AuthenticatedComments slug={slug} />;
}
