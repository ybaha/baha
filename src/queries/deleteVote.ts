"use server";

import { prisma } from "@/lib/prisma";

export async function deleteVote(voteId: string) {
  await prisma.vote.delete({ where: { id: voteId } });
}
