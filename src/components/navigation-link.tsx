"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon, AtSignIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Icons, IconsType } from "./icons";

type Props = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  setDrawerOpen?: (open: boolean) => void;
};

export const NavigationLink = ({ href, label, icon, setDrawerOpen }: Props) => {
  const pathname = usePathname();
  const isActive = href === "/" ? href === pathname : pathname.startsWith(href);
  const isInternal = href.startsWith("/");
  const iconClassName = cn("text-foreground/80", isActive && "text-white");

  const iconCmp = icon ? (
    <Icons name={icon as IconsType} size={16} className={iconClassName} />
  ) : (
    <AtSignIcon size={16} className={iconClassName} />
  );

  if (!isInternal) {
    return (
      <a
        key={href}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-primary/10"
      >
        <span className="inline-flex items-center gap-2 font-medium">
          {iconCmp} {label}
        </span>
        <ArrowUpRightIcon size={16} />
      </a>
    );
  }

  return (
    <Link
      key={href}
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg p-2",
        isActive ? "bg-primary text-white" : "hover:bg-primary/20"
      )}
      onClick={() => {
        if (setDrawerOpen) setDrawerOpen(false);
      }}
    >
      {iconCmp}
      <span
        className={cn(
          "font-medium text-foreground/80",
          isActive && "text-white"
        )}
      >
        {label}
      </span>
    </Link>
  );
};
