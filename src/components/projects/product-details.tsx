'use client';

import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Project } from './data';
import { PRODUCT_DETAILS } from './details';
import { RagSchematic } from './rag-schematic';
import { ProductPreview, ProjectLink, ProjectMark, projectPaperSurface } from './shared';

export function ProductProof({ project }: { project: Project }) {
  const detail = PRODUCT_DETAILS[project.id];
  if (!detail?.metrics) return null;
  return <p title={`Production snapshot: ${detail.snapshot}`} className="mb-0 mt-3 text-[11px] tabular-nums text-foreground/60 underline decoration-foreground/25 underline-offset-4">{`${detail.metrics[0].value.toLocaleString('en-US')} registered accounts · ${detail.metrics[1].value >= 1000 ? `${(Math.floor(detail.metrics[1].value / 1000) * 1000).toLocaleString('en-US')}+` : detail.metrics[1].value.toLocaleString('en-US')} tool runs`}</p>;
}

export function ProductDetails({ project }: { project: Project }) {
  const detail = PRODUCT_DETAILS[project.id];
  if (!detail) return null;
  return (
    <Dialog>
      <DialogTrigger asChild><button type="button" aria-label={`View ${project.name} details`} className="inline-flex items-center gap-1.5 rounded-sm text-[12px] text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Details <ArrowRightIcon size={13} aria-hidden="true" /></button></DialogTrigger>
      <DialogContent className="@container flex max-h-[min(840px,calc(100dvh_-_32px))] w-[calc(100%_-_32px)] max-w-[768px] flex-col gap-0 overflow-hidden p-0 font-sans [background:var(--sb-panel-bg)] [box-shadow:var(--lt-e3)] motion-reduce:animate-none [&>button]:focus:ring-primary">
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--lt-ring)] px-5 py-5 pr-14">
          <ProjectMark project={project} size={46} />
          <div className="min-w-0 flex-1"><DialogTitle className="font-serif text-[30px] font-normal leading-none">{project.name}</DialogTitle><DialogDescription className="mb-0 mt-1 text-[11px] text-foreground/50">Product & engineering</DialogDescription></div>
          <ProjectLink project={project} className="text-[12px]">Visit</ProjectLink>
        </header>
        <div className="min-h-0 overflow-y-auto p-5">
          <p className="mb-0 text-[14px] leading-relaxed text-foreground/70">{detail.summary}</p>
          {project.id === 'karardex' && <RagSchematic />}
          {detail.metrics && <section aria-label="Production usage" className="mt-5">
            <div className="grid grid-cols-2 gap-3">{detail.metrics.map(metric => <div key={metric.label} className={`${projectPaperSurface} p-4`}><span className="block text-[28px] font-medium leading-none tabular-nums text-foreground/90">{metric.value.toLocaleString('en-US')}</span><span className="mt-2 block text-[11px] text-foreground/55">{metric.label}</span></div>)}</div>
            <p className="mb-0 mt-3 text-[10px] leading-relaxed text-foreground/45">Production snapshot · <time dateTime={detail.snapshot}>{new Date(detail.snapshot!).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC</time></p>
          </section>}
          <section className="mt-6" aria-label="Technology stack"><h3 className="mb-3 font-sans text-[13px] font-medium tracking-normal text-foreground/85">The stack</h3><div className="flex flex-wrap gap-1.5">{detail.stack.map(item => <span key={item} className="rounded-lg border border-[var(--lt-ring)] bg-foreground/[0.025] px-2.5 py-1.5 text-[11px] text-foreground/70">{item}</span>)}</div></section>
          {project.id !== 'karardex' && detail.hosting && <section className={`${projectPaperSurface} mt-5 p-4`} aria-label="Hosting architecture"><h3 className="font-serif text-[22px] font-normal leading-snug text-foreground">{detail.hosting.title}</h3><p className="mb-0 mt-2 text-[12px] leading-relaxed text-foreground/65">{detail.hosting.description}</p><div className="mt-4 flex flex-wrap items-center gap-2" aria-label={detail.hosting.flow.join(' → ')}>{detail.hosting.flow.map((step, index) => <span key={step} className="inline-flex items-center gap-2 text-[11px] text-foreground/60">{index > 0 && <ArrowRightIcon size={12} aria-hidden="true" />}<span className="rounded-md bg-primary/10 px-2 py-1 text-foreground/75">{step}</span></span>)}</div></section>}
          <section className="mt-5 space-y-4" aria-label="Engineering highlights">{detail.highlights.map(item => <div key={item.title}><h3 className="font-sans text-[13px] font-medium tracking-normal text-foreground/85">{item.title}</h3><p className="mb-0 mt-1 text-[12px] leading-relaxed text-foreground/60">{item.description}</p></div>)}</section>
          {project.id !== 'karardex' && <div className="mt-6"><ProductPreview project={project} /></div>}
          {detail.metricNote && <p className="mb-0 mt-5 border-t border-[var(--lt-ring)] pt-4 text-[10px] leading-relaxed text-foreground/45">{detail.metricNote}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
