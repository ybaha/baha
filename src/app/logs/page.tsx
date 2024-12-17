import { useEffect } from "react";
import { Icons, IconsType } from "@/components/icons";
import { JourneyCard } from "@/components/journey-card";
import { PageTitle } from "@/components/page-title";
import { GradientBg3 } from "@/components/gradient-bg";
import Logs from "./page.client";

export default async function Journey() {
  return (
    <>
      <GradientBg3 />
      <div className="content-wrapper bg-background">
        <div className="content">
          <PageTitle title={"Logs"} />
          <div className="flex flex-col items-stretch gap-12">
            <Logs />
          </div>
        </div>
        <div className="h-[32px]" />
      </div>
    </>
  );
}
