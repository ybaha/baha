import type { ReactNode } from 'react';
import { DeviceMobileIcon, HardDrivesIcon, LaptopIcon } from '@phosphor-icons/react/dist/ssr';
import { ExternalLink } from '@/components/ui/external-link';
import { cn } from '@/lib/utils';

type Dot = 'idle' | 'working' | 'quiet';

type Worktree = {
  name: string;
  dot: Dot;
  selected?: boolean;
};

type Workspace = {
  name: string;
  dot: Dot;
  branch?: string;
  behind?: number;
  worktrees?: readonly Worktree[];
};

type Machine = {
  name: string;
  connected?: boolean;
  workspaces: readonly Workspace[];
};

const MACHINES: readonly Machine[] = [
  {
    name: 'Local',
    workspaces: [
      { name: 'pi-orchestra', dot: 'idle', branch: 'main' },
      {
        name: 'karardex',
        dot: 'idle',
        branch: 'main',
        behind: 6,
        worktrees: [
          { name: 'frontend-ui-fixes', dot: 'idle' },
          { name: 'chat-cache-persist', dot: 'quiet' },
        ],
      },
      {
        name: 'baha',
        dot: 'idle',
        branch: 'main',
        worktrees: [{ name: 'tech-stack-update', dot: 'working', selected: true }],
      },
      { name: 'dotfiles', dot: 'idle', branch: 'main' },
      { name: 'btop', dot: 'quiet' },
    ],
  },
  {
    name: 'Home',
    connected: true,
    workspaces: [
      { name: 'pi-orchestra', dot: 'idle', branch: 'main' },
      {
        name: 'postmixr',
        dot: 'idle',
        branch: 'main',
        worktrees: [{ name: 'share-cards', dot: 'working' }],
      },
      { name: 'social-slides', dot: 'idle', branch: 'main' },
    ],
  },
];

export function DevEnvironment() {
  return (
    <section aria-labelledby="dev-environment-title">
      <h2 id="dev-environment-title" className="text-section-title font-semibold mb-2">
        Dev Environment
      </h2>
      <p className="text-body text-content mb-4">
        Herdr is always open on my laptop as the orchestrator. Pi runs in every workspace, on the
        laptop and on a remote dev machine that never closes, so I can keep coding when I&apos;m
        out. Tailscale ties them together with my phone.
      </p>
      <figure className="m-0">
        <div className="relative rounded-2xl border border-dashed border-primary/35 p-3 pt-5 sm:p-4 sm:pt-6">
          <span className="absolute -top-2.5 left-4 bg-background px-2 text-caption font-medium uppercase tracking-wide text-subtle">
            Tailscale network
          </span>
          <Device
            icon={<LaptopIcon size={16} aria-hidden="true" />}
            title="Laptop"
            tag="orchestrator"
          >
            <HerdrWindow />
          </Device>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Device
              icon={<HardDrivesIcon size={16} aria-hidden="true" />}
              title="Remote dev machine"
              tag="always on"
            >
              <p className="m-0 text-caption text-subtle">
                A machine at home that stays open, so I can code from anywhere. Agents run directly
                on it, and it shows up in the laptop&apos;s Herdr as its own machine.
              </p>
            </Device>
            <Device
              icon={<DeviceMobileIcon size={16} aria-hidden="true" />}
              title="Phone"
              tag="Collie"
            >
              <p className="m-0 text-caption text-subtle">
                <ExternalLink
                  href="https://github.com/AltanS/collie"
                  className="text-content underline underline-offset-4"
                >
                  Collie
                </ExternalLink>{' '}
                is a mobile client for Herdr. Its web app is saved to my home screen, so I can check
                on and steer agents from anywhere.
              </p>
            </Device>
          </div>
        </div>
        <figcaption className="mt-2 text-caption text-subtle">
          Illustrative layout. Workspace names and statuses are examples.
        </figcaption>
      </figure>
    </section>
  );
}

function Device({
  icon,
  title,
  tag,
  children,
}: {
  icon: ReactNode;
  title: string;
  tag: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-background-tertiary p-3 dark:border-neutral-700">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-subtle">{icon}</span>
        <span className="text-body font-medium">{title}</span>
        <span className="ml-auto rounded-full border border-neutral-200 px-2 py-0.5 text-caption text-subtle dark:border-neutral-700">
          {tag}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatusDot({ kind }: { kind: Dot }) {
  return (
    <span className="flex h-2 w-2 shrink-0 items-center justify-center" aria-hidden="true">
      <span
        className={cn(
          'rounded-full',
          kind === 'idle' && 'h-2 w-2 border-[1.5px] border-[#a6e3a1]',
          kind === 'working' && 'h-2 w-2 bg-[#f9e2af]',
          kind === 'quiet' && 'h-1 w-1 bg-[#6c7086]',
        )}
      />
    </span>
  );
}

function HerdrWindow() {
  return (
    <div
      role="img"
      aria-label="Illustration of Herdr: a sidebar listing machines, each with its workspaces and git worktrees, next to a Pi session"
      className="overflow-hidden rounded-lg border border-black/20 bg-[#1e1e2e] font-[family-name:var(--font-geist-mono)] text-[11px] leading-5 text-[#cdd6f4]"
    >
      <div className="flex items-center gap-1.5 border-b border-white/5 bg-[#181825] px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-[#f38ba8]" />
        <span className="h-2 w-2 rounded-full bg-[#f9e2af]" />
        <span className="h-2 w-2 rounded-full bg-[#a6e3a1]" />
        <span className="ml-2 text-[10px] text-[#6c7086]">⌥⌘1</span>
        <span className="text-[10px] text-[#a6adc8]">herdr</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[13rem_1fr]">
        <div className="border-b border-white/5 bg-[#181825] py-2 md:border-b-0 md:border-r">
          <span className="block px-3 pb-1 text-[#6c7086]">machines</span>
          {MACHINES.map((machine, index) => (
            <div
              key={machine.name}
              className={cn(index > 0 && 'mt-2 border-t border-white/5 pt-2')}
            >
              <div className="flex items-center gap-2 px-3 font-semibold">
                <span className="text-[9px] text-[#cdd6f4]">▾</span>
                <span>{machine.name}</span>
                {machine.connected && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a6e3a1]" />
                )}
              </div>
              {machine.workspaces.map((workspace) => (
                <WorkspaceRow key={workspace.name} workspace={workspace} />
              ))}
            </div>
          ))}
        </div>
        <div className="min-w-0">
          <div className="flex border-b border-white/5 bg-[#181825] text-[10px]">
            <span className="border-r border-white/5 bg-[#a6e3a1]/15 px-3 py-0.5 text-[#a6e3a1]">
              1
            </span>
          </div>
          <div className="space-y-1 p-3 text-[#a6adc8]">
            <span className="block truncate text-[#6c7086]">pi · tech-stack-update</span>
            <span className="block truncate rounded-sm bg-[#313244]/60 px-2 py-1 text-[#cdd6f4]">
              Rebuild the Post-AI tab around my dev environment
            </span>
            <span className="block truncate">
              <span className="text-[#89b4fa]">read</span> src/app/tech-stack/page.tsx
            </span>
            <span className="block truncate">
              <span className="text-[#89b4fa]">edit</span>{' '}
              src/components/tech-stack/dev-environment.tsx
            </span>
            <span className="block truncate">
              <span className="text-[#a6e3a1]">$</span>{' '}
              <span className="text-[#cdd6f4]">npm run dev</span>
            </span>
            <span className="block text-[#f9e2af]">Working…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceRow({ workspace }: { workspace: Workspace }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-3">
        <StatusDot kind={workspace.dot} />
        <span className="truncate">{workspace.name}</span>
        {workspace.worktrees && (
          <span className="ml-auto text-[9px] text-[#89b4fa]" aria-hidden="true">
            ▾
          </span>
        )}
      </div>
      {workspace.branch && (
        <div className="flex gap-2 pl-[1.75rem] pr-3 text-[#6c7086]">
          <span>{workspace.branch}</span>
          {workspace.behind && <span className="text-[#f38ba8]">↓{workspace.behind}</span>}
        </div>
      )}
      {workspace.worktrees?.map((worktree, index, all) => (
        <div
          key={worktree.name}
          className={cn(
            'flex items-center gap-2 pl-[1.75rem] pr-3',
            worktree.selected && 'bg-[#313244]/60',
          )}
        >
          <span className="text-[#45475a]" aria-hidden="true">
            {index === all.length - 1 ? '└─' : '├─'}
          </span>
          <StatusDot kind={worktree.dot} />
          <span className="truncate">{worktree.name}</span>
        </div>
      ))}
    </div>
  );
}
