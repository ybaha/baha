"use client";

import { allWritings } from "contentlayer2/generated";
import { Check, Filter, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const SidebarFilter = ({ type }: { type: "writings" }) => {
  const [open, setOpen] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get all unique tags from writings
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    allWritings.forEach((writing) => {
      writing.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  // Get currently selected tags from URL
  const selectedTags = React.useMemo(() => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",") : [];
  }, [searchParams]);

  const updateTags = React.useCallback(
    (tag: string) => {
      const params = new URLSearchParams(searchParams);
      const currentTags = params.get("tags")?.split(",") || [];

      let newTags: string[];
      if (currentTags.includes(tag)) {
        newTags = currentTags.filter((t) => t !== tag);
      } else {
        newTags = [...currentTags, tag];
      }

      if (newTags.length > 0) {
        params.set("tags", newTags.join(","));
      } else {
        params.delete("tags");
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("tags");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }, [pathname, router, searchParams]);

  return (
    <div className="flex items-center gap-2">
      {selectedTags.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={clearFilters}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="button"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative"
            )}
          >
            <Filter className="h-4 w-4" />
            {selectedTags.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                {selectedTags.length}
              </span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-background">
          <Command>
            <CommandInput placeholder="Search tags..." className="h-9" />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {allTags.map((tag) => (
                <CommandItem
                  key={tag}
                  value={tag}
                  onSelect={() => {
                    updateTags(tag);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tag}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SidebarFilter;
