import { LoadingSpinner } from "@/components/loading-spinner";
import { PageTitle } from "@/components/page-title";
import { ScrollArea } from "@/components/scroll-area";
import { WritingList } from "@/components/writing-list";
import { allWritings } from "contentlayer2/generated";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

const Page = () => {
  return (
    <>
      <div className="lg:hidden">
        {allWritings
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((writing) => (
            <Link
              key={writing._id}
              href={`/writings/${writing.slug}`}
              className="flex flex-col gap-1 border-b border-foreground/20 px-4 py-3 text-sm hover:bg-primary/20"
            >
              <span className="font-medium">{writing.title}</span>
              <div className="flex justify-between">
                <span className="text-foreground/50">
                  {getDateFormat(writing.date)}
                </span>
                <div className="text-primary flex items-center justify-center">
                  <span className="md:block hidden">Created with magic</span>
                  <Sparkles size={16} className="text-primary" />
                </div>
              </div>
            </Link>
          ))}
      </div>
    </>
  );
};

const getDateFormat = (date: string) => {
  const dateObj = new Date(date);
  const dateWithDayAndMonth = dateObj.toLocaleString("en-UK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return dateWithDayAndMonth;
};

export default Page;
