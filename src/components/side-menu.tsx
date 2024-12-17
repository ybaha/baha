import { ScrollArea } from "@/components/scroll-area";
import { cn } from "@/lib/utils";

type SideMenuProps = {
  children: React.ReactNode;
  title?: string;
  isInner?: boolean;
  className?: string;
};

export const SideMenu = ({
  children,
  title,
  isInner,
  className,
}: SideMenuProps) => {
  // scrollable-area relative w-full flex-col hidden bg-zinc-50 lg:flex lg:flex-col lg:border-r lg:w-80 xl:w-96
  return (
    <ScrollArea
      // className={cn(
      //   "hidden lg:flex lg:flex-col lg:border-r border-border",
      //   isInner ? "lg:w-80 xl:w-96" : "lg:w-60 xl:w-72",
      //   className
      // )}
      className={cn(
        "hidden bg-background-tertiary border-border lg:flex lg:flex-col lg:border-r",
        isInner ? "lg:w-80 xl:w-96" : "lg:w-60 xl:w-72"
      )}
    >
      {title && (
        <div
          className={cn(
            "sticky top-0 z-10 px-5 py-3 border-border text-foreground",
            isInner ? "bg-background/10" : "bg-background-tertiary"
          )}
        >
          <span className="text-sm  font-serif italic">{title}</span>
        </div>
      )}
      <div
        className={cn(
          "p-5 text-foreground h-screen",
          isInner ? "bg-background/10" : "bg-background-tertiary"
        )}
      >
        {children}
      </div>
    </ScrollArea>
  );
};
