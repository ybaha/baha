"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUpIcon, ThumbsDownIcon, SpinnerGapIcon, ChatCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn, getFormattedDate } from "@/lib/utils";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Session } from "next-auth";
import { createComment } from "@/queries/createComment";
import { getComments } from "@/queries/getComments";
import { createVote } from "@/queries/createVote";
import { toast } from "react-hot-toast";
import { signOut } from "next-auth/react";

type Comment = {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
  score: number;
  currentUserVote: -1 | 0 | 1;
};

export function Comments({
  postSlug,
  session,
}: {
  postSlug: string;
  session: Session | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchComments();
      setIsLoading(false);
      setInitialLoadDone(true);
    })();
  }, [postSlug]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const fetchComments = async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      }

      const response = await getComments({
        postSlug,
        cursor: loadMore ? cursor : undefined,
        limit: 5,
      });

      if (loadMore) {
        setComments((prev) => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }

      setCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setError("Failed to load comments");
    } finally {
      if (loadMore) {
        setIsLoadingMore(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchComments(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const result = await createComment(newComment, postSlug);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNewComment("");
      const commentsSection = document.getElementById("comments-section");
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      await fetchComments();
      setIsSubmitting(false);
    }
  };

  const handleVote = async (commentId: string, value: number) => {
    if (!session) return;

    try {
      const { data, error } = await createVote({
        commentId,
        liked: value > 0,
      });
      if (error) {
        setError(error);
      }
      if (data) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  score: comment.score + data.value - comment.currentUserVote,
                  currentUserVote: data.value,
                }
              : comment
          )
        );
      } else {
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  if (isLoading && !initialLoadDone) {
    return (
      <section
        id="comments-section"
        className="space-y-8 mb-8"
        aria-label="Comments"
      >
        <h2 className="text-2xl font-normal font-serif italic">Comments</h2>
        <div
          className="flex flex-col items-center justify-center py-6 space-y-4 text-foreground/50"
          role="status"
          aria-live="polite"
        >
          <SpinnerGapIcon className="h-6 w-6 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="comments-section"
      aria-label="Comments"
      className="mb-8 space-y-8"
    >
      <h2 className="text-2xl font-normal font-serif italic">Comments</h2>

      {initialLoadDone && comments.length === 0 ? (
        <div className="lt-well flex flex-col items-center justify-center gap-3 px-6 py-10 text-foreground/50">
          <ChatCircleIcon className="h-7 w-7" />
          <p className="mb-0 text-center text-sm">
            No comments yet.{" "}
            {session
              ? "Be the first to comment!"
              : "Sign in to be the first to comment!"}
          </p>
        </div>
      ) : (
        <div>
          {comments.map((comment) => {
            const userLiked = comment.currentUserVote > 0;
            const userDisliked = comment.currentUserVote < 0;
            return (
              <article
                key={comment.id}
                className={cn(
                  "flex flex-row gap-3 border-t border-foreground/10 py-5 first:border-t-0 first:pt-0",
                  isSubmitting && "pointer-events-none opacity-50"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={comment.user.image ?? undefined}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback>
                    {comment.user.name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-semibold">
                      {comment.user.name}
                    </span>
                    <time className="text-xs text-foreground/45">
                      {getFormattedDate(
                        comment.createdAt.toISOString(),
                        "comment"
                      )}
                    </time>
                  </div>
                  <p className="mb-0 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85 md:text-[15px]">
                    {comment.text}
                  </p>
                  {session && (
                    <div className="cm-votes mt-3" role="group" aria-label="Votes">
                      <button
                        type="button"
                        className="cm-vote"
                        data-active={userLiked ? "up" : undefined}
                        onClick={() => handleVote(comment.id, 1)}
                        aria-label="Upvote comment"
                        aria-pressed={userLiked}
                      >
                        <ThumbsUpIcon
                          size={14}
                          weight={userLiked ? "fill" : "regular"}
                        />
                      </button>
                      <span className="cm-score" aria-live="polite">
                        {comment.score}
                      </span>
                      <button
                        type="button"
                        className="cm-vote"
                        data-active={userDisliked ? "down" : undefined}
                        onClick={() => handleVote(comment.id, -1)}
                        aria-label="Downvote comment"
                        aria-pressed={userDisliked}
                      >
                        <ThumbsDownIcon
                          size={14}
                          weight={userDisliked ? "fill" : "regular"}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          {comments.length > 0 && hasMore && (
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
      )}

      {session ? (
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
            <p className="mb-0 text-xs tabular-nums text-foreground/45">
              {newComment.length} / 1000
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
                loading={isSubmitting}
                loaderColor="text-white"
              >
                Post comment
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="lt-well flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-0 font-serif text-xl italic leading-tight">
              Join the conversation
            </p>
            <p className="mb-0 mt-1 text-sm text-foreground/50">
              Sign in to leave a comment and vote.
            </p>
          </div>
          <LoginDialog>
            <Button>Sign in to comment</Button>
          </LoginDialog>
        </div>
      )}
    </section>
  );
}
