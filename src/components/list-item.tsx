"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  path: string;
  icon?: React.ReactNode;
};

export const ListItem = ({ title, description, path }: Props) => {
  const pathname = usePathname();
  const isActive = pathname === path;

  return (
    <Link
      key={path}
      href={path}
      className={cn(
        "flex flex-col gap-1 rounded-lg p-2",
        isActive ? "bg-black" : "hover:bg-gray-200"
      )}
    >
      <span className={cn("font-medium", isActive && "text-white")}>
        {title}
      </span>
      {description && (
        <span
          className={cn(isActive ? "text-foreground/70" : "text-foreground/50")}
        >
          {description}
        </span>
      )}
    </Link>
  );
};
