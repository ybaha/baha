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
import { useEffect, useState } from "react";

const ACCENT_STORAGE_KEY = "baha-accent";

type Props = {
  setDrawerOpen?: (open: boolean) => void;
};

function readStoredAccent(): string | null {
  if (typeof document === "undefined") return null;
  try {
    return window.localStorage.getItem(ACCENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyAccent(color: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", color);
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, color);
  } catch {
    // ignore quota / privacy-mode errors; accent reset is non-essential
  }
}

export const MenuContent = ({ setDrawerOpen }: Props) => {
  const { setTheme, theme } = useTheme();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeAccent, setActiveAccent] = useState<string | null>(null);
  const colorEntries = Object.entries(COLORS);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredAccent();
    if (stored) {
      setActiveAccent(stored);
      applyAccent(stored);
    }
  }, []);

  const selectAccent = (color: string) => {
    setActiveAccent(color);
    applyAccent(color);
  };

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
              aria-label="Toggle color theme"
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
              onOpenChange={setIsPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  className="p-0 h-8 w-8 bg-foreground/5 hover:bg-primary hover:text-white relative group"
                  aria-label="Change accent color"
                  aria-haspopup="dialog"
                >
                  <div
                    className="w-4 h-4 rounded-full bg-primary transition group-hover:bg-white"
                    style={
                      activeAccent
                        ? { backgroundColor: `rgb(${activeAccent})` }
                        : undefined
                    }
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-34 bg-background-tertiary border-foreground/10 p-2 gap-2 flex z-50">
                {colorEntries.map(([key, color]) => (
                  <ColorButton
                    key={key}
                    color={color}
                    isActive={activeAccent === color}
                    onSelect={() => selectAccent(color)}
                  />
                ))}
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
  isActive,
  onSelect,
}: {
  color: string;
  isActive?: boolean;
  onSelect: () => void;
}) => {
  return (
    <Button
      className={cn(
        "p-0 h-8 w-8 bg-foreground/5 hover:text-white relative group transition-all duration-200",
        isActive && "ring-2 ring-foreground/40"
      )}
      onClick={onSelect}
      aria-label={`Use ${color} accent`}
      aria-pressed={isActive}
    >
      <div
        className="w-4 h-4 rounded-full transition"
        style={{ backgroundColor: `rgb(${color})` }}
      />
    </Button>
  );
};

// legacy handlers removed; ring/aria-pressed now indicate the active accent
