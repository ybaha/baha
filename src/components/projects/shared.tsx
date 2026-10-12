import Image, { type StaticImageData } from 'next/image';
import karardexScreenshot from '../../../public/projects/karardex-chat-verified.webp';
import postmixrScreenshot from '../../../public/projects/postmixr-preview.webp';
import type { ReactNode } from 'react';
import { ArrowUpRightIcon, StarIcon } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import { FIRST_WEBSITE, type OriginWebsite, type Project } from './data';
import { OriginQuote } from './origin-quote';

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

export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-1.5 rounded-sm text-foreground/75 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}>{children}<ArrowUpRightIcon size={14} aria-hidden="true" className="shrink-0" /></a>;
}

export function ProjectLink({ project, children, className }: { project: Pick<Project, 'name' | 'href'>; children?: ReactNode; className?: string }) {
  return <ExternalLink href={project.href} className={className}>{children ?? `Visit ${project.name}`}</ExternalLink>;
}

export function SectionLabel({ title, description, className, titleId }: { title: string; description?: string; className?: string; titleId?: string }) {
  return <header className={cn('mb-4', className)}><h2 id={titleId} className="font-serif text-[26px] font-normal italic leading-tight text-foreground">{title}</h2>{description && <p className="mb-0 mt-1 text-[13px] leading-relaxed text-foreground/55">{description}</p>}</header>;
}

export function OriginStory({ story = FIRST_WEBSITE, compact = false, className }: { story?: OriginWebsite; compact?: boolean; className?: string }) {
  return (
    <section aria-labelledby="origin-story-title" className={cn(projectPaperSurface, 'grid items-center gap-5 p-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] @xl:p-5', compact && 'gap-4', className)}>
      <div className="min-w-0">
        <span className="text-[11px] text-foreground/45">Where it started · archived 2011</span>
        <h2 id="origin-story-title" className="mb-2 mt-1 font-serif text-[27px] font-normal italic leading-tight text-foreground">A website for our fourth-grade class.</h2>
        <p className="mb-0 max-w-xl text-[13px] leading-relaxed text-foreground/65">Mert and I made it with a no-code builder to help our teacher. We posted homework and used the chat page to talk with friends after school.</p>
        <OriginQuote original={story.quote} />
        <ExternalLink href={story.archiveHref} className="mt-3 text-[12px]">Sevgi Koleji 4-B · April 2011</ExternalLink>
      </div>
      {story.previewSrc && <a href={story.previewSrc} target="_blank" rel="noopener noreferrer" aria-label="View the full-size classroom website screenshot" title="Open full-size screenshot" className="block w-full overflow-hidden rounded-xl"><Image src={story.previewSrc} alt="Our original Sevgi Koleji 4-B class website" width={1728} height={1201} unoptimized className="block h-auto w-full rounded-none border-0" /></a>}
    </section>
  );
}
