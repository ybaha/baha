import { PageTitle } from "@/components/page-title";
import { getAllSnippetsMeta } from "@/lib/content/selectors";
import Link from "next/link";

export default function Vault() {
  const snippets = getAllSnippetsMeta();

  return (
    <div className="">
      {snippets.map((writing) => (
        <Link
          key={writing.id}
          href={`/vault/${writing.slug}`}
          className="flex flex-col gap-1 border-b border-foreground/20 px-4 py-3 text-sm hover:bg-primary/5"
        >
          <span className="font-medium">{writing.title}</span>
          <span className="text-foreground/50">{writing.date}</span>
        </Link>
      ))}
    </div>
  );
}
