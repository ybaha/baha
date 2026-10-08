"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { NavigationLink } from "@/components/navigation-link";
import { MorphIcon } from "@/components/sidebar/morph-icon";
import { SOCIALS, LINKS, COLORS, CV } from "@/lib/constants";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CommandIcon } from "@phosphor-icons/react/dist/ssr";
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
    <div className="sb-root">
      <Link href="/" className="sb-profile">
        <span className="sb-profile-text">
          <span className="sb-name">Yusuf Baha Erarslan</span>
          <span className="sb-role">Software Engineer</span>
        </span>
      </Link>

      <CommandMenu open={isCommandMenuOpen} setOpen={setIsCommandMenuOpen} />
      <button
        type="button"
        className="sb-item sb-search"
        onClick={() => setIsCommandMenuOpen(true)}
      >
        <MorphIcon name="Search" />
        <span className="sb-label">Search</span>
        <kbd className="sb-kbd" aria-hidden>
          <CommandIcon size={11} />K
        </kbd>
      </button>

      <nav className="sb-nav" aria-label="Pages">
        {LINKS.map((link) => (
          <NavigationLink
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            setDrawerOpen={setDrawerOpen}
          />
        ))}
      </nav>

      <div className="sb-section">
        <span className="sb-section-label">Socials</span>
        <nav className="sb-nav" aria-label="Socials">
          {SOCIALS.map((profile) => (
            <NavigationLink
              key={profile.url}
              href={profile.url}
              label={profile.label}
              icon={profile.icon}
            />
          ))}
        </nav>
      </div>

      <div className="sb-section">
        <span className="sb-section-label">Resume</span>
        <nav className="sb-nav" aria-label="Resume">
          <NavigationLink href={CV} label="My Resume" icon="File" />
        </nav>
      </div>

      <div className="sb-spacer" />

      <div className="sb-footer">
        <button
          type="button"
          className="sb-tool"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle color theme"
        >
          {mounted && (
            <>
              <Icons
                name="Sun"
                size={16}
                className={cn(
                  "absolute transition-all duration-300",
                  theme === "dark"
                    ? "scale-50 -rotate-90 opacity-0"
                    : "opacity-100"
                )}
              />
              <Icons
                name="MoonStar"
                size={16}
                className={cn(
                  "absolute transition-all duration-300",
                  theme === "dark"
                    ? "opacity-100"
                    : "scale-50 rotate-90 opacity-0"
                )}
              />
            </>
          )}
        </button>

        <Popover modal open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="sb-tool sb-accent-pop"
              aria-label="Change accent color"
              aria-haspopup="dialog"
            >
              <span
                className="h-4 w-4 rounded-full bg-primary"
                style={
                  activeAccent
                    ? { backgroundColor: `rgb(${activeAccent})` }
                    : undefined
                }
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={10}
            className="sb-popover"
          >
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
    <button
      type="button"
      className="sb-swatch"
      data-active={isActive ? "" : undefined}
      onClick={onSelect}
      aria-label={`Use ${color} accent`}
      aria-pressed={isActive}
    >
      <span
        className="h-4 w-4 rounded-full"
        style={{ backgroundColor: `rgb(${color})` }}
      />
    </button>
  );
};
