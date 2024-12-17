"use client";

import { memo, useEffect, useState } from "react";
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

  useEffect(() => {
    const scrollAreaElem = document.querySelector(`#scroll-area`);

    const onScroll = (e: any) => {
      const scrollY = e.target.scrollTop;

      const translateY = Math.max(100 - scrollY, 0);

      const position = Math.max(
        parseInt(
          (
            (scrollY -
              MOBILE_SCROLL_THRESHOLD *
                (MOBILE_SCROLL_THRESHOLD / (scrollY ** 2 / 100))) /
            100
          ).toFixed(2)
        ),
        0
      );

      const opacity = Math.min(position, 1) || 0;

      setTransformValues({ translateY, opacity, set: true });
    };

    if (scrollTitle) {
      scrollAreaElem?.addEventListener("scroll", onScroll, {
        passive: true,
      });
      setTransformValues({ translateY: 100, opacity: 0, set: true });
    }
    return () => scrollAreaElem?.removeEventListener("scroll", onScroll);
  }, [scrollTitle]);

  const writingsTextOpacity = !transformValues.set
    ? 0
    : transformValues.opacity
    ? 0
    : 1;

  return (
    <header
      className={cn(
        "sticky inset-x-0 top-0 z-10 mx-auto flex h-12 w-full shrink-0 items-center overflow-hidden border-b border-primary/10 text-sm font-medium lg:hidden backdrop-blur-md bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800"
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
                    className="font-serif italic transition-all absolute left-14"
                    style={{
                      transform: `translateY(${
                        100 - transformValues.translateY
                      }%)`,
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
                  "line-clamp-2 font-bold text-foreground transition-all"
                )}
                style={{
                  transform: `translateY(${transformValues.translateY}%)`,
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
