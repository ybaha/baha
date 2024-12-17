import { cn } from "@/lib/utils";

export const ScrollArea = ({
  hasScrollTitle = false,
  className = "",
  ...rest
}) => (
  <div
    id={hasScrollTitle ? "scroll-area" : undefined}
    className={cn("scrollable-area relative w-full h-screen", className)}
    {...rest}
  />
);
