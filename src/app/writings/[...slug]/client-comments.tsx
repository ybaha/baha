"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Comments } from "@/components/comments/comments";
import { incrementPostView } from "@/queries/incrementPostView";

export function ClientComments({ slug }: { slug: string }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Increment view count on client side
    incrementPostView(slug);
  }, [slug]);

  return <Comments postSlug={slug} session={session} />;
}
