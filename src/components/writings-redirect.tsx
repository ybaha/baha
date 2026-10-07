'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import type { WritingMeta } from '@/lib/content/types';

export function WritingsRedirect({ writings = [] }: { writings: WritingMeta[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const latestWriting = [...writings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (pathname === '/writings' && !isMobile) {
      router.push(latestWriting?.url || '/writings');
    }
  }, [pathname, router]);

  return <></>;
}
