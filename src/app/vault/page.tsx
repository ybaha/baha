import { PageTitle } from "@/components/page-title";
import { allSnippets } from "contentlayer2/generated";
import Link from "next/link";

export default function Vault() {
  return (
    <div className="">
      {allSnippets
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((writing) => (
          <Link
            key={writing._id}
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
