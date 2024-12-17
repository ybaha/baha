import Link from "next/link";
import { cn } from "@/lib/utils";
import { Writing } from "contentlayer2/generated";

type Props = {
  writings: Writing[];
  header?: string;
};

export const WritingList = ({ writings }: Props) => {
  const writingsByYear = writings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce((acc, item) => {
      const dateObj = new Date(item.date);
      const year = dateObj.getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    }, {} as Record<string, Writing[]>);

  return (
    <div className="text-sm">
      <div className="grid grid-cols-12 py-2 font-medium text-foreground">
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
                const {
                  title,
                  date,
                  _raw: { flattenedPath: slug },
                } = item;
                const dateObj = new Date(date);
                const dateWithDayAndMonth = dateObj.toLocaleString("en-UK", {
                  day: "numeric",
                  month: "short",
                });

                const dateWithMonthAndYear =
                  dateObj.toLocaleString("en-UK", {
                    month: "short",
                  }) +
                  " " +
                  dateObj.getFullYear();

                return (
                  <li
                    key={slug}
                    className="group/list-item grid grid-cols-12 p-0 group-hover/list-wrapper:text-foreground/40"
                  >
                    <span
                      className={cn(
                        "pointer-events-none col-span-1 hidden items-center transition-colors group-hover/list:text-foreground md:grid",
                        itemIndex === 0 && "border-t border-foreground/20"
                      )}
                    >
                      {itemIndex === 0 ? year : ""}
                    </span>
                    <Link
                      href={`/${slug}`}
                      className="col-span-12 group-hover/list-item:text-foreground md:col-span-10"
                    >
                      <span className="grid grid-cols-5 items-center gap-2 border-t border-foreground/20 py-4 md:grid-cols-12">
                        <span className="col-span-1 md:col-span-2 text-left">
                          <time dateTime={date} className="hidden md:block">
                            {dateWithDayAndMonth}
                          </time>
                          <time dateTime={date} className="md:hidden">
                            {dateWithMonthAndYear}
                          </time>
                        </span>
                        <span className="col-span-3 line-clamp-4 md:col-span-5">
                          {title}
                        </span>
                        {/* <span className="col-span-1">
                          {formattedViews ? (
                            <motion.span
                              key={`${slug}-views`}
                              className="flex justify-end"
                              title={`${formattedViews} views`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {formattedViews}
                            </motion.span>
                          ) : (
                            <motion.span key={`${slug}-views-loading`} />
                          )}
                        </span> */}
                        <span className="col-span-1 md:col-span-5 text-right">
                          0
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
