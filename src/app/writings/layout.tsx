import { Suspense } from 'react';

import { SideMenu } from '@/components/side-menu';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ScrollArea } from '@/components/scroll-area';
import LinkList from '@/components/link-list';
import { WritingsRedirect } from '@/components/writings-redirect';
import { getAllWritings } from '@/queries/writings';

type Props = {
  children: React.ReactNode;
};

async function fetchData() {
  const allWritings = await getAllWritings();
  return { allWritings };
}

export default async function WritingLayout({ children }: Props) {
  const { allWritings } = await fetchData();

  return (
    <>
      <SideMenu title="Writings" isInner>
        <Suspense fallback={<LoadingSpinner />}>
          <div className="flex flex-col gap-1 text-sm">
            <LinkList />
            <WritingsRedirect writings={allWritings} />
          </div>
        </Suspense>
      </SideMenu>
      <div className="lg:bg-dots flex-1">
        {/* For desktop */}
        <ScrollArea className="lg:block hidden bg-background">{children}</ScrollArea>
        {/* For mobile */}
        <div className="lg:hidden block">{children}</div>
      </div>
    </>
  );
}
