import Image, { type StaticImageData } from 'next/image';
import karardexScreenshot from '../../../public/projects/karardex-chat-verified.webp';
import postmixrScreenshot from '../../../public/projects/postmixr-preview.webp';
import type { ReactNode } from 'react';
import { StarIcon } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import type { OriginWebsite, Project } from './data';
import { FIRST_WEBSITE } from './data';
import { OriginQuote } from './origin-quote';
import { ExternalLink } from '@/components/ui/external-link';
import { SectionLabel } from '@/components/ui/section-label';

export const projectSurface = 'rounded-2xl [background:var(--sb-panel-bg)] [box-shadow:var(--lt-e2)]';
export const projectPaperSurface = 'rounded-2xl border border-[var(--lt-ring)] [background:var(--lt-sheen-s),linear-gradient(180deg,rgb(var(--sb-panel-from)),rgb(var(--sb-panel-to)))] [box-shadow:var(--lt-e1)]';

export function ProjectMark({ project, size = 40, className }: {
  project: Pick<Project, 'name' | 'markSrc' | 'markSrcDark'>;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn('relative inline-flex shrink-0 rounded-xl bg-white [box-shadow:var(--lt-e1)] dark:bg-[#151515]', className)} style={{ width: size, height: size }}>
      <Image src={project.markSrc} alt="" width={size} height={size} className={cn('h-full w-full rounded-xl border-0 object-contain', project.markSrcDark && 'dark:hidden')} />
      {project.markSrcDark && <Image src={project.markSrcDark} alt="" width={size} height={size} className="hidden h-full w-full rounded-xl border-0 object-contain dark:block" />}
      {project.name === 'Karardex' && <span role="img" aria-label="Star project" title="My star project" className="absolute -bottom-1 -right-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-background text-primary ring-2 ring-background"><StarIcon size={13} weight="fill" aria-hidden="true" /></span>}
    </span>
  );
}

const previews: Record<string, StaticImageData> = {
  '/projects/karardex-chat-verified.webp': karardexScreenshot,
  '/projects/postmixr-preview.webp': postmixrScreenshot,
};

export function ProductPreview({ project, className, priority }: {
  project: Pick<Project, 'name' | 'previewSrc' | 'markSrc'>;
  className?: string;
  priority?: boolean;
}) {
  const src = previews[project.previewSrc ?? ''] ?? project.markSrc;
  return (
    <div className={cn('w-full overflow-hidden rounded-xl bg-foreground/[0.025] [box-shadow:0_0_0_1px_var(--lt-ring)]', className)}>
      <Image src={src} alt={`${project.name} interface`} width={typeof src === 'string' ? 256 : undefined} height={typeof src === 'string' ? 256 : undefined} unoptimized className="block h-auto w-full rounded-none border-0" loading={priority ? 'eager' : undefined} fetchPriority={priority ? 'high' : undefined} />
    </div>
  );
}

export function ProjectLink({ project, children, className }: { project: Pick<Project, 'name' | 'href'>; children?: ReactNode; className?: string }) {
  return <ExternalLink href={project.href} className={className} title={`Visit ${project.name}`} aria-label={`Visit ${project.name}`}>{children ?? `Visit ${project.name}`}</ExternalLink>;
}

export function OriginStory({ story = FIRST_WEBSITE, compact = false, className }: { story?: OriginWebsite; compact?: boolean; className?: string }) {
  const source = story;
  return (
    <section aria-labelledby="origin-story-title" className={cn(projectPaperSurface, 'space-y-3 p-4 @xl:p-5', className)}>
      <header>
        <h2 id="origin-story-title" className="font-sans text-section-title font-semibold leading-tight tracking-tight text-content">Where it started · archived 2011</h2>
        <p className="mb-0 mt-1 text-body text-subtle">A website for our fourth-grade class.</p>
      </header>
      <div data-origin-card className={cn('grid items-start gap-5 @xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]', compact && 'gap-4')}>
        <div className="min-w-0">
          <p className="mb-0 max-w-xl text-body text-subtle">Mert and I made it with a no-code builder to help our teacher. We posted homework and used the chat page to talk with friends after school.</p>
          <OriginQuote original={source.quote} />
          <ExternalLink href={source.archiveHref} className="mt-3 text-caption">Sevgi Koleji 4-B · April 2011</ExternalLink>
        </div>
        {source.previewSrc && <a href={source.previewSrc} target="_blank" rel="noopener noreferrer" aria-label="View the full-size classroom website screenshot" title="Open full-size screenshot" className="block w-full overflow-hidden rounded-xl"><Image src={source.previewSrc} alt="Our original Sevgi Koleji 4-B class website" width={1728} height={1201} unoptimized className="block h-auto w-full rounded-none border-0" /></a>}
      </div>
    </section>
  );
}
