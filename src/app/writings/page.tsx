import { allWritings } from "contentlayer2/generated";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/scroll-area";

type WritingWithTags = (typeof allWritings)[number] & {
  tags?: string[];
};

const Page = () => {
  const writings = allWritings as WritingWithTags[];

  return (
    <>
      <div className="lg:hidden">
        {writings
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
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/50">
                    {getDateFormat(writing.date)}
                  </span>
                  {writing.aiGenerated && (
                    <div className="text-primary flex items-center justify-center">
                      <span className="md:block hidden">
                        Created with magic
                      </span>
                      <Sparkles size={16} className="text-primary" />
                    </div>
                  )}
                </div>
                {writing.tags && writing.tags.length > 0 && (
                  <ScrollArea className="max-w-full">
                    <div className="flex gap-1">
                      {writing.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap",
                            "bg-primary/10 text-primary"
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </ScrollArea>
                )}
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
