"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getFormattedDate } from "@/lib/utils";
import type { WritingMeta } from "@/lib/content/types";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import Tags from "@/components/tags";

type Props = {
  writing?: WritingMeta;
};

export const SidebarLink = ({ writing }: Props) => {
  const { slug, title, date, url, aiGenerated, tags } = writing || {};
  const pathname = usePathname();
  const isActive = !!(slug && pathname.includes(slug));

  return (
    <Link
      key={slug}
      href={url || ""}
      className="wr-item"
      data-active={isActive ? "" : undefined}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="wr-item-title">{title}</span>
        {aiGenerated && (
          <SparkleIcon size={14} className="mt-0.5 shrink-0 text-primary" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-xs text-foreground/45">
          {date && getFormattedDate(date, "short")}
        </span>
        {tags && tags.length > 0 ? (
          <Tags tags={tags} />
        ) : (
          <span className="invisible p-1 text-xs text-foreground/50">
            No tags
          </span>
        )}
      </div>
    </Link>
  );
};
