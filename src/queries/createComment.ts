"use server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function createComment(text: string, postSlug: string) {
  if (text.length > 1000) {
    return {
      data: null,
      error: "Comment is too long. Make it shorter than 1000 characters.",
    };
  }
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { data: null, error: "Unauthorized" };
  }

  // if user has more than 10 comments, in last 24 hours, return error
  const userComments = await prisma.comment.count({
    where: {
      userId: session.user.id,
      createdAt: {
        gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (userComments >= 10) {
    return {
      data: null,
      error:
        "You have reached the maximum number of comments. Please delete some comments before posting again.",
    };
  }

  const comment = await prisma.comment.create({
    data: {
      text: text.slice(0, 1000),
      postSlug,
      userId: session.user.id,
    },
  });

  return { data: comment, error: null };
}
