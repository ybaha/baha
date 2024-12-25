"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
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
  votes: {
    id: string;
    value: number;
    userId: string;
    commentId: string;
  }[];
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchComments();
    setIsLoading(false);
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
        limit: 10,
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
      const comment = await createComment(newComment, postSlug);
      if (comment.error) {
        setError(comment.error);
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
      fetchComments();
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const getVoteCount = (votes: Comment["votes"]) => {
    return votes.reduce((acc, vote) => acc + vote.value, 0);
  };

  const votes = comments.flatMap((comment) => comment.votes);

  return (
    <div className="space-y-8 mb-8">
      <h2 className="text-2xl font-normal font-serif italic">Comments</h2>
      <div className="space-y-6">
        {isLoading ? (
          <p className="text-gray-500">Loading comments...</p>
        ) : (
          <>
            {comments.map((comment) => {
              const userLiked = votes.find(
                (vote) =>
                  vote.userId === session?.user?.id &&
                  vote.value > 0 &&
                  vote.commentId === comment.id
              );
              const userDisliked = votes.find(
                (vote) =>
                  vote.userId === session?.user?.id &&
                  vote.value < 0 &&
                  vote.commentId === comment.id
              );
              return (
                <div
                  key={comment.id}
                  className="flex space-x-4"
                  id="comments-section"
                >
                  <Avatar>
                    <AvatarImage src={comment.user.image ?? undefined} />
                    <AvatarFallback>
                      {comment.user.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm sm:text-base">
                        {comment.user.name}
                      </span>
                      <span className="text-gray-500">•</span>
                      <time className="text-gray-500 text-xs sm:text-sm">
                        {getFormattedDate(
                          comment.createdAt.toISOString(),
                          "comment"
                        )}
                      </time>
                    </div>
                    <p className="mt-1 text-sm md:text-base mb-0 sm:mb-2">
                      {comment.text}
                    </p>
                    {session && (
                      <div className="sm:mt-2 flex items-center space-x-2 -ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(comment.id, 1)}
                        >
                          <ThumbsUp
                            className={cn(
                              "h-4 w-4",
                              userLiked ? "fill-primary" : ""
                            )}
                          />
                        </Button>
                        <span>{getVoteCount(comment.votes)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(comment.id, -1)}
                        >
                          <ThumbsDown
                            className={cn(
                              "h-4 w-4",
                              userDisliked ? "fill-red-500" : ""
                            )}
                          />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      {session ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            required
            maxLength={1000}
          />
          <div className="flex justify-between">
            <Button type="submit" variant="outline" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
            <p className="text-sm text-gray-500">{newComment.length} / 1000</p>
          </div>
        </form>
      ) : (
        <LoginDialog>
          <Button variant="outline" className="text-sm text-foreground">
            Sign in to comment
          </Button>
        </LoginDialog>
      )}
      {session && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="text-sm text-gray-500"
            onClick={() => signOut()}
          >
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
