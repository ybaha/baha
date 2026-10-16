import { PageTitle } from '@/components/page-title';
import { DevEnvironment } from '@/components/tech-stack/dev-environment';
import { ExternalLink } from '@/components/ui/external-link';
import { Tabs } from '@/components/ui/tabs';

export default function Page() {
  return (
    <div className="content-wrapper">
      <div className="content pb-8">
        <PageTitle title="Tech Stack" />
        <Tabs
          label="Tech stack eras"
          defaultValue="post-ai"
          items={[
            { value: 'post-ai', label: 'Post-AI', content: <PostAi /> },
            { value: 'pre-ai', label: 'Pre-AI', content: <PreAi /> },
          ]}
        />
      </div>
    </div>
  );
}

function PostAi() {
  return (
    <div className="space-y-8">
      <p className="text-body text-subtle">
        Times have changed. The stack that matters most now is the environment I run agents from. It
        all lives in{' '}
        <ExternalLink
          href="https://github.com/ybaha/dotfiles"
          className="text-content underline underline-offset-4"
        >
          my dotfiles
        </ExternalLink>
      </p>
      <DevEnvironment />
      {POST_AI_SECTIONS.map((section) => (
        <section key={section.name}>
          <h2 className="text-section-title font-semibold mb-2">{section.name}</h2>
          <p className="text-body text-subtle mb-3">
            {section.description}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {section.items.map((item) => (
              <li
                key={item.name}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all px-3 py-2"
              >
                <span className="block text-body font-medium">{item.name}</span>
                <span className="block text-caption text-subtle">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PreAi() {
  return (
    <div className="space-y-8">
      {CATEGORIES.map((category) => (
        <CategorySection key={category.name} {...category} />
      ))}
    </div>
  );
}

const CategorySection = ({ name, description, items }: (typeof CATEGORIES)[number]) => {
  return (
    <section>
      <h2 className="text-section-title font-semibold mb-2">{name}</h2>
      <p className="text-body text-subtle mb-3">{description}</p>
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
    <span className="cursor-default rounded-full border border-neutral-200 px-3 py-1 text-body dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all">
      {name}
    </span>
  );
};

const POST_AI_SECTIONS = [
  {
    name: 'Skills',
    description: 'Reusable instructions the agent loads only when needed',
    items: [
      {
        name: 'worktree',
        detail: 'Spawns an isolated git worktree as a Herdr workspace with a fresh worker',
      },
      {
        name: 'artifact',
        detail: 'Turns an answer or report into a polished standalone HTML page',
      },
      {
        name: 'send-to-phone',
        detail: 'Uploads a file to Nextcloud so I can read it away from the desk',
      },
      {
        name: 'browser-use',
        detail: 'Drives a real browser for logins, forms and multi-step web tasks',
      },
      { name: 'council-mode', detail: 'Convenes a bounded panel of advisors to debate a decision' },
      {
        name: 'remove-dumb-comments',
        detail: 'Flags comments that restate the code and removes approved ones',
      },
    ],
  },
  {
    name: 'Extensions',
    description: 'Small TypeScript extensions that shape the Pi session',
    items: [
      {
        name: 'usage-status',
        detail: 'Footer showing model, context use and 5h/7d quota per provider',
      },
      {
        name: 'quota-cache',
        detail: 'Single-writer quota cache with per-provider TTLs and stale warnings',
      },
      {
        name: 'herdr-agent-state',
        detail: 'Reports agent state to Herdr so panes show what each agent is doing',
      },
      {
        name: 'worktree-watcher-status',
        detail: 'Footer status for background watchers spawned by the worktree skill',
      },
      { name: 'session-rename', detail: 'Keeps sessions named so they stay findable' },
      { name: 'artifact-command', detail: 'The /artifact command behind the artifact skill' },
    ],
  },
  {
    name: 'Dotfiles & Environment',
    description: 'One portable cockpit for every machine',
    items: [
      {
        name: 'dotfiles',
        detail: 'install.sh with dry-run and backups; macOS-first, Linux-safe baseline',
      },
      { name: 'Zsh + Antigen', detail: 'Shell setup with the dst theme and a fixed plugin set' },
      { name: 'Zed', detail: 'Editor preferences, for the moments I still read code myself' },
      {
        name: 'Tailscale SSH',
        detail: 'Tailnet access to my own boxes, used by skills like send-to-phone',
      },
      { name: 'ripgrep, fd, fzf, bat, zoxide', detail: 'CLI baseline from a reviewed Brewfile' },
      { name: 'gh, jq, uv, pnpm', detail: 'The rest of the day-to-day toolbelt' },
    ],
  },
  {
    name: 'Home Server',
    description: 'Self-hosted services on a Proxmox box at home',
    items: [
      { name: 'Proxmox', detail: 'The hypervisor everything else runs on' },
      {
        name: 'Nextcloud',
        detail: 'Files and sync; also where my agents drop documents for my phone',
      },
      {
        name: 'Immich',
        detail: 'Photos and videos, much nicer than Nextcloud for browsing images',
      },
      { name: 'Home Assistant', detail: 'Home automation' },
      { name: 'Hermes Agent', detail: 'An agent that lives on the server' },
      { name: 'Minecraft server', detail: 'Game server' },
    ],
  },
] as const;

const CATEGORIES = [
  {
    name: 'Languages',
    description: 'Programming languages I work with',
    items: ['TypeScript', 'JavaScript', 'Python', 'C++', 'PHP'],
  },
  {
    name: 'Frontend',
    description: 'Technologies and frameworks I use for building user interfaces',
    items: [
      'React.js',
      'Next.js',
      'React Native',
      'Redux',
      'MobX',
      'TailwindCSS',
      'SCSS',
      'Styled Components',
      'HTML5',
      'CSS3',
      'Jest.js',
      'Websockets',
      'Figma',
    ],
  },
  {
    name: 'Backend',
    description: 'Server-side technologies and databases',
    items: [
      'Node.js',
      'Express.js',
      'NestJS',
      'Bun',
      'Prisma',
      'MongoDB',
      'PostgreSQL',
      'Firebase',
      'Supabase',
    ],
  },
  {
    name: 'DevOps & Cloud',
    description: 'Development operations and cloud services',
    items: ['Git', 'GitHub', 'Docker', 'CI/CD', 'Vercel', 'AWS', 'Google Cloud Platform'],
  },
] as const;
