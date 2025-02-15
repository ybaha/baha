import { Suspense } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { WritingList } from "@/components/writing-list";
import { PageTitle } from "@/components/page-title";
import { allWritings } from "contentlayer2/generated";
import Link from "@/components/link";
import { ArrowRight } from "lucide-react";
import { GeolocationSender } from "./page.client";

export default async function Home() {
  return (
    <>
      <GeolocationSender />
      <div className="content-wrapper text-foreground">
        <div className="content ">
          <PageTitle title="Home" className="lg:hidden" />
          <p>
            Yusuf Baha, a software engineer based in Rotterdam, The Netherlands.
          </p>

          <p>
            Currently at <Link href="https://miyagami.com">Miyagami</Link>,
            working on different projects and products.
          </p>

          <Suspense fallback={<LoadingSpinner />}>
            <h2 className="mb-4 mt-8 text-foreground">Writings</h2>
            <WritingList writings={allWritings} header="Writing" />

            {/* <h2 className="mb-4 mt-8 text-foreground">Projects</h2>
            <ProjectsList />

            <h2 className="mb-4 mt-8 text-foreground">Logs</h2>
            <LogsList logs={allLogs} /> */}

            <div className="flex flex-col mt-4">
              <p className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <Link href="/writing">View all writings</Link>
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <Link href="/projects">View all projects</Link>
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <Link href="/tech-stack">Check out my tech stack</Link>
              </p>
            </div>
          </Suspense>
        </div>
      </div>
    </>
  );
}
