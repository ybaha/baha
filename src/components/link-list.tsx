"use client";

import React from "react";
import { SidebarLink } from "./writing-link";
import { allWritings } from "contentlayer2/generated";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const LinkList = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedTags = searchParams.get("tags")
    ? (searchParams.get("tags") as string).split(",")
    : [];

  const filteredWritings = allWritings.filter((writing) => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every((tag) => writing.tags?.includes(tag));
  });

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("tags");
    router.push(`${pathname}`);
  };

  if (filteredWritings.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground mb-2">
          No writings found with the selected filters.
        </p>
        <button
          onClick={clearFilters}
          className="text-primary hover:underline text-sm"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div>
      {filteredWritings
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((writing) => (
          <SidebarLink key={writing.slug} writing={writing} />
        ))}
    </div>
  );
};

export default LinkList;
