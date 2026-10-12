import { CollectionShelf } from '../collection-shelf';
import { EARLIER_PROJECTS, FEATURED_PROJECTS, MOBILE_PROJECTS } from '../data';
import { OriginStory, ProductPreview, ProjectLink, ProjectMark, projectSurface, projectPaperSurface } from '../shared';
import { SectionLabel } from '@/components/ui/section-label';
import { ProductDetails, ProductProof } from '../product-details';

export default function EditorialProjectsLayout() {
  const [karardex, postmixr] = FEATURED_PROJECTS;
  return (
    <div className="space-y-8">
      <article className={`${projectSurface} p-4 @xl:p-5`} aria-labelledby="karardex-feature-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><ProjectMark project={karardex} size={42} /><div><h2 id="karardex-feature-title" className="font-sans text-[24px] font-semibold leading-none tracking-tight text-foreground @xl:text-[28px]">Karardex</h2></div></div>
          <ProjectLink project={karardex} className="shrink-0 text-[12px]">Visit</ProjectLink>
        </div>
        <p className="mb-0 max-w-xl text-[14px] leading-relaxed text-foreground/70">Ask a question about Turkish law. Follow the research, read the answer, and trace every citation back to its source.</p>
        <div data-project-tags className="mb-4 mt-3 flex flex-wrap gap-1.5">
          {['Self-hosted from home laptop', 'RTX 5090 embedding runs', 'RAG'].map(label => <span key={label} className="rounded-md border border-[var(--lt-ring)] bg-background/60 px-2 py-1 text-[10px] leading-none text-foreground/60">{label}</span>)}
        </div>
        <ProductPreview project={karardex} priority />
        <div className="mt-4"><ProductDetails project={karardex} /></div>
      </article>

      <article className={`${projectPaperSurface} grid items-center gap-4 p-4 @xl:grid-cols-[minmax(0,1fr)_230px] @xl:p-5`} aria-labelledby="postmixr-feature-title">
        <div className="min-w-0"><div className="mb-2 flex items-center gap-3"><ProjectMark project={postmixr} size={36} /><div><h2 id="postmixr-feature-title" className="font-sans text-[24px] font-semibold leading-none tracking-tight text-foreground">Postmixr</h2></div></div><p className="mb-0 text-[13px] leading-relaxed text-foreground/65">One shared calendar to plan and publish across your social channels.</p><ProductProof project={postmixr} /><div className="mt-3 flex items-center gap-4"><ProductDetails project={postmixr} /><ProjectLink project={postmixr} className="text-[12px]">Visit Postmixr</ProjectLink></div></div>
        <ProductPreview project={postmixr} />
      </article>

      <section className={`${projectPaperSurface} p-4 @xl:p-5`} aria-labelledby="collections-title"><SectionLabel title="The rest of the collection" titleId="collections-title" description="Mobile releases and earlier experiments, kept in their own folders." /><div className="grid gap-3 @xl:grid-cols-2"><CollectionShelf shelfId="mobile-apps" title="Mobile apps" description="Viralty, Clean, and the other apps I’ve shipped." projects={MOBILE_PROJECTS} /><CollectionShelf shelfId="earlier-work" title="Earlier work" description="Websites, side projects, and things I learned along the way." projects={EARLIER_PROJECTS} /></div></section>
      <OriginStory />
    </div>
  );
}
