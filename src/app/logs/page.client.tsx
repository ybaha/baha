"use client";

import { Icons, IconsType } from "@/components/icons";
import { JourneyCard } from "@/components/journey-card";
import { allLogs, Log } from "contentlayer2/generated";
import React, { useEffect } from "react";

export type AllLogYears = { year: number; items: Log[] }[];

const Logs = () => {
  const allLogYears = allLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reduce((acc, log) => {
      const year = new Date(log.date).getFullYear();
      const yearIndex = acc.findIndex((item) => item.year === year);
      if (yearIndex === -1) {
        acc.push({
          year,
          items: [log],
        });
      } else {
        acc[yearIndex].items.push(log);
      }
      return acc;
    }, [] as AllLogYears);

  useEffect(() => {
    // Get the current hash from the URL
    const hash = window.location.hash;

    // Scroll to the element with the corresponding ID if the hash exists
    if (hash) {
      const element = document.getElementById(hash.substring(1)); // Remove the '#' symbol
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  return (
    <>
      {allLogYears.map((log, index) => (
        <div
          key={`data_${index}`}
          className="flex flex-col items-baseline gap-6 md:flex-row md:gap-12 pt-8"
        >
          <div className="flex items-center">
            <h2>{log.year}</h2>
            <hr className="my-0 ml-4 flex-1 border-dashed border-foreground/40" />
          </div>
          <section>
            {log.items.map((item, itemIndex) => (
              <div
                key={`data_${index}_item_${itemIndex}`}
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
                    name={(item.icon as IconsType) || "Circle"}
                    size={16}
                    className="text-primary "
                  />
                </div>
                <div className="flex-grow pl-8">
                  <JourneyCard
                    title={item.title}
                    description={item.body.code}
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
};

export default Logs;
