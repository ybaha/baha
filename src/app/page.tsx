import { Suspense } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { WritingList } from "@/components/writing-list";
import { LogsList } from "@/components/logs-list";
import { PageTitle } from "@/components/page-title";
import { allWritings } from "contentlayer2/generated";
import { allLogs } from "contentlayer2/generated";
import { sendTelegramMessage } from "@/lib/sendTelegramMessage";

export default async function Home() {
  await sendTelegramMessage("Hello");

  return (
    <>
      <div className="content-wrapper text-foreground">
        <div className="content ">
          <PageTitle title="Home" className="lg:hidden" />
          <p>
            Yusuf Baha, a software engineer based in Rotterdam, The Netherlands.
          </p>

          <p>
            Currently at Miyagami, working on different projects and products.
          </p>

          <Suspense fallback={<LoadingSpinner />}>
            <h2 className="mb-4 mt-8 text-foreground">Writings</h2>
            <WritingList writings={allWritings} header="Writing" />

            <h2 className="mb-4 mt-8 text-foreground">Logs</h2>
            <LogsList logs={allLogs} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
