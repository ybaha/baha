import { Mdx } from "@/components/mdx-components";
import { PageTitle } from "@/components/page-title";
import { type Snippet, allSnippets } from "contentlayer2/generated";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

type Params = Promise<{
  slug: string[];
}>;

type Props = {
  params: Params;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function getSnippetFromParams(params: {
  slug: string[];
}): Promise<Snippet | null> {
  const slug = params?.slug?.join("/");
  const post = allSnippets.find((post) => post.slug === slug);
  console.log({ allSnippets });

  return post ?? null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const post = await getSnippetFromParams(params);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export async function generateStaticParams(): Promise<
  {
    slug: string[];
  }[]
> {
  return allSnippets?.map((post) => ({
    slug: post.slug.split("/"),
  }));
}

export default async function Snippet(p: Props) {
  const params = await p.params;
  const Snippet = await getSnippetFromParams(params);
  if (!Snippet) {
    return notFound();
  }
  return (
    <div className="flex flex-1 bg-background h-full">
      <div className="content-wrapper">
        <article className="content">
          <PageTitle
            title={Snippet.title}
            subtitle={
              <time dateTime={Snippet.date} className="text-foreground/50">
                {Snippet.date}
              </time>
            }
            className="mb-6 flex flex-col gap-3 text-foreground"
          />
          <Mdx code={Snippet.body.code} />
        </article>
      </div>
    </div>
  );
}
