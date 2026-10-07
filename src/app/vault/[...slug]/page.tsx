import { MdxContent } from "@/components/mdx/mdx-content";
import { PageTitle } from "@/components/page-title";
import { getAllSnippets, getSnippetBySlug } from "@/lib/content/selectors";
import { Metadata } from "next";
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
}) {
  const slug = params?.slug?.join("/");
  return getSnippetBySlug(slug ?? "");
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const post = await getSnippetFromParams(params);

  if (!post) {
    return {};
  }

  const canonical = `/vault/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonical,
      type: "article",
    },
  };
}

export async function generateStaticParams(): Promise<
  {
    slug: string[];
  }[]
> {
  return getAllSnippets().map((post) => ({
    slug: post.slug.split("/"),
  }));
}

export default async function SnippetPage(p: Props) {
  const params = await p.params;
  const snippet = await getSnippetFromParams(params);
  if (!snippet) {
    return notFound();
  }
  return (
    <div className="flex flex-1 bg-background h-full">
      <div className="content-wrapper">
        <article className="content">
          <PageTitle
            title={snippet.title}
            subtitle={
              <time dateTime={snippet.date} className="text-foreground/50">
                {snippet.date}
              </time>
            }
            className="mb-6 flex flex-col gap-3 text-foreground"
          />
          <MdxContent source={snippet.body} />
        </article>
      </div>
    </div>
  );
}
