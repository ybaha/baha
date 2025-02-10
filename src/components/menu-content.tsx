"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { NavigationLink } from "@/components/navigation-link";
import { SOCIALS, LINKS, COLORS, CV } from "@/lib/constants";
import { Button } from "./ui/button";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Command } from "lucide-react";
import { CommandMenu } from "./command-menu";
import { getCookie, setCookie } from "cookies-next";
import { useEffect, useState } from "react";

type Props = {
  setDrawerOpen?: (open: boolean) => void;
};

export const MenuContent = ({ setDrawerOpen }: Props) => {
  const { setTheme, theme } = useTheme();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const colorEntries = Object.entries(COLORS);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const isMobile = window.innerWidth < 768;

    const isThemeAlreadySet = getCookie("theme");

    if (isMobile || isThemeAlreadySet) return;

    const startTimeout = setTimeout(() => {
      // First open the popover
      setIsPopoverOpen(true);

      // Then wait a bit for the buttons to be in DOM
      setTimeout(() => {
        const buttons = document.querySelectorAll("[data-color-button]");
        if (buttons.length === 0) return;

        setIsAnimating(true);
        let index = 0;

        const cycleColors = () => {
          if (index < colorEntries.length) {
            setCurrentColorIndex(index);
            const [_, color] = colorEntries[index];
            const root = document.querySelector(":root") as HTMLElement;
            if (root) {
              root.style.setProperty("--color-primary", color);
              setCookie("theme", color);

              const buttons = document.querySelectorAll("[data-color-button]");
              const button = buttons[index] as HTMLElement;
              button.focus();
              button.style.backgroundColor = `rgb(${color})`;
              const child = button.querySelector("div") as HTMLElement;
              if (child) child.style.backgroundColor = "white";

              if (index > 0) {
                const prevButton = buttons[index - 1] as HTMLElement;
                const prevChild = prevButton?.querySelector(
                  "div"
                ) as HTMLElement;
                if (prevButton) prevButton.style.backgroundColor = "";
                if (prevChild)
                  prevChild.style.backgroundColor = `rgb(${
                    colorEntries[index - 1][1]
                  })`;
              }
            }
            index++;
            timeoutId = setTimeout(cycleColors, 1000);
          } else {
            const buttons = document.querySelectorAll("[data-color-button]");
            const lastButton = buttons[buttons.length - 1] as HTMLElement;
            const lastChild = lastButton?.querySelector("div") as HTMLElement;
            if (lastButton) lastButton.style.backgroundColor = "";
            if (lastChild)
              lastChild.style.backgroundColor = `rgb(${
                colorEntries[colorEntries.length - 1][1]
              })`;

            setIsPopoverOpen(false);
            setIsAnimating(false);
          }
        };

        cycleColors();
      }, 100); // Small delay for DOM to be ready
    }, 500);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex w-full flex-col lg:h-[calc(100vh-24px)] text-sm">
      <div className="flex flex-col gap-4">
        <Link href="/" className="link-card inline-flex items-center gap-2 p-2">
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              Yusuf Baha Erarslan
            </span>
            <span className="text-foreground/80 font-serif italic">
              Software Engineer
            </span>
          </div>
        </Link>
        <CommandMenu open={isCommandMenuOpen} setOpen={setIsCommandMenuOpen} />
        <div className="relative" onClick={() => setIsCommandMenuOpen(true)}>
          <Input
            className="h-8 cursor-pointer pointer-events-none"
            icons={[
              <div className="w-4 h-4 flex justify-center items-center" key={1}>
                <Command size={14} />
              </div>,
              <div
                className="w-4 h-4 flex justify-center items-center font-[500]"
                key={2}
              >
                K
              </div>,
            ]}
          />
        </div>
        <div className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <NavigationLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              setDrawerOpen={setDrawerOpen}
            />
          ))}
        </div>
      </div>
      <hr className="bg-background text-background" />
      <div className="flex flex-col text-sm flex-1 gap-2">
        <div className="flex flex-col">
          <span className="px-2 text-xs font-medium leading-relaxed text-gray-600">
            Socials
          </span>
          <div className="flex flex-col gap-1 mt-2">
            {SOCIALS.map((profile) => (
              <NavigationLink
                key={profile.url}
                href={profile.url}
                label={profile.label}
                icon={profile.icon}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="px-2 text-xs font-medium leading-relaxed text-gray-600">
            Resume
          </span>
          <NavigationLink href={CV} label="My Resume" icon="File" />
        </div>
        <div className="flex flex-1 h-full mt-4 lg:mt-0 lg:items-end">
          <div className="flex justify-between w-full gap-3">
            <Button
              className="p-0 h-8 w-8 bg-foreground/5 hover:bg-primary hover:text-white relative"
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
              }}
            >
              {mounted && (
                <>
                  <Icons
                    name="Sun"
                    size={16}
                    className={cn(
                      "absolute",
                      theme === "dark" ? "opacity-0" : "opacity-100"
                    )}
                  />
                  <Icons
                    name="MoonStar"
                    size={16}
                    className={cn(
                      "absolute",
                      theme === "dark" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </>
              )}
            </Button>
            <Popover
              modal
              open={isPopoverOpen}
              onOpenChange={(open) => !isAnimating && setIsPopoverOpen(open)}
            >
              <PopoverTrigger asChild>
                <Button className="p-0 h-8 w-8 bg-foreground/5 hover:bg-primary hover:text-white relative group">
                  <div className="w-4 h-4 rounded-full bg-primary transition group-hover:bg-white" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-34 bg-background-tertiary border-foreground/10 p-2 gap-2 flex z-50">
                {colorEntries.map(([key, color], index) => {
                  return (
                    <ColorButton
                      key={key}
                      color={color}
                      isAnimating={index === currentColorIndex && isAnimating}
                      data-color-button
                    />
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

const ColorButton = ({
  color,
  isAnimating,
  ...props
}: {
  color: string;
  isAnimating?: boolean;
  [key: string]: any;
}) => {
  return (
    <Button
      className={cn(
        "p-0 h-8 w-8 bg-foreground/5 hover:text-white relative group transition-all duration-500",
        isAnimating && ["scale-105", "animate-[subtleBounce_1.5s_ease-in-out]"]
      )}
      onClick={() => {
        if (typeof document !== "undefined") {
          const root = document.querySelector(":root") as HTMLElement;
          if (root) {
            root.style.setProperty("--color-primary", `${color}`);
            setCookie("theme", color);
          }
        }
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLElement;
        const child = target.querySelector("div") as HTMLElement;

        if (target) target.style.backgroundColor = `rgb(${color})`;
        if (child) child.style.backgroundColor = `white`;
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLElement;
        const child = target.querySelector("div") as HTMLElement;
        if (target) target.style.backgroundColor = ``;
        if (child) child.style.backgroundColor = `rgb(${color})`;
      }}
      {...props}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full transition-all duration-500",
          isAnimating && "animate-[subtleBounce_1.5s_ease-in-out]"
        )}
        style={{ backgroundColor: `rgb(${color})` }}
      ></div>
    </Button>
  );
};
