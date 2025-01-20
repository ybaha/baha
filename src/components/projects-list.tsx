import Image from "next/image";
import Link from "@/components/link";
import { cn } from "@/lib/utils";

const projects = [
  {
    name: "stellarzen",
    description: "A meditation and mindfulness app for space enthusiasts.",
    image: "/projects/stellarzen.png",
    url: "https://stellarzen.co",
  },
  {
    name: "Botguise",
    description:
      "AI-powered chatbot platform for seamless customer interactions.",
    image: "/projects/botguise.png",
    url: "https://botguise.com",
  },
  {
    name: "Poshet",
    description: "Dutch language learning platform with interactive exercises.",
    image: "/projects/poshet.png",
    url: "https://poshet.co",
  },
  {
    name: "Personal Website",
    description: "My digital garden where I share thoughts and experiments.",
    image: "/projects/baha.png",
    url: "https://baha.vercel.app",
  },
];

export function ProjectsList() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {projects.map((project) => (
        <Link
          key={project.name}
          href={project.url}
          className="group relative flex flex-col overflow-hidden rounded-xl border border-border p-3 hover:bg-background"
        >
          <div className="relative h-48 w-full overflow-hidden rounded-md">
            <Image
              src={project.image}
              alt={project.name}
              fill
              className={cn("object-cover border-border")}
              priority
            />
          </div>
          <div className="mt-4">
            <h3 className="font-medium">{project.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
