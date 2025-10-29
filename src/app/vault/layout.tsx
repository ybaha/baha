import { Suspense } from 'react';

import { SideMenu } from '@/components/side-menu';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SidebarLink } from '@/components/writing-link';
import { allWritings } from 'contentlayer2/generated';

type Props = {
  children: React.ReactNode;
};

export default async function VaultLayout({ children }: Props) {
  return (
    <>
      {/* <SideMenu title="Vault" isInner className="!w-[200px]">
        <Suspense fallback={<LoadingSpinner />}>
          <div className="flex flex-col gap-1 text-sm">
            <SidebarLink writing={allWritings[0]} />
          </div>
        </Suspense>
      </SideMenu>
      <div className="flex-1 lg:bg-grid">{children}</div> */}
    </>
  );
}
