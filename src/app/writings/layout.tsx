import { Suspense } from "react";

import { SideMenu } from "@/components/side-menu";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SidebarLink } from "@/components/writing-link";
import { allWritings } from "contentlayer2/generated";
import { ScrollArea } from "@/components/scroll-area";

type Props = {
  children: React.ReactNode;
};

export default async function WritingLayout(props: Props) {
  const { children } = props;

  return (
    <>
      <SideMenu title="Writings" isInner>
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
        {/* For desktop */}
        <ScrollArea className="lg:block hidden bg-background">
          {children}
        </ScrollArea>
        {/* For mobile */}
        <div className="lg:hidden block">{children}</div>
      </div>
    </>
  );
}
