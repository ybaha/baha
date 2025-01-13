import { notFound } from "next/navigation";
import { PageTitle } from "@/components/page-title";
import { type Writing, allWritings } from "contentlayer2/generated";
import { Metadata } from "next";
import { Mdx } from "@/components/mdx-components";
import { cn, getFormattedDate } from "@/lib/utils";
import { ClientComments } from "./client-comments";

type Params = Promise<{
  slug: string[];
}>;

type Props = {
  params: Params;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getWritingFromParams(params: {
  slug: string[];
}): Promise<Writing | null> {
  const slug = params?.slug?.join("/");
  const post = allWritings.find((post) => post.slug === slug);

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
  return allWritings?.map((post) => ({
    slug: post.slug.split("/"),
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
                {writing.tags && writing.tags.length > 0 && (
                  <div className="overflow-hidden">
                    <div className="flex gap-1 flex-wrap">
                      {writing.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "text-[11px] px-1.5 py-[0px] rounded-full whitespace-nowrap font-serif italic",
                            "bg-primary/10 text-primary"
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <time
                  dateTime={writing.date}
                  className="text-foreground/50 text-xs md:text-sm"
                >
                  {getFormattedDate(writing.date, "long")}
                </time>
              </section>
            }
            className="mb-6 flex flex-col gap-3 text-foreground"
          />
          {!!writing.image && (
            <img
              src={writing.image}
              alt={writing.title}
              className={cn(
                "mb-6 h-[200px] md:h-[280px] object-fill",
                writing.imageClassName
              )}
            />
          )}
          <Mdx code={writing.body.code} />
          <hr className="my-16" />
          <ClientComments slug={writing.slug} />
        </article>
      </div>
    </div>
  );
}
