"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";

import { IconsType } from "./icons";
import { MorphIcon } from "@/components/sidebar/morph-icon";

type Props = {
  href: string;
  label: string;
  icon?: IconsType;
  setDrawerOpen?: (open: boolean) => void;
};

export const NavigationLink = memo(function NavigationLink({
  href,
  label,
  icon,
  setDrawerOpen,
}: Props) {
  const pathname = usePathname();
  const isInternal = href.startsWith("/");
  const isActive =
    isInternal && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const content = (
    <>
      <MorphIcon name={icon ?? "Dot"} />
      <span className="sb-label">{label}</span>
      {!isInternal && <ArrowUpRightIcon size={14} className="sb-trail" />}
    </>
  );

  if (!isInternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="sb-item"
        data-external=""
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="sb-item"
      data-active={isActive ? "" : undefined}
      aria-current={isActive ? "page" : undefined}
      onClick={() => setDrawerOpen?.(false)}
    >
      {content}
    </Link>
  );
});
