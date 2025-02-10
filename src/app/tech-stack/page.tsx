import { PageTitle } from "@/components/page-title";

export default function Page() {
  return (
    <div className="content-wrapper">
      <div className="content">
        <PageTitle title="Tech Stack" />
        <div className="space-y-8">
          {CATEGORIES.map((category) => (
            <CategorySection key={category.name} {...category} />
          ))}
        </div>
      </div>
    </div>
  );
}

const CategorySection = ({
  name,
  description,
  items,
}: (typeof CATEGORIES)[number]) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">{name}</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <TechBadge key={item} name={item} />
        ))}
      </div>
    </section>
  );
};

const TechBadge = ({ name }: { name: string }) => {
  return (
    <span className="px-3 py-1 text-sm rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all">
      {name}
    </span>
  );
};

const CATEGORIES = [
  {
    name: "Languages",
    description: "Programming languages I work with",
    items: ["TypeScript", "JavaScript", "Python", "C++", "PHP"],
  },
  {
    name: "Frontend",
    description:
      "Technologies and frameworks I use for building user interfaces",
    items: [
      "React.js",
      "Next.js",
      "React Native",
      "Redux",
      "MobX",
      "TailwindCSS",
      "SCSS",
      "Styled Components",
      "HTML5",
      "CSS3",
      "Jest.js",
      "Websockets",
      "Figma",
    ],
  },
  {
    name: "Backend",
    description: "Server-side technologies and databases",
    items: [
      "Node.js",
      "Express.js",
      "NestJS",
      "Bun",
      "Prisma",
      "MongoDB",
      "PostgreSQL",
      "Firebase",
      "Supabase",
    ],
  },
  {
    name: "DevOps & Cloud",
    description: "Development operations and cloud services",
    items: [
      "Git",
      "GitHub",
      "Docker",
      "CI/CD",
      "Vercel",
      "AWS",
      "Google Cloud Platform",
    ],
  },
] as const;
