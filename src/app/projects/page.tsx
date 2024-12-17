import { PageTitle } from "@/components/page-title";
import { PROJECTS } from "@/lib/constants";

export default function Page() {
  return (
    <div className="content-wrapper">
      <div className="content">
        <PageTitle title="Projects" />
        {PROJECTS.map((project) => (
          <ProjectCard key={project.title} {...project} />
        ))}
      </div>
    </div>
  );
}

const ProjectCard = ({ title, description, url }: (typeof PROJECTS)[0]) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img className="h-10 w-10 rounded-full" src={url} alt="" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{title}</div>
            <div className="text-sm text-gray-500">{description}</div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <a
            href={url}
            target="_blank"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            View
          </a>
        </div>
      </div>
    </div>
  );
};
