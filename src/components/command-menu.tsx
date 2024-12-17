"use client";

import * as React from "react";
import {
  AtSignIcon,
  Calculator,
  Calendar,
  CreditCard,
  Feather,
  LinkIcon,
  PenLine,
  Settings,
  Smile,
  User,
  Waypoints,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { allLogs, allWritings } from "contentlayer2/generated";
import { useRouter } from "next/navigation";
import { IconsType } from "./icons";
import { LINKS, PROFILES } from "@/lib/constants";
import { Icons } from "./icons";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function CommandMenu({ open, setOpen }: Props) {
  const [query, setQuery] = React.useState("");

  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // const search = React.useMemo(() => {
  //   if (query.length < 3)
  //     return {
  //       logs: [],
  //       writings: [],
  //     };

  //   const logs = allLogs.filter((log) => {
  //     const titleMatch = log.title.toLowerCase().includes(query.toLowerCase());
  //     const bodyMatch = log.body.raw
  //       .toLowerCase()
  //       .includes(query.toLowerCase());

  //     return titleMatch || bodyMatch;
  //   });

  //   const writings = allWritings.filter((writing) => {
  //     const titleMatch = writing.title
  //       .toLowerCase()
  //       .includes(query.toLowerCase());
  //     const bodyMatch = writing.body.raw
  //       .toLowerCase()
  //       .includes(query.toLowerCase());

  //     return titleMatch || bodyMatch;
  //   });

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search for anything..."
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Writings">
            {allWritings.map((writing) => (
              <CommandItem
                key={writing.slug}
                onSelect={() => {
                  router.push(`/writings/${writing.slug}`);
                  setOpen(false);
                }}
              >
                <PenLine className="mr-2 h-4 w-4" />
                <span>{writing.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Logs">
            {allLogs?.map((log) => (
              <CommandItem
                key={log.slug}
                onSelect={() => {
                  router.push(`/logs/#${log.slug}`);
                  setOpen(false);
                }}
              >
                <Waypoints className="mr-2 h-4 w-4" />
                <span>{log.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Pages">
            {LINKS.map((link) => {
              const icon = link.icon ? (
                <Icons name={link.icon as IconsType} className="mr-2 h-4 w-4" />
              ) : (
                <AtSignIcon className="mr-2 h-4 w-4" />
              );
              return (
                <CommandItem
                  key={link.href}
                  onSelect={() => {
                    router.push(link.href);
                    setOpen(false);
                  }}
                >
                  {icon}
                  <span className="font-semibold">{link.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Socials">
            {PROFILES.map((profile) => (
              <CommandItem
                key={profile.label}
                onSelect={() => {
                  window.open(profile.url, "_blank");
                  setOpen(false);
                }}
              >
                <Icons
                  name={profile.icon as IconsType}
                  className="mr-2 h-4 w-4"
                />
                <span className="flex flex-col">
                  <span className="font-semibold">{profile.label}</span>
                  <span className="text-xs text-opacity-70">
                    {profile.username}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
