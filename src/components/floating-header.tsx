"use client";

import { memo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { ArrowLeftIcon } from "lucide-react";
import { MobileDrawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { MOBILE_SCROLL_THRESHOLD } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { allWritings } from "contentlayer2/generated";

type Props = {
  scrollTitle?: string;
  title?: string;
  children?: React.ReactNode;
};

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

const FloatingHeaderComponent = ({
  scrollTitle: scrollTitleProp,
  title,
  children,
}: Props) => {
  const pathname = usePathname();
  const includesWritings = pathname.includes("/writings/");
  const goBackLink = includesWritings ? "/writings" : undefined;
  const writingPath = pathname.split("/").slice(2).join("/");

  const scrollTitle =
    scrollTitleProp ||
    title ||
    (includesWritings
      ? allWritings.find((writing) => writing.slug === writingPath)?.title
      : "");

  const [transformValues, setTransformValues] = useState({
    translateY: 0,
    opacity: 0,
    set: false,
  });

  const handleScroll = useCallback((scrollY: number) => {
    const translateY = Math.min(Math.max(100 - scrollY / 2, 0), 100);
    const opacity = Math.min(
      Math.max((scrollY - MOBILE_SCROLL_THRESHOLD) / 50, 0),
      1
    );

    setTransformValues({ translateY, opacity, set: true });
  }, []);

  useEffect(() => {
    const scrollAreaElem = document.querySelector(`#scroll-area`);

    if (!scrollTitle || !scrollAreaElem) return;

    const throttledScroll = throttle((e: any) => {
      const scrollY = e.target.scrollTop;
      handleScroll(scrollY);
    }, 16); // ~60fps

    scrollAreaElem.addEventListener("scroll", throttledScroll, {
      passive: true,
    });

    setTransformValues({ translateY: 100, opacity: 0, set: true });

    return () => scrollAreaElem.removeEventListener("scroll", throttledScroll);
  }, [scrollTitle, handleScroll]);

  const writingsTextOpacity = !transformValues.set
    ? 0
    : transformValues.opacity
    ? 0
    : 1;

  return (
    <header
      className={cn(
        "sticky inset-x-0 top-0 z-10 mx-auto flex h-12 w-full shrink-0 items-center overflow-hidden border-b border-primary/10 text-sm font-medium lg:hidden backdrop-blur-md bg-zinc-100/90 dark:bg-zinc-900/90 dark:border-zinc-800",
        "will-change-transform"
      )}
    >
      <div className="flex h-full w-full items-center px-3">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-1">
            {goBackLink ? (
              <Button variant="ghost" className="shrink-0" asChild>
                <Link href={goBackLink} title="Go back">
                  <ArrowLeftIcon size={16} />
                  <span
                    className="font-serif italic transition-all absolute left-14 will-change-transform"
                    style={{
                      transform: `translate3d(0, ${
                        100 - transformValues.translateY
                      }%, 0)`,
                      opacity: writingsTextOpacity,
                    }}
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
                  "line-clamp-2 font-bold text-foreground transition-all will-change-transform"
                )}
                style={{
                  transform: `translate3d(0, ${transformValues.translateY}%, 0)`,
                  opacity: transformValues.opacity,
                }}
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
