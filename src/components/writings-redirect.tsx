'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { type Writing } from 'contentlayer2/generated';

export function WritingsRedirect({ writings = [] }: { writings: Writing[] }) {
  const pathname = usePathname();
  const router = useRouter();
  console.log({ writings });
  const latestWriting = writings.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];

  useEffect(() => {
    if (pathname === '/writings') {
      router.push(latestWriting?.url || '/writings');
    }
  }, [pathname, router]);

  return <></>;
}
