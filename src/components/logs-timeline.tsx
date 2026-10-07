import { Icons, IconsType } from '@/components/icons';
import { JourneyCard } from '@/components/journey-card';
import { MdxContent } from '@/components/mdx/mdx-content';
import { getLogsGroupedByYear } from '@/lib/content/selectors';

export async function LogsTimeline() {
  const allLogYears = getLogsGroupedByYear();

  return (
    <>
      {allLogYears.map((log, index) => (
        <div
          key={`data_${log.year}`}
          className="flex flex-col items-baseline gap-6 md:flex-row md:gap-12 pt-8"
        >
          <div className="flex items-center">
            <h2>{log.year}</h2>
            <hr className="my-0 ml-4 flex-1 border-dashed border-foreground/40" />
          </div>
          <section>
            {log.items.map((item, itemIndex) => (
              <div
                key={item.id}
                className="relative flex pb-8 last:pb-0"
                id={item.slug}
              >
                {itemIndex !== log.items.length - 1 && (
                  <div className="absolute inset-0 flex w-7 items-center justify-center">
                    <div className="pointer-events-none h-full w-px border-l-[1px] border-dashed border-foreground/30"></div>
                  </div>
                )}
                <div className="z-0 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-background border border-primary text-foreground align-middle ">
                  <Icons
                    name={(item.icon as IconsType) || 'Circle'}
                    size={16}
                    className="text-primary "
                  />
                </div>
                <div className="flex-grow pl-8">
                  <JourneyCard
                    title={item.title}
                    description={
                      <MdxContent source={item.body} journey className="text-xs" />
                    }
                    image={item.image}
                    date={item.date}
                    index={index}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      ))}
    </>
  );
}
