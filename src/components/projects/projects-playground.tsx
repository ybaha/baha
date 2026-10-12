"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ProjectsVersion = 'v1' | 'v2' | 'v3';

const VERSIONS: { id: ProjectsVersion; label: string }[] = [
  { id: 'v1', label: 'V1 Editorial' },
  { id: 'v2', label: 'V2 Workspace' },
  { id: 'v3', label: 'V3 Index' },
];

export type ProjectsPlaygroundProps = {
  /** Server-rendered V1 editorial layout slot */
  v1: ReactNode;
  /** Server-rendered V2 workspace layout slot */
  v2: ReactNode;
  /** Server-rendered V3 index layout slot */
  v3: ReactNode;
  className?: string;
};

export function ProjectsPlayground({ v1, v2, v3, className }: ProjectsPlaygroundProps) {
  const [version, setVersion] = useState<ProjectsVersion>('v1');
  const instanceId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = `${instanceId}-panel`;

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight': nextIndex = (index + 1) % VERSIONS.length; break;
      case 'ArrowLeft': nextIndex = (index + VERSIONS.length - 1) % VERSIONS.length; break;
      case 'Home': nextIndex = 0; break;
      case 'End': nextIndex = VERSIONS.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setVersion(VERSIONS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  const activeLayout = version === 'v1' ? v1 : version === 'v2' ? v2 : v3;

  return (
    <div className={cn('space-y-5', className)}>
      <div
        role="tablist"
        aria-label="Projects layout versions"
        className="inline-flex max-w-full gap-0.5 rounded-xl bg-foreground/[0.035] p-1 [box-shadow:var(--lt-e1)]"
      >
        {VERSIONS.map((item, index) => {
          const selected = version === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${instanceId}-${item.id}`}
              ref={(node) => { tabRefs.current[index] = node; }}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-left text-[11px] leading-tight transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                selected
                  ? 'text-foreground/90 [background:var(--lt-sheen-s),linear-gradient(180deg,rgb(var(--color-primary)/0.16),rgb(var(--color-primary)/0.06))] [box-shadow:var(--lt-e1)]'
                  : 'text-foreground/50 hover:text-foreground/80'
              )}
              onClick={() => setVersion(item.id)}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={`${instanceId}-${version}`} tabIndex={0} className="min-w-0">
        {activeLayout}
      </div>
    </div>
  );
}
