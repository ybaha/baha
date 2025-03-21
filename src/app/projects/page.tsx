import { PageTitle } from "@/components/page-title";
import { PROJECTS } from "@/lib/constants";
import { SquareArrowOutUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="content-wrapper">
      <div className="content pb-8">
        <PageTitle title="Projects" />
        {PROJECTS.map((project) => (
          <ProjectCard key={project.name} {...project} />
        ))}
      </div>
    </div>
  );
}

const ProjectCard = ({
  name,
  description,
  url,
  image,
  abandoned,
}: (typeof PROJECTS)[0]) => {
  return (
    <div className="mb-8 rounded-lg border border-neutral-200 p-6 transition-all hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500">
      <div className="flex flex-col gap-4 sm:flex-row">
        {image && (
          <div className="relative h-48 w-full shrink-0 sm:h-32 sm:w-52">
            <Image
              src={image}
              alt={name}
              fill
              className="rounded-lg object-cover"
            />
          </div>
        )}
        <div className="flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-nowrap">{name}</h3>
              {abandoned && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                  Archived
                </span>
              )}
              {url && (
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full justify-end items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                >
                  View Project
                  <SquareArrowOutUpRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
