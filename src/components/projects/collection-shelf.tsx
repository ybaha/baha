'use client';

import { useState } from 'react';
import { ArrowUpRightIcon, ArrowRightIcon } from '@phosphor-icons/react/dist/ssr';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Project } from './data';
import { ProjectMark, projectPaperSurface } from './shared';
import { FolderArtwork } from './folder-artwork';

type Density = 'comfortable' | 'compact';

export function ProjectCollectionGrid({ projects, className }: { projects: Project[]; density?: Density; className?: string }) {
  return (
    <div role="list" className={cn('grid gap-2 @xl:grid-cols-2', className)}>
      {projects.map(project => (
        <div role="listitem" key={project.id}>
          <a data-project-id={project.id} href={project.linkHref ?? project.href} title={project.linkLabel} target="_blank" rel="noopener noreferrer" className="group flex h-full min-h-[76px] items-center gap-3 rounded-xl border border-[var(--lt-ring)] bg-foreground/[0.02] p-3 transition-colors hover:bg-foreground/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ProjectMark project={project} size={56} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium leading-snug text-foreground/85">{project.name}</span>
              <span className="mt-1 block text-[11px] text-foreground/50">{project.category ?? (project.kind === 'mobile' ? 'App' : 'Web')}{project.year ? ` · ${project.year}` : ''}{project.archived ? ' · Archived' : ''}</span>
            </span>
            <ArrowUpRightIcon size={15} className="shrink-0 text-foreground/35 transition-colors group-hover:text-foreground/80" aria-hidden="true" />
          </a>
        </div>
      ))}
    </div>
  );
}

export function CollectionShelf({ shelfId, title, description, projects, className }: {
  shelfId: string;
  title: string;
  description?: string;
  projects: Project[];
  className?: string;
  density?: Density;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [resetAfterClose, setResetAfterClose] = useState(false);
  function changeOpen(next: boolean) {
    setOpen(next);
    setResetAfterClose(!next);
    if (!next) { setHovered(false); setFocused(false); }
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <button id={`${shelfId}-folder-toggle`} type="button" aria-label={`Open ${title} collection`} className={cn('group flex w-full min-w-0 items-center gap-3 p-3 text-left transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', projectPaperSurface, className)}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onPointerMove={event => { if (event.pointerType === 'mouse') setResetAfterClose(false); }} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setResetAfterClose(false); }}>
          <FolderArtwork projects={projects} active={!resetAfterClose && (hovered || focused)} open={open} />
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-[24px] font-normal italic leading-none text-foreground">{title}</span>
            <span className="mt-2 block text-[11px] leading-relaxed text-foreground/50">{projects.length} {projects[0]?.kind === 'mobile' ? 'apps' : 'projects'}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-foreground/65">Browse <ArrowRightIcon size={12} aria-hidden="true" /></span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="@container flex max-h-[min(720px,calc(100dvh_-_32px))] w-[calc(100%_-_32px)] max-w-[768px] flex-col gap-0 overflow-hidden p-0 font-sans [background:var(--sb-panel-bg)] [box-shadow:var(--lt-e3)] motion-reduce:animate-none [&>button]:focus:ring-primary" aria-describedby={`${shelfId}-description`}>
        <header className="shrink-0 border-b border-[var(--lt-ring)] px-5 pb-4 pt-5 pr-14">
          <span className="text-[11px] text-foreground/45">Projects / Collections</span>
          <DialogTitle className="mt-1 font-serif text-[30px] font-normal italic leading-tight">{title}</DialogTitle>
          <DialogDescription id={`${shelfId}-description`} className="mb-0 mt-1 text-[12px] leading-relaxed text-foreground/55">{description ?? `${projects.length} projects from the collection.`}</DialogDescription>
        </header>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5"><ProjectCollectionGrid projects={projects} /></div>
      </DialogContent>
    </Dialog>
  );
}
