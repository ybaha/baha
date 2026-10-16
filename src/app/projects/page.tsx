import { PageTitle } from '@/components/page-title';
import EditorialProjectsLayout from '@/components/projects/versions/editorial';
import { LiveOperations } from '@/components/live-operations/live-operations';

export default function Page() {
  return (
    <div className="content-wrapper">
      <div className="@container content pb-8 font-sans [&_p]:mb-0">
        <PageTitle
          title="Projects"
          subtitle={
            <p className="mb-0 mt-2 text-body text-subtle">
              Products I’m proud of, apps I’ve shipped, and where it all started.
            </p>
          }
        />
        <EditorialProjectsLayout />
        <section className="mt-8 border-t border-[var(--lt-ring)] pt-6" aria-labelledby="projects-cluster-title">
          <h2 id="projects-cluster-title" className="mb-4 font-sans text-section-title font-semibold tracking-tight text-content">
            Behind the scenes
          </h2>
          <LiveOperations embedded />
        </section>
      </div>
    </div>
  );
}
