import { CollectionShelf } from '../collection-shelf';
import { EARLIER_PROJECTS, FEATURED_PROJECTS, MOBILE_PROJECTS } from '../data';
import { OriginStory, ProductPreview, ProjectLink, ProjectMark, SectionLabel, projectSurface, projectPaperSurface } from '../shared';
import { ProductDetails, ProductProof } from '../product-details';

export default function WorkspaceProjectsLayout() {
  return (
    <div className="space-y-7">
      <section aria-label="Selected web products" className="grid gap-4 @2xl:grid-cols-[1.15fr_1fr]">
        {FEATURED_PROJECTS.map((project, index) => <article key={project.id} data-featured-project={project.id} className={`${index === 0 ? projectSurface : projectPaperSurface} flex min-w-0 flex-col overflow-hidden`}>
          <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><div className="flex min-w-0 items-center gap-2.5"><ProjectMark project={project} size={34} /><h2 className="font-sans text-[22px] font-semibold leading-none tracking-tight text-foreground @xl:text-[24px]">{project.name}</h2></div><ProjectLink project={project} className="text-[11px]">Visit</ProjectLink></header>
          <div className="px-3"><ProductPreview project={project} priority={index === 0} /></div>
          <div className="flex flex-1 flex-col px-4 pb-4 pt-3"><p className="mb-0 text-[13px] leading-relaxed text-foreground/70">{index === 0 ? 'Turkish law, researched with citations you can follow.' : 'A shared calendar for everything you publish.'}</p><ProductProof project={project} /><div className="mt-3 flex items-center justify-between gap-3"><ProductDetails project={project} /><span className="text-[11px] text-foreground/45">{new URL(project.href).hostname}</span></div></div>
        </article>)}
      </section>
      <section className="rounded-2xl border border-[var(--lt-ring)] bg-foreground/[0.02] p-4 @xl:p-5" aria-labelledby="workspace-collections-title"><SectionLabel title="On the shelf" titleId="workspace-collections-title" description="Two folders, a few years of shipping." /><div className="grid gap-3 @xl:grid-cols-2"><CollectionShelf shelfId="mobile-apps" title="Mobile apps" description="Viralty and Clean first, followed by earlier releases." projects={MOBILE_PROJECTS} /><CollectionShelf shelfId="earlier-work" title="Earlier work" description="Earlier websites and side projects." projects={EARLIER_PROJECTS} /></div></section>
      <OriginStory />
    </div>
  );
}
