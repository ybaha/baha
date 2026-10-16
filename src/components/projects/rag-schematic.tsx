import type { ReactNode } from 'react';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  CpuIcon,
  DatabaseIcon,
  FileTextIcon,
  LaptopIcon,
  GlobeIcon,
  ChatCircleTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import { projectPaperSurface } from './shared';

function Step({
  icon,
  title,
  subtitle,
  featured = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`${projectPaperSurface} flex min-w-0 flex-col items-start gap-2 p-2 @xl:flex-row @xl:items-center @xl:gap-3 @xl:p-3 ${featured ? 'ring-1 ring-primary/30' : ''}`}
    >
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-caption font-medium text-content">{title}</span>
        <span className="mt-1 block text-caption leading-relaxed text-subtle">{subtitle}</span>
      </span>
    </div>
  );
}

function Arrow() {
  return (
    <span className="hidden place-items-center text-foreground/35 @xl:grid">
      <ArrowRightIcon size={16} className="hidden @xl:block" aria-hidden="true" />
      <ArrowDownIcon size={16} className="@xl:hidden" aria-hidden="true" />
    </span>
  );
}

export function RagSchematic() {
  return (
    <section
      aria-label="Karardex RAG architecture"
      className="mt-5 rounded-2xl border border-[var(--lt-ring)] bg-foreground/[0.02] p-4"
    >
      <h3 className="font-sans text-card-title font-semibold tracking-normal text-content">
        GPU power to build it. A laptop to run it.
      </h3>
      <p className="mb-0 mt-1 text-body text-subtle">
        The expensive embedding work happens once. Retrieval and the product live at home.
      </p>
      <div className="mb-2 mt-4 text-caption font-medium text-subtle">01 · Build the corpus</div>
      <div className="grid grid-cols-3 items-stretch gap-2 @xl:grid-cols-[1fr_16px_1fr_16px_1fr]">
        <Step icon={<FileTextIcon size={22} />} title="1M+ docs" subtitle="Embedded legal corpus" />
        <Arrow />
        <Step icon={<CpuIcon size={22} />} title="RTX 5090s" subtitle="Rented compute" featured />
        <Arrow />
        <Step icon={<DatabaseIcon size={22} />} title="Vector index" subtitle="Postgres + pgvector" />
      </div>
      <div className="my-3 flex items-center justify-center gap-2 text-caption text-subtle">
        <ArrowDownIcon size={13} aria-hidden="true" /> Embeddings come home to the laptop
      </div>
      <div className="mb-2 text-caption font-medium text-subtle">02 · Serve each question</div>
      <div className="grid grid-cols-3 items-stretch gap-2 @xl:grid-cols-[1fr_16px_1fr_16px_1fr]">
        <Step icon={<GlobeIcon size={22} />} title="Web / MCP" subtitle="Edge proxy" />
        <Arrow />
        <Step icon={<LaptopIcon size={22} />} title="Linux laptop" subtitle="App + API + RAG" featured />
        <Arrow />
        <Step icon={<ChatCircleTextIcon size={22} />} title="Answers" subtitle="Citations + LLMs" />
      </div>
      <p className="mb-0 mt-3 text-caption leading-relaxed text-subtle">
        Cloudflare / nginx at the edge · Redis & E5 queries at home · external LLMs generate the answer
      </p>
    </section>
  );
}
