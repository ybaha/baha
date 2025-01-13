"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

interface TagsProps {
  tags: string[];
  isActive?: boolean;
  isStatic?: boolean;
}

const Tags: React.FC<TagsProps> = ({ tags, isActive, isStatic }) => {
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  const [overflowCount, setOverflowCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tags || !containerRef.current || !tagsRef.current) return;

    const calculateVisibleTags = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      let currentWidth = 0;
      const visibleTags: string[] = [];

      // Create a temporary span to measure tag widths
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.className =
        "text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap";
      document.body.appendChild(tempSpan);

      for (const tag of tags) {
        tempSpan.textContent = tag;
        const tagWidth = tempSpan.offsetWidth + 4; // 4px for gap
        const hasNextTag = tags.indexOf(tag) < tags.length - 1;
        const totalContainerWidth = hasNextTag
          ? containerWidth - 32
          : containerWidth;

        console.log({ tagWidth, totalContainerWidth, currentWidth });

        if (currentWidth + tagWidth < totalContainerWidth) {
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

  const staticTagStyle = cn("py-0 dark:bg-primary/70 dark:text-white");

  const dynamicTagStyle = cn(
    "text-[11px] px-1.5 rounded-full h-[22px] flex items-center justify-center whitespace-nowrap font-serif italic",
    isActive
      ? "bg-white/30 text-white dark:bg-white/30 dark:text-white/90"
      : "bg-primary/10 text-primary dark:bg-primary/60 dark:text-white/90",
    isStatic && staticTagStyle
  );

  return (
    <>
      {tags && tags.length > 0 ? (
        <div ref={containerRef} className="w-[200px] relative">
          <div ref={tagsRef} className="flex gap-1 items-center max-h-[22px]">
            {visibleTags.length > 0 ? (
              visibleTags.map((tag) => (
                <span key={tag} className={dynamicTagStyle}>
                  {tag}
                </span>
              ))
            ) : (
              <div className="flex items-center gap-1">
                {tags.length > 0 && (
                  <>
                    <span className={dynamicTagStyle}>{tags[0]}</span>
                    <span className={cn(dynamicTagStyle)}>
                      <Loader size={12} className="animate-spin" />
                    </span>
                  </>
                )}
              </div>
            )}
            {overflowCount > 0 && (
              <span className={cn(dynamicTagStyle, "py-0 not-italic serif")}>
                +{overflowCount}
              </span>
            )}
          </div>
        </div>
      ) : (
        <span className="text-xs text-foreground/50 h-[22px] invisible">
          No tags
        </span>
      )}
    </>
  );
};

export default Tags;
