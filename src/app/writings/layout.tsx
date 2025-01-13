import { Suspense } from "react";

import { SideMenu } from "@/components/side-menu";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SidebarLink } from "@/components/writing-link";
import { allWritings } from "contentlayer2/generated";
import { ScrollArea } from "@/components/scroll-area";
import SidebarFilter from "@/components/sidebar-filter";

type Props = {
  children: React.ReactNode;
};

export default async function WritingLayout({ children }: Props) {
  return (
    <>
      <SideMenu
        title="Writings"
        isInner
        rightElement={<SidebarFilter type="writings" />}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <div className="flex flex-col gap-1 text-sm">
            {allWritings
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((writing) => (
                <SidebarLink key={writing.slug} writing={writing} />
              ))}
          </div>
        </Suspense>
      </SideMenu>
      <div className="lg:bg-dots flex-1">
        <ScrollArea className="lg:block hidden bg-background">
          {children}
        </ScrollArea>
      </div>
    </>
  );
}
