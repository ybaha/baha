import { Suspense } from 'react';

import { LoadingSpinner } from '@/components/loading-spinner';
import { WritingList } from '@/components/writing-list';
import { PageTitle } from '@/components/page-title';
import { allWritings } from 'contentlayer2/generated';
import Link from '@/components/link';
import { ArrowRight } from 'lucide-react';
import { GeolocationSender } from './page.client';
import { PROJECTS } from '@/lib/constants';

export default async function Home() {
  const picoCards = PROJECTS.find((project) => project.name === 'pico cards')!;
  const projectCount = PROJECTS.filter(
    (project) => project.year === new Date().getFullYear(),
  ).length;
  return (
    <>
      <GeolocationSender />
      <div className="content-wrapper text-foreground">
        <div className="content ">
          <PageTitle title="Home" className="lg:hidden" />
          <p>
            Yusuf Baha, a software engineer based in{' '}
            <Link
              href="https://en.wikipedia.org/wiki/Rotterdam"
              image="https://poshet.nl/images/rotterdam.jpg"
            >
              Rotterdam
            </Link>
            , The Netherlands.
          </p>

          <p>
            Currently working at <Link href="https://teifi.com">Teifi</Link>, building solutions for
            shopify plus brands.
            <br />
            {/* Building{' '}
            <Link href={picoCards.url} image={picoCards.image}>
              Pico Cards
            </Link>
            ,<Link href="#">homefoods</Link> and some other project on the side. */}
          </p>
          <p>
            Built <Link href="/projects">{projectCount} projects</Link> this year. More on the way.
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
