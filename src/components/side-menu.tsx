import { ScrollArea } from "@/components/scroll-area";
import { cn } from "@/lib/utils";
import SidebarFilter from "./sidebar-filter";

type SideMenuProps = {
  children: React.ReactNode;
  title?: string;
  isInner?: boolean;
  className?: string;
  rightElement?: React.ReactNode;
};

export const SideMenu = ({
  children,
  title,
  isInner,
  className,
}: SideMenuProps) => {
  return (
    <ScrollArea
      className={cn(
        "hidden lg:flex lg:flex-col",
        isInner
          ? "wr-pane lg:w-80 xl:w-96"
          : "sb-side lg:w-60 xl:w-72",
        className
      )}
    >
      {title && (
        <div className="wr-header">
          <span className="wr-title">{title}</span>
          {title === "Writings" && <SidebarFilter type="writings" />}
        </div>
      )}
      <div className={isInner ? "wr-body" : "sb-panel"}>{children}</div>
    </ScrollArea>
  );
};
