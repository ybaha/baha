'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { WritingMeta } from '@/lib/content/types';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { SpinnerGapIcon } from '@phosphor-icons/react/dist/ssr';

type Props = {
  writings: WritingMeta[];
  header?: string;
};

export const WritingList = ({ writings }: Props) => {
  const [viewCounts, setViewCounts] = useState<Record<string, number> | null>(null);
  const [viewsUnavailable, setViewsUnavailable] = useState(false);

  const slugs = useMemo(() => writings.map((writing) => writing.slug), [writings]);

  useEffect(() => {
    if (slugs.length === 0) {
      setViewCounts({});
      setViewsUnavailable(false);
      return;
    }

    let cancelled = false;
    setViewCounts(null);
    setViewsUnavailable(false);

    void api.views
      .get({ slugs })
      .then((data) => {
        if (!cancelled) {
          setViewCounts(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setViewsUnavailable(true);
          setViewCounts({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slugs]);

  const writingsByYear = useMemo(
    () =>
      [...writings]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .reduce((acc, item) => {
          const dateObj = new Date(item.date);
          const year = dateObj.getFullYear();
          if (!acc[year]) {
            acc[year] = [];
          }
          acc[year].push(item);
          return acc;
        }, {} as Record<string, WritingMeta[]>),
    [writings],
  );

  const formatViewCount = useMemo(
    () => (count: number) => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
      }
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
      }
      return count.toString();
    },
    [],
  );

  const viewsLoading = viewCounts === null && !viewsUnavailable;

  return (
    <div className="text-body">
      <div className="grid grid-cols-12 py-2 text-caption font-medium text-content">
        <span className="col-span-1 hidden text-left md:grid">Year</span>
        <span className="col-span-12 md:col-span-10">
          <span className="grid grid-cols-5 items-center md:grid-cols-12">
            <span className="col-span-1 md:col-span-2 text-left">Date</span>
            <span className="col-span-3 md:col-span-5">Title</span>
            <span className="col-span-1 md:col-span-5 text-right">Views</span>
          </span>
        </span>
      </div>

      <div className="group/list-wrapper">
        {Object.entries(writingsByYear).map(([year, writingsByYear]) => {
          return (
            <ul className="group/list list-none" key={year}>
              {writingsByYear.map((item, itemIndex) => {
                const { title, date, slug } = item;
                const dateObj = new Date(date);
                const dateWithDayAndMonth = dateObj.toLocaleString('en-UK', {
                  day: 'numeric',
                  month: 'short',
                });

                const dateWithMonthAndYear =
                  dateObj.toLocaleString('en-UK', {
                    month: 'short',
                  }) +
                  ' ' +
                  dateObj.getFullYear();

                const viewCount = viewCounts?.[item.slug];
                const formattedViews =
                  viewsUnavailable || viewCount === undefined
                    ? '—'
                    : formatViewCount(viewCount);

                return (
                  <li
                    key={item.id}
                    className="group/list-item grid grid-cols-12 p-0 text-subtle"
                  >
                    <span
                      className={cn(
                        'pointer-events-none col-span-1 hidden items-center text-caption md:grid',
                        itemIndex === 0 && 'border-t border-foreground/20',
                      )}
                    >
                      {itemIndex === 0 ? year : ''}
                    </span>
                    <Link
                      href={`/writings/${item.slug}`}
                      className="col-span-12 text-content md:col-span-10"
                    >
                      <span className="grid grid-cols-5 items-center gap-2 border-t border-foreground/20 py-4 md:grid-cols-12">
                        <span className="col-span-1 text-left text-caption text-subtle md:col-span-2">
                          <time dateTime={date} className="hidden md:block">
                            {dateWithDayAndMonth}
                          </time>
                          <time dateTime={date} className="md:hidden">
                            {dateWithMonthAndYear}
                          </time>
                        </span>
                        <span className="col-span-3 line-clamp-4 md:col-span-5">{title}</span>
                        <span className="col-span-1 text-right text-caption text-subtle md:col-span-5">
                          {viewsLoading ? (
                            <div className="flex items-center justify-end">
                              <SpinnerGapIcon className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            formattedViews
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          );
        })}
      </div>
    </div>
  );
};
