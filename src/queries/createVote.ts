"use server";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type ToggleVoteResult =
  | { data: { value: -1 | 0 | 1 }; error: null }
  | { data: null; error: string };

export async function createVote({
  commentId,
  liked,
}: {
  commentId: string;
  liked: boolean;
}): Promise<ToggleVoteResult> {
  if (typeof commentId !== "string" || commentId.length === 0 || commentId.length > 64) {
    return { data: null, error: "Invalid comment id." };
  }

  const session = await getCurrentSession();
  if (!session?.user) {
    return { data: null, error: "Unauthorized" };
  }
  const userId = session.user.id;
  const desired: -1 | 1 = liked ? 1 : -1;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.vote.findUnique({
        where: { userId_commentId: { userId, commentId } },
      });

      if (!existing) {
        const created = await tx.vote.create({
          data: { userId, commentId, value: desired },
        });
        return created.value as -1 | 1;
      }

      if (existing.value === desired) {
        // Toggle off: user is voting the same direction again
        await tx.vote.delete({ where: { id: existing.id } });
        return 0 as const;
      }
      const updated = await tx.vote.update({
        where: { id: existing.id },
        data: { value: desired },
      });
      return updated.value as -1 | 1;
    });

    return { data: { value: result }, error: null };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    ) {
      return { data: null, error: "Comment not found." };
    }
    console.error("createVote failed", error);
    return { data: null, error: "Failed to record vote." };
  }
}
