'use client';

import { allWritings } from 'contentlayer2/generated';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import Tags from '@/components/tags';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// const WritingTags = ({ tags, isActive }: { tags: string[]; isActive?: boolean }) => {
//   const [visibleTags, setVisibleTags] = useState<string[]>([]);
//   const [overflowCount, setOverflowCount] = useState(0);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const tagsRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!tags || !containerRef.current || !tagsRef.current) return;

//     const calculateVisibleTags = () => {
//       const containerWidth = containerRef.current?.offsetWidth || 0;
//       let currentWidth = 0;
//       const visibleTags: string[] = [];

//       // Create a temporary span to measure tag widths
//       const tempSpan = document.createElement('span');
//       tempSpan.style.visibility = 'hidden';
//       tempSpan.style.position = 'absolute';
//       tempSpan.className = 'text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap';
//       document.body.appendChild(tempSpan);

//       for (const tag of tags) {
//         tempSpan.textContent = tag;
//         const tagWidth = tempSpan.offsetWidth + 4; // 4px for gap
//         const hasNextTag = tags.indexOf(tag) < tags.length - 1;
//         const totalContainerWidth = hasNextTag ? containerWidth - 32 : containerWidth;

//         if (currentWidth + tagWidth < totalContainerWidth) {
//           currentWidth += tagWidth;
//           visibleTags.push(tag);
//         } else {
//           break;
//         }
//       }

//       document.body.removeChild(tempSpan);
//       setVisibleTags(visibleTags);
//       setOverflowCount(tags.length - visibleTags.length);
//     };

//     calculateVisibleTags();
//     window.addEventListener('resize', calculateVisibleTags);
//     return () => window.removeEventListener('resize', calculateVisibleTags);
//   }, [tags]);

//   return (
//     <div ref={containerRef} className="max-w-full relative">
//       <div ref={tagsRef} className="flex gap-1">
//         {visibleTags.map((tag) => (
//           <span
//             key={tag}
//             className={cn(
//               'text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap',
//               'bg-primary/10 text-primary',
//             )}
//           >
//             {tag}
//           </span>
//         ))}
//         {overflowCount > 0 && (
//           <span
//             className={cn(
//               'text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium',
//               'bg-primary/20 text-primary',
//             )}
//           >
//             +{overflowCount}
//           </span>
//         )}
//       </div>
//     </div>
//   );
// };

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedTags = searchParams.get('tags')
    ? (searchParams.get('tags') as string).split(',')
    : [];

  const filteredWritings = allWritings.filter((writing) => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every((tag) => writing.tags?.includes(tag));
  });

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('tags');
    router.push(`${pathname}`);
  };

  if (filteredWritings.length === 0) {
    return (
      <div className="p-4 text-center lg:hidden">
        <p className="text-muted-foreground mb-2 text-sm">
          No writings found with the selected filters.
        </p>
        <button onClick={clearFilters} className="text-primary hover:underline text-sm">
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden">
        {filteredWritings
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((writing) => (
            <Link
              key={writing._id}
              href={`/writings/${writing.slug}`}
              className="flex flex-col gap-1 border-b border-foreground/20 px-4 py-3 text-sm hover:bg-primary/20"
            >
              <span className="font-medium">{writing.title}</span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/50">{getDateFormat(writing.date)}</span>
                  {writing.aiGenerated && (
                    <div className="text-primary flex items-center justify-center">
                      <span className="md:block hidden">Created with magic</span>
                      <Sparkles size={16} className="text-primary" />
                    </div>
                  )}
                </div>
                {writing.tags && writing.tags.length > 0 && <Tags tags={writing.tags} />}
              </div>
            </Link>
          ))}
      </div>
    </>
  );
};

const getDateFormat = (date: string) => {
  const dateObj = new Date(date);
  const dateWithDayAndMonth = dateObj.toLocaleString('en-UK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return dateWithDayAndMonth;
};

export default Page;
