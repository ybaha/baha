import { CollectionShelf } from '../collection-shelf';
import { EARLIER_PROJECTS, FEATURED_PROJECTS, MOBILE_PROJECTS } from '../data';
import { OriginStory, ProductPreview, ProjectLink, ProjectMark, SectionLabel } from '../shared';
import { ProductDetails, ProductProof } from '../product-details';

export default function ProjectIndexLayout() {
  return (
    <div className="space-y-7">
      <section aria-label="Selected products">
        {FEATURED_PROJECTS.map((project, index) => <article key={project.id} className="grid items-center gap-4 border-b border-[var(--lt-ring)] py-5 first:pt-0 @xl:grid-cols-[minmax(0,1fr)_160px]">
          <div className="min-w-0"><div className="flex items-center gap-3"><span className="text-[11px] tabular-nums text-foreground/35">0{index + 1}</span><ProjectMark project={project} size={34} /><h2 className="font-sans text-[26px] font-semibold leading-none tracking-tight text-foreground">{project.name}</h2></div><p className="mb-0 mt-3 max-w-md text-[13px] leading-relaxed text-foreground/65">{index === 0 ? 'Source-backed Turkish legal research, document context, and MCP access.' : 'Multi-platform scheduling from one shared content calendar.'}</p><ProductProof project={project} /><div className="mt-3 flex items-center gap-4"><ProductDetails project={project} /><ProjectLink project={project} className="text-[12px]">{new URL(project.href).hostname}</ProjectLink></div></div>
          <ProductPreview project={project} className="hidden @xl:block" />
        </article>)}
      </section>
      <section aria-labelledby="index-collections-title"><SectionLabel title="Collections" titleId="index-collections-title" /><div className="grid gap-3 @xl:grid-cols-2"><CollectionShelf shelfId="mobile-apps" title="Mobile apps" description="All nine app releases, with Viralty and Clean up front." projects={MOBILE_PROJECTS} /><CollectionShelf shelfId="earlier-work" title="Earlier work" description="Earlier websites and side projects." projects={EARLIER_PROJECTS} /></div></section>
      <OriginStory compact />
    </div>
  );
}
