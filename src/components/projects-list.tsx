"use client";

import Image from "next/image";
import Link from "@/components/link";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const projects = [
  {
    name: "stellarzen",
    description:
      "stellarzen offers personalized astrological insights, interpreting your birth chart to guide personal growth and important life decisions.",
    image: "/projects/stellarzen.png",
    url: "https://stellarzen.co",
  },
  {
    name: "Botguise",
    description:
      "BotGuise creates AI-powered chatbots that bring your favorite personalities to life, blending entertainment and engagement.",
    image: "/projects/botguise.png",
    url: "https://botguise.com",
  },
  {
    name: "Poshet",
    description:
      "Poshet crafts tailored, SEO-first digital experiences that transform businesses with expertly designed websites, e-commerce solutions, and web apps to drive customer conversions.",
    image: "/projects/poshet.png",
    url: "https://poshet.co",
  },
  {
    name: "Personal Website",
    description: "My digital garden where I share my thoughts and experiences.",
    image: "/projects/baha.png",
    url: "https://baha.vercel.app",
  },
  {
    name: "Fullsocial",
    description:
      "Fullsocial is a platform that helps you get image assets from spotify in high quality, album covers, artist images, user images, etc.",
    image: "/projects/fullsocial.png",
    url: "https://fullsocial.co",
    abandoned: true,
  },
];

export function ProjectsList() {
  return (
    <>
      {/* Mobile View - Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:hidden">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>

      {/* Desktop View - Carousel */}
      <div className="hidden md:block">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {projects.map((project) => (
              <CarouselItem
                key={project.name}
                className="pl-2 md:pl-4 md:basis-1/2"
              >
                <ProjectCard project={project} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </>
  );
}

// Extracted ProjectCard component for reuse
function ProjectCard({ project }: { project: (typeof projects)[number] }) {
  return (
    <Link
      href={project.url}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border p-3 hover:bg-background",
        project.abandoned && "opacity-70 pointer-events-none cursor-not-allowed"
      )}
      onClick={(e) => {
        if (project.abandoned) {
          e.preventDefault();
        }
      }}
    >
      <div className="relative h-48 w-full overflow-hidden rounded-md">
        <Image
          src={project.image}
          alt={project.name}
          fill
          className={cn("object-cover border-border", {
            "opacity-60": project.abandoned,
          })}
          priority
        />
        {project.abandoned && (
          <div className="absolute right-2 top-2 rounded-full bg-red-500/80 px-2 py-1 text-xs font-medium text-white">
            Abandoned
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3
          className={cn("font-medium", {
            "text-muted-foreground": project.abandoned,
          })}
        >
          {project.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.description}
        </p>
      </div>
    </Link>
  );
}
