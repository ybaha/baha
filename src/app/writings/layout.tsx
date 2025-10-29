import { Suspense } from 'react';

import { SideMenu } from '@/components/side-menu';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ScrollArea } from '@/components/scroll-area';
import LinkList from '@/components/link-list';

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
            <LinkList />
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
