"use client";

import Link from "next/link";
import { Log } from "contentlayer2/generated";
import { Icons, IconsType } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn, getFormattedDate } from "@/lib/utils";

type Props = {
  logs: Log[];
  showAll?: boolean;
};

export const LogsList = ({ logs, showAll = false }: Props) => {
  const sortedLogs = logs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, showAll ? undefined : 3);

  return (
    <div className="text-sm">
      <p className="mb-4">I log the important things in my life.</p>
      <div className="flex flex-col gap-4">
        {sortedLogs.map((log, index) => (
          <Link
            key={log.slug}
            href={`/logs/#${log.slug}`}
            className="group flex items-start gap-4 rounded-lg p-2 transition-colors hover:bg-primary/5"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-primary bg-background">
              <Icons
                name={(log.icon as IconsType) || "Circle"}
                size={16}
                className="text-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium group-hover:text-primary">
                {log.title}
              </span>
              <time dateTime={log.date} className="text-sm text-foreground/50">
                {getFormattedDate(log.date, "long")}
              </time>
            </div>
          </Link>
        ))}
      </div>
      {!showAll && logs.length > 3 && (
        <div className="mt-4">
          <Link href="/logs">
            <Button
              variant="ghost"
              className="w-full gap-2 hover:underline text-left flex items-center justify-start"
            >
              See all logs
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
