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
            Currently working at <Link href="https://teifi.com">Teifi</Link>,
            building solutions for shopify plus brands.
            <br />
            Building <Link href="https://poshet.co/apps/pico">Pico Cards</Link>,
            <Link href="#">homefoods</Link> and some other project on the side.
          </p>

          <Suspense fallback={<LoadingSpinner />}>
            <h2 className="mb-4 mt-8 text-foreground">Writings</h2>
            <WritingList writings={allWritings} header="Writing" />

            <div className="flex flex-col mt-4">
              <p className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <Link href="/logs">Check out my journey</Link>
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <Link href="/writings">View all writings</Link>
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
