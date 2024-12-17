"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getFormattedDate } from "@/lib/utils";
import { Writing } from "contentlayer2/generated";
import { Sparkles } from "lucide-react";

type Props = {
  writing?: Writing;
};

export const SidebarLink = ({ writing }: Props) => {
  const { slug, title, date, url, aiGenerated } = writing || {};
  const pathname = usePathname();
  const isActive = slug && pathname.includes(slug);

  return (
    <Link
      key={slug}
      href={url || ""}
      className={cn(
        "flex flex-col gap-1 rounded-lg p-2",
        isActive ? "bg-primary text-white" : "hover:bg-primary/20"
      )}
    >
      <div className="flex justify-between">
        <span className="font-medium">{title}</span>
        {aiGenerated && (
          <div className="text-primary flex  justify-center">
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
      {date && (
        <span className={cn(isActive ? "text-white" : "text-foreground/50")}>
          {getFormattedDate(date, "short")}
        </span>
      )}
    </Link>
  );
};
