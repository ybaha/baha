import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFormattedDate(date: string, format?: "short" | "long") {
  const dateObj = new Date(date);

  if (format === "long") {
    return dateObj.toLocaleString("en-UK", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  return dateObj.toLocaleDateString("en-UK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
