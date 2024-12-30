"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ArrowLeftIcon } from "lucide-react";
import { MobileDrawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { allWritings } from "contentlayer2/generated";

type Props = {
  scrollTitle?: string;
  title?: string;
  children?: React.ReactNode;
};

const SCROLL_THRESHOLD = 50;

const FloatingHeaderComponent = ({
  scrollTitle: scrollTitleProp,
  title,
  children,
}: Props) => {
  const pathname = usePathname();
  const includesWritings = pathname.includes("/writings/");
  const goBackLink = includesWritings ? "/writings" : false;
  const writingPath = pathname.split("/").slice(2).join("/");

  const scrollTitle =
    scrollTitleProp ||
    title ||
    (includesWritings
      ? allWritings.find((writing) => writing.slug === writingPath)?.title
      : "");

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const scrollAreaElem = document.querySelector(`#scroll-area`);
    if (!scrollTitle || !scrollAreaElem) return;

    const onScroll = (e: any) => {
      const scrollY = e.target.scrollTop;
      setIsScrolled(scrollY > SCROLL_THRESHOLD);
    };

    scrollAreaElem.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollAreaElem.removeEventListener("scroll", onScroll);
  }, [scrollTitle]);

  return (
    <header
      className={cn(
        "sticky inset-x-0 top-0 z-10 mx-auto flex h-12 w-full shrink-0 items-center overflow-hidden border-b border-primary/10 text-sm font-medium lg:hidden backdrop-blur-md bg-zinc-100/90 dark:bg-zinc-900/90 dark:border-zinc-800"
      )}
    >
      <div className="flex h-full w-full items-center px-3">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-1">
            {goBackLink ? (
              <Button variant="ghost" className="shrink-0 flex">
                <Link href={goBackLink} title="Go back" className="flex">
                  <ArrowLeftIcon size={16} />
                  <span
                    className={cn(
                      "font-serif italic absolute left-16 transition-all duration-200",
                      isScrolled
                        ? "opacity-0 -translate-y-6"
                        : "opacity-100 translate-y-0"
                    )}
                  >
                    Writings
                  </span>
                </Link>
              </Button>
            ) : (
              <MobileDrawer />
            )}
            {scrollTitle && (
              <span
                className={cn(
                  "line-clamp-2 font-bold text-foreground transition-all duration-200",
                  isScrolled
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-6"
                )}
              >
                {scrollTitle}
              </span>
            )}
            {title && (
              <Balancer ratio={0.35}>
                <span className="line-clamp-2 font-bold text-foreground">
                  {title}
                </span>
              </Balancer>
            )}
          </div>
          <div className="flex min-w-[50px] justify-end">{children}</div>
        </div>
      </div>
    </header>
  );
};

export const FloatingHeader = memo(FloatingHeaderComponent);
