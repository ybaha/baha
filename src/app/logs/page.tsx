import { PageTitle } from "@/components/page-title";
import { GradientBg3 } from "@/components/gradient-bg";
import { LogsTimeline } from "@/components/logs-timeline";
import { LogHashScroll } from "@/components/log-hash-scroll";

export default async function Journey() {
  return (
    <>
      <GradientBg3 />
      <div className="content-wrapper bg-background">
        <div className="content">
          <PageTitle title={"Logs"} />
          <div className="flex flex-col items-stretch gap-12">
            <LogsTimeline />
          </div>
        </div>
        <div className="h-[32px]" />
      </div>
      <LogHashScroll />
    </>
  );
}
