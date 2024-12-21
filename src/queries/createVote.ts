"use server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { deleteVote } from "./deleteVote";

export async function createVote({
  commentId,
  liked,
}: {
  commentId: string;
  liked: boolean;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { data: null, error: "Unauthorized" };
  }

  const existingVote = await prisma.vote.findFirst({
    where: { commentId, userId: session.user.id },
  });

  if (existingVote) {
    if (existingVote.value === 1 && liked) {
      await deleteVote(existingVote.id);
    } else if (existingVote.value === -1 && !liked) {
      await deleteVote(existingVote.id);
    }

    const newVoteCount = liked ? 1 : -1;

    const updatedVote = await prisma.vote.updateMany({
      where: { id: existingVote.id },
      data: { value: newVoteCount },
    });
    return { data: updatedVote, error: null };
  }

  const vote = await prisma.vote.create({
    data: {
      commentId,
      userId: session.user.id,
      value: liked ? 1 : -1,
    },
  });

  return { data: vote, error: null };
}
