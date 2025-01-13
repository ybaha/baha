"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getFormattedDate } from "@/lib/utils";
import { Writing } from "contentlayer2/generated";
import { Loader, Sparkles } from "lucide-react";
import { useRef, useEffect, useState } from "react";

type Props = {
  writing?: Writing;
};

export const SidebarLink = ({ writing }: Props) => {
  const { slug, title, date, url, aiGenerated, tags } = writing || {};
  const pathname = usePathname();
  const isActive = slug && pathname.includes(slug);
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  const [overflowCount, setOverflowCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tags || !containerRef.current || !tagsRef.current) return;

    const calculateVisibleTags = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      console.log({ containerWidth });
      let currentWidth = 0;
      const visibleTags: string[] = [];

      // Create a temporary span to measure tag widths
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.className =
        "text-[11px] px-1.5 py-[1px] rounded-full whitespace-nowrap font-serif italic";
      document.body.appendChild(tempSpan);

      for (const tag of tags) {
        tempSpan.textContent = tag;
        const tagWidth = tempSpan.offsetWidth + 4; // 4px for gap
        console.log({ tagWidth });
        const hasNextTag = tags.indexOf(tag) < tags.length - 1;
        const totalContainerWidth = hasNextTag
          ? containerWidth - 32
          : containerWidth;
        if (currentWidth + tagWidth < totalContainerWidth) {
          // Reserve space for badge
          currentWidth += tagWidth;
          visibleTags.push(tag);
        } else {
          break;
        }
      }

      document.body.removeChild(tempSpan);
      setVisibleTags(visibleTags);
      setOverflowCount(tags.length - visibleTags.length);
    };

    calculateVisibleTags();
    window.addEventListener("resize", calculateVisibleTags);
    return () => window.removeEventListener("resize", calculateVisibleTags);
  }, [tags]);

  return (
    <Link
      key={slug}
      href={url || ""}
      className={cn(
        "flex flex-col gap-1 rounded-lg p-2 overflow-hidden",
        isActive ? "bg-primary text-white" : "hover:bg-primary/20"
      )}
    >
      <div className="flex justify-between">
        <span className="font-medium">{title}</span>
        {aiGenerated && (
          <div className="text-primary flex justify-center">
            <Sparkles
              size={16}
              className={cn(
                isActive ? "text-white" : "text-primary",
                "mt-1 ml-1"
              )}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs whitespace-nowrap",
            isActive ? "text-white" : "text-foreground/50"
          )}
        >
          {date && getFormattedDate(date, "short")}
        </span>
        {tags && tags.length > 0 ? (
          <div ref={containerRef} className="w-[200px] relative">
            <div ref={tagsRef} className="flex gap-1 items-center">
              {visibleTags.length > 0 ? (
                visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "text-[11px] px-1.5 py-[1px] rounded-full whitespace-nowrap font-serif italic",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <div className="flex items-center gap-1">
                  {tags.length > 0 && (
                    <>
                      <span
                        className={cn(
                          "text-[11px] px-1.5 py-[1px] rounded-full whitespace-nowrap font-serif italic",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {tags[0]}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] px-1.5 py-[5px] rounded-full whitespace-nowrap font-serif italic",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        <Loader size={12} className="animate-spin" />
                      </span>
                    </>
                  )}
                </div>
              )}
              {overflowCount > 0 && (
                <span
                  className={cn(
                    "text-[11px] px-1.5 py-[1px] rounded-full whitespace-nowrap font-medium font-serif",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  +{overflowCount}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-foreground/50 p-1 invisible">
            No tags
          </span>
        )}
      </div>
    </Link>
  );
};
