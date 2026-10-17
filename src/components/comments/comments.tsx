"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicCommentDto } from "@baha/contracts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  SpinnerGapIcon,
  ChatCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn, getFormattedDate } from "@/lib/utils";
import { LoginDialog } from "@/components/auth/login-dialog";
import { api, apiErrorMessage } from "@/lib/api";
import { signOut } from "@/lib/auth-client";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

type FetchMode = "initial" | "more" | "refresh";

export type CommentsSession = {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
} | null;

export type CommentsSessionStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "unavailable";

type Props = {
  postSlug: string;
  session: CommentsSession;
  sessionStatus: CommentsSessionStatus;
  readOnly?: boolean;
  readOnlyMessage?: string;
  onSessionRetry?: () => void;
  sessionRetryPending?: boolean;
};

export function Comments({
  postSlug,
  session,
  sessionStatus,
  readOnly = false,
  readOnlyMessage,
  onSessionRetry,
  sessionRetryPending = false,
}: Props) {
  const [comments, setComments] = useState<PublicCommentDto[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [votePending, setVotePending] = useState<Record<string, boolean>>({});
  const [signOutPending, setSignOutPending] = useState(false);

  const activeSlugRef = useRef(postSlug);
  const fetchGenerationRef = useRef(0);
  const cursorRef = useRef<string | undefined>(undefined);
  const visibleCountRef = useRef(0);
  const initialLoadDoneRef = useRef(false);
  const voteInFlightRef = useRef(new Set<string>());
  const submitGenerationRef = useRef(0);
  const mountedRef = useRef(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const submitInFlightRef = useRef(false);

  visibleCountRef.current = comments.length;
  initialLoadDoneRef.current = initialLoadDone;

  const fetchComments = useCallback(async (mode: FetchMode = "initial") => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const generation = ++fetchGenerationRef.current;
    const loadMore = mode === "more";
    const isCurrent = () => mountedRef.current && !controller.signal.aborted
      && generation === fetchGenerationRef.current;

    if (loadMore) setIsLoadingMore(true);
    else if (!initialLoadDoneRef.current) setIsLoading(true);
    setLoadError(null);

    try {
      const target = mode === "refresh" ? Math.max(visibleCountRef.current, PAGE_SIZE) : PAGE_SIZE;
      const collected: PublicCommentDto[] = [];
      let nextCursor = loadMore ? cursorRef.current : undefined;
      do {
        const previousCursor = nextCursor;
        const page = await api.comments.list({
          postSlug,
          cursor: nextCursor,
          limit: Math.min(MAX_PAGE_SIZE, target - collected.length),
        }, { signal: controller.signal });
        if (!isCurrent()) return;
        collected.push(...page.comments);
        nextCursor = page.nextCursor;
        if (!page.comments.length) break;
        if (nextCursor && nextCursor === previousCursor) throw new Error("Comment cursor did not advance");
      } while (!loadMore && nextCursor && collected.length < target);

      if (!isCurrent()) return;
      setComments((previous) => loadMore ? [...previous, ...collected] : collected);
      cursorRef.current = nextCursor;
      setHasMore(Boolean(nextCursor));
    } catch {
      if (isCurrent()) setLoadError("Failed to load comments. Try again.");
    } finally {
      if (isCurrent()) {
        setIsLoadingMore(false);
        setIsLoading(false);
        setInitialLoadDone(true);
      }
    }
  }, [postSlug]);

  useEffect(() => {
    mountedRef.current = true;
    activeSlugRef.current = postSlug;
    void fetchComments("initial");
    return () => {
      mountedRef.current = false;
      fetchGenerationRef.current += 1;
      submitGenerationRef.current += 1;
      fetchAbortRef.current?.abort();
    };
  }, [postSlug, fetchComments]);

  useEffect(() => {
    if (!loadError) {
      return;
    }
    toast.error(loadError, { id: `comments-load-${postSlug}` });
  }, [loadError, postSlug]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      void fetchComments("more");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || readOnly || submitInFlightRef.current) {
      return;
    }
    submitInFlightRef.current = true;

    const submitGeneration = ++submitGenerationRef.current;
    const slugForSubmit = postSlug;
    const draft = newComment;

    setIsSubmitting(true);
    try {
      await api.comments.create({ postSlug: slugForSubmit, text: draft });

      if (
        !mountedRef.current || submitGeneration !== submitGenerationRef.current ||
        activeSlugRef.current !== slugForSubmit
      ) {
        return;
      }

      setNewComment((current) => (current === draft ? "" : current));
      document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" });
      await fetchComments("refresh");
    } catch (error) {
      if (
        !mountedRef.current || submitGeneration !== submitGenerationRef.current ||
        activeSlugRef.current !== slugForSubmit
      ) {
        return;
      }
      toast.error(apiErrorMessage(error, "Failed to post comment."));
    } finally {
      submitInFlightRef.current = false;
      if (
        mountedRef.current && submitGeneration === submitGenerationRef.current &&
        activeSlugRef.current === slugForSubmit
      ) {
        setIsSubmitting(false);
      }
    }
  };

  const handleSignOut = async () => {
    setSignOutPending(true);
    try {
      const result = await signOut();
      if (result?.error) {
        toast.error(result.error.message ?? "Sign out failed. Try again.");
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, "Sign out failed. Try again."));
    } finally {
      setSignOutPending(false);
    }
  };

  const handleVote = async (commentId: string, liked: boolean) => {
    if (!session || readOnly || voteInFlightRef.current.has(commentId)) {
      return;
    }

    voteInFlightRef.current.add(commentId);
    setVotePending((prev) => ({ ...prev, [commentId]: true }));
    const slugForVote = postSlug;

    try {
      const result = await api.votes.toggle({ commentId, liked });

      if (!mountedRef.current || activeSlugRef.current !== slugForVote) {
        return;
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                score: comment.score + result.value - comment.currentUserVote,
                currentUserVote: result.value,
              }
            : comment,
        ),
      );
    } catch (error) {
      if (!mountedRef.current || activeSlugRef.current !== slugForVote) {
        return;
      }
      toast.error(apiErrorMessage(error, "Failed to save vote."));
      await fetchComments("refresh");
    } finally {
      voteInFlightRef.current.delete(commentId);
      if (mountedRef.current && activeSlugRef.current === slugForVote) {
        setVotePending((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
      }
    }
  };

  const showSignedIn = !readOnly && sessionStatus === "authenticated" && session;
  const showSignedOut = !readOnly && sessionStatus === "unauthenticated";
  const sessionPending = sessionStatus === "loading";
  const sessionUnavailable = !readOnly && sessionStatus === "unavailable";

  if (isLoading && !initialLoadDone) {
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

  return (
    <section id="comments-section" aria-label="Comments" className="mb-8 space-y-8">
      <h2 className="text-section-title font-semibold text-content">Comments</h2>

      {loadError ? (
        <div className="lt-well flex flex-col items-center gap-3 px-6 py-8 text-subtle">
          <p className="mb-0 text-center text-sm text-content">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchComments("refresh")}>
            Retry
          </Button>
        </div>
      ) : initialLoadDone && comments.length === 0 ? (
        <div className="lt-well flex flex-col items-center justify-center gap-3 px-6 py-10 text-subtle">
          <ChatCircleIcon className="h-7 w-7" />
          <p className="mb-0 text-center text-sm">
            No comments yet.{" "}
            {readOnly
              ? "Comments are not available here."
              : showSignedIn
                ? "Be the first to comment!"
                : "Sign in to be the first to comment!"}
          </p>
        </div>
      ) : comments.length > 0 ? (
        <div>
          {comments.map((comment) => {
            const userLiked = comment.currentUserVote > 0;
            const userDisliked = comment.currentUserVote < 0;
            return (
              <article
                key={comment.id}
                className={cn(
                  "flex flex-row gap-3 border-t border-foreground/10 py-5 first:border-t-0 first:pt-0",
                  isSubmitting && "pointer-events-none opacity-50",
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={comment.user.image ?? undefined}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback>{comment.user.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold">{comment.user.name}</span>
                    <time className="text-caption text-subtle">
                      {getFormattedDate(comment.createdAt, "comment")}
                    </time>
                  </div>
                  <p className="mb-0 mt-1 whitespace-pre-wrap break-words text-body text-content">
                    {comment.text}
                  </p>
                  {showSignedIn && (
                    <div className="cm-votes mt-3" role="group" aria-label="Votes">
                      <button
                        type="button"
                        className="cm-vote"
                        data-active={userLiked ? "up" : undefined}
                        disabled={votePending[comment.id]}
                        onClick={() => void handleVote(comment.id, true)}
                        aria-label="Upvote comment"
                        aria-pressed={userLiked}
                      >
                        <ThumbsUpIcon size={14} weight={userLiked ? "fill" : "regular"} />
                      </button>
                      <span className="cm-score" aria-live="polite">
                        {comment.score}
                      </span>
                      <button
                        type="button"
                        className="cm-vote"
                        data-active={userDisliked ? "down" : undefined}
                        disabled={votePending[comment.id]}
                        onClick={() => void handleVote(comment.id, false)}
                        aria-label="Downvote comment"
                        aria-pressed={userDisliked}
                      >
                        <ThumbsDownIcon size={14} weight={userDisliked ? "fill" : "regular"} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          {hasMore && (
            <div className="flex justify-center border-t border-foreground/10 pt-5">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="min-w-[110px]"
                loading={isLoadingMore}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {readOnly && readOnlyMessage ? (
        <p className="mb-0 text-sm text-subtle">{readOnlyMessage}</p>
      ) : sessionUnavailable ? (
        <div className="lt-well flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-0 text-card-title font-semibold text-content">Sign-in unavailable</p>
            <p className="mb-0 mt-1 text-body text-subtle">
              We could not verify your session. Please try signing in again.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => onSessionRetry?.()}
            disabled={sessionRetryPending}
            loading={sessionRetryPending}
          >
            Retry sign-in
          </Button>
        </div>
      ) : sessionPending ? (
        <div className="flex items-center gap-2 text-subtle text-sm" role="status">
          <SpinnerGapIcon className="h-4 w-4 animate-spin" />
          Checking sign-in…
        </div>
      ) : showSignedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="new-comment" className="sr-only">
            Write a comment
          </label>
          <Textarea
            id="new-comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            required
            maxLength={1000}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="mb-0 text-xs tabular-nums text-subtle">
              {newComment.length} / 1000
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleSignOut()}
                disabled={signOutPending || isSubmitting}
                loading={signOutPending}
              >
                Sign out
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || signOutPending}
                className="min-w-[120px]"
                loading={isSubmitting}
                loaderColor="text-white"
              >
                Post comment
              </Button>
            </div>
          </div>
        </form>
      ) : showSignedOut ? (
        <div className="lt-well flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-0 text-card-title font-semibold text-content">
              Join the conversation
            </p>
            <p className="mb-0 mt-1 text-body text-subtle">
              Sign in to leave a comment and vote.
            </p>
          </div>
          <LoginDialog>
            <Button>Sign in to comment</Button>
          </LoginDialog>
        </div>
      ) : null}
    </section>
  );
}
