import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom text sizes must be distinguished from text colors when merging classes.
const mergeClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [
        "page-title", "page-title-lg", "section-title", "card-title",
        "body", "caption", "stat", "quote",
      ] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return mergeClasses(clsx(inputs));
}

export function getFormattedDate(
  date: string,
  format: "short" | "long" | "comment" = "short"
) {
  const d = new Date(date);
  if (format === "comment") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }
  if (format === "long") {
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
