import { notFound } from 'next/navigation';
import { PageTitle } from '@/components/page-title';
import { Metadata } from 'next';
import { Mdx } from '@/components/mdx-components';
import { cn, getFormattedDate } from '@/lib/utils';
import { ClientComments } from './client-comments';
import Tags from '@/components/tags';
import { getAllWritings, getAllWritingSlugs, getWritingBySlug } from '@/queries/writings';
import { type Writing } from 'contentlayer2/generated';

type Params = Promise<{
  slug: string[];
}>;

type Props = {
  params: Params;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getWritingFromParams(params: { slug: string[] }): Promise<Writing | null> {
  const slug = params?.slug?.join('/');
  const post = await getWritingBySlug(slug);

  return post ?? null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const post = await getWritingFromParams(params);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const allWritingSlugs = await getAllWritingSlugs();
  return allWritingSlugs.map((slug) => ({
    slug,
  }));
}

export default async function Writing(props: Props) {
  const params = await props.params;
  const writing = await getWritingFromParams(params);

  if (!writing) {
    return notFound();
  }

  return (
    <div className="flex flex-1 bg-background h-full">
      <div className="content-wrapper">
        <article className="content">
          <PageTitle
            title={writing.title}
            tags={writing.tags}
            subtitle={
              <section className="flex gap-4 items-center flex-wrap-reverse justify-between">
                {/* {writing.aiGenerated && (
                  <Link
                    href={`/writings/how-my-blog-works`}
                    className="text-primary flex items-center justify-center text-sm gap-1"
                  >
                    <Sparkles size={16} className="text-primary" />
                    <span className="text-xs md:text-sm font-semibold">
                      See how this post was generated
                    </span>
                  </Link>
                )} */}
                <Tags tags={writing.tags ?? []} isStatic />
                <time dateTime={writing.date} className="text-foreground/50 text-xs md:text-sm">
                  {getFormattedDate(writing.date, 'long')}
                </time>
              </section>
            }
            className="mb-6 flex flex-col gap-3 text-foreground"
          />
          {!!writing.image && (
            <img
              src={writing.image}
              alt={writing.title}
              className={cn('mb-6 h-[200px] md:h-[280px] object-fill', writing.imageClassName)}
            />
          )}
          <Mdx code={writing.body.code} />
          <hr className="my-16" />
          {/* <ClientComments slug={writing.slug} /> */}
        </article>
      </div>
    </div>
  );
}
