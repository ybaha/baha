'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRightIcon,
  CheckIcon,
  GitBranchIcon,
  HardDrivesIcon,
  LaptopIcon,
  InfoIcon,
  XIcon,
  PulseIcon,
  StackIcon,
  TerminalWindowIcon,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';
import { createSparklinePaths } from './chart-path';
import {
  advanceMockSnapshot,
  INITIAL_SNAPSHOT,
  SERVICES,
  type MockEvent,
  type MockSnapshot,
  type ServiceId,
} from './mock-data';

const VARIANTS = [
  { id: 'pulse', label: 'Pulse', description: 'A small window into the systems I build and run.' },
  { id: 'dispatch', label: 'Dispatch', description: 'Requests, releases, and the little things happening behind the scenes.' },
  { id: 'constellation', label: 'Constellation', description: 'Different machines. One connected little ecosystem.' },
  { id: 'compact', label: 'Compact', description: 'Three nodes, one little glimpse of what’s happening.' },
  { id: 'cluster', label: 'Cluster', description: 'Node readiness, workload placement, and the latest operation.' },
] as const;
type Variant = (typeof VARIANTS)[number]['id'];
type Filter = 'all' | 'request' | 'job' | 'deploy';

const selectedSurface = '[background:var(--lt-sheen-s),linear-gradient(180deg,rgb(var(--color-primary)/0.24),rgb(var(--color-primary)/0.1))] shadow-[inset_0_0_0_1px_rgb(var(--color-primary)/0.24),var(--lt-e1)] text-foreground/90';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const mono = 'font-[family-name:var(--font-geist-mono)] text-[10px] tabular-nums text-foreground/55';
const label = 'text-[10px] font-medium tracking-wide text-foreground/55';
const heading = 'font-serif text-[26px] font-medium italic leading-tight tracking-tight text-foreground/90';
const subtitle = 'mb-0 mt-1 text-xs leading-relaxed text-foreground/55';
const orb = 'lt-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-primary/20 !bg-primary/10';
const eventIcon = 'lt-btn grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg';
const arrival = 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300';

function Sparkline({ values }: { values: number[] }) {
  const paths = createSparklinePaths(values);
  return (
    <svg className="my-1 h-[46px] w-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 15H100 M0 30H100 M0 45H100" className="fill-none stroke-foreground/10 [stroke-width:0.25]" />
      <path d={paths.area} className="fill-primary/10" />
      <path d={paths.line} className="fill-none stroke-primary [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function EventIcon({ kind }: { kind: MockEvent['kind'] }) {
  const Icon = kind === 'request' ? ArrowRightIcon : kind === 'deploy' ? GitBranchIcon : StackIcon;
  return <Icon size={14} aria-hidden="true" />;
}

function MachineInfoTrigger({ service, open, panelId, onClick, className }: {
  service: (typeof SERVICES)[number];
  open: boolean;
  panelId: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn('lt-btn relative grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-[opacity,background-color,box-shadow] duration-200 motion-reduce:transition-none',
        !open && '[@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100', focusRing, className)}
      aria-label={open ? `Close ${service.name} details` : `About ${service.name}`}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onClick}
    >
      <InfoIcon size={15} aria-hidden="true" className={cn('absolute transition-[transform,opacity] duration-300 [transition-timing-function:var(--sb-spring)] motion-reduce:transition-none', open ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100')} />
      <XIcon size={14} aria-hidden="true" className={cn('absolute transition-[transform,opacity] duration-300 [transition-timing-function:var(--sb-spring)] motion-reduce:transition-none', open ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0')} />
    </button>
  );
}

function MachineInfo({ service, open, id }: {
  service: (typeof SERVICES)[number];
  open: boolean;
  id: string;
}) {
  return (
    <div id={id} role="region" aria-label={`${service.name} details`} aria-hidden={!open} inert={!open}
      className={cn('grid transition-[grid-template-rows,opacity,transform] duration-500 [transition-timing-function:var(--sb-spring)] motion-reduce:transition-none', open ? 'grid-rows-[1fr] scale-100 opacity-100' : 'grid-rows-[0fr] scale-[0.98] opacity-0')}>
      <div className="min-h-0 overflow-hidden">
        <div className="lt-well mb-3 mt-1 rounded-xl p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-foreground/90">{service.role}</span><span className="text-[9px] text-foreground/45">Configuration</span></div>
          <p className="mb-3 mt-2 text-[11px] leading-relaxed text-foreground/60">{service.description}</p>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-[10px]">
            <div><dt className="text-foreground/45">Location</dt><dd className="mt-0.5">{service.location}</dd></div>
            <div><dt className="text-foreground/45">Machine</dt><dd className="mt-0.5">{service.capacity}</dd></div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">{service.stack.map((technology) => <span key={technology} className="rounded-md border border-[var(--lt-ring)] bg-foreground/[0.025] px-2 py-1 text-[9px] text-foreground/60">{technology}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

function ServiceRows({ sequence }: { sequence: number }) {
  const [expanded, setExpanded] = useState<ServiceId | null>(null);
  return (
    <div className="mx-4 border-t border-[var(--lt-ring)] sm:mx-[22px]">
      {SERVICES.map((service) => (
        <div className="group border-b border-[var(--lt-ring)] last:border-b-0" key={service.id}>
          <div className="flex items-center gap-2 py-3 sm:gap-2.5">
            <span className="lt-btn grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]" aria-hidden="true">
              {service.id === 'laptop' ? <LaptopIcon size={16} /> : <HardDrivesIcon size={16} />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="text-xs font-medium text-foreground/90">{service.name}</strong>
              <span className="text-[10px] text-foreground/55">{service.role}</span>
            </div>
            <span className="hidden text-[11px] tabular-nums sm:inline">{service.cpu + sequence % 7}% <span className="text-[9px] text-foreground/55">CPU</span></span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:ml-2"><CheckIcon size={12} aria-hidden="true" /><span className="hidden xs:inline">Healthy</span></span>
            <MachineInfoTrigger service={service} open={expanded === service.id} panelId={`pulse-info-${service.id}`} onClick={() => setExpanded(expanded === service.id ? null : service.id)} />
          </div>
          <MachineInfo service={service} open={expanded === service.id} id={`pulse-info-${service.id}`} />
        </div>
      ))}
    </div>
  );
}

function MachinePulse({ serviceId, event }: { serviceId: ServiceId; event: MockEvent }) {
  const active = event.service === serviceId;
  const Icon = serviceId === 'laptop' ? LaptopIcon : HardDrivesIcon;
  return (
    <span key={active ? event.id : serviceId} className={cn('relative shrink-0', active && 'motion-safe:animate-node-flash')}>
      <Icon size={18} aria-hidden="true" />
      <span className={cn('absolute -bottom-0.5 -left-0.5 h-1 w-1 rounded-full bg-foreground/25 ring-2 ring-[rgb(var(--sb-panel-to))]', active && 'motion-safe:animate-node-dot-flash')} aria-hidden="true">
        {active && <span key={event.id} className="pointer-events-none absolute -inset-1.5 rounded-full border border-primary/55 opacity-0 motion-safe:animate-node-ripple" />}
      </span>
    </span>
  );
}

function CompactNodes({ event }: { event: MockEvent }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 p-3 leading-tight" role="group" aria-label="Infrastructure nodes">
      {SERVICES.map((service) => {
        const active = event.service === service.id;
        return (
          <div key={service.id} role="group" aria-label={`${service.name}${active ? ', latest event source' : ''}`}
            data-event-source={active || undefined}
            className="flex min-w-0 flex-col items-center gap-2 rounded-[10px] px-1.5 py-2.5 text-foreground/60 sm:flex-row sm:gap-2.5 sm:px-2.5">
            <MachinePulse serviceId={service.id} event={event} />
            <div className="flex min-w-0 flex-col gap-0.5 text-center sm:text-left">
              <span className="whitespace-nowrap text-[10px] font-medium">{service.name}</span>
              <span className="text-[8px] text-foreground/45">{service.location}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClusterCard({ snapshot }: { snapshot: MockSnapshot }) {
  const [expanded, setExpanded] = useState<ServiceId | null>(null);
  const columns = 'grid grid-cols-[minmax(0,1fr)_46px_44px_28px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_54px_52px_52px_28px] sm:gap-3';
  return (
    <div className="px-3 pt-5 font-[family-name:var(--font-geist-mono)] leading-tight sm:px-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[16px] font-medium text-foreground/85">karardex.cluster</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-foreground/60"><CheckIcon size={13} aria-hidden="true" /> 3/3 ready</span>
      </div>
      <p className="mb-0 mt-1 text-[11px] text-foreground/45">homelab / workload mesh</p>
      <div className="my-4 flex items-center gap-5 border-b border-[var(--lt-ring)] pb-4 text-[12px] tabular-nums">
        <span><span className="text-foreground/45">rate </span>{3 + snapshot.sequence % 5}<span className="text-foreground/45"> req/s</span></span>
        <span><span className="text-foreground/45">p95 </span>{snapshot.latency}<span className="text-foreground/45"> ms</span></span>
      </div>
      <div className={cn(columns, 'pb-1 text-[10px] tracking-wider text-foreground/45')} aria-hidden="true">
        <span>NODE / WORKLOAD</span><span>STATE</span><span className="text-right">CPU</span><span className="hidden text-right sm:block">MEM</span><span />
      </div>
      <div role="group" aria-label="Cluster nodes">
        {SERVICES.map((service) => (
          <div className="group border-b border-[var(--lt-ring)] last:border-b-0" key={service.id} role="group" aria-label={`${service.nodeId}, ${service.name}`} data-event-source={snapshot.events[0].service === service.id || undefined}>
            <div className={cn(columns, 'py-3 text-[12px] tabular-nums')}>
              <div className="flex min-w-0 items-center gap-2.5 text-foreground/60">
                <MachinePulse serviceId={service.id} event={snapshot.events[0]} />
                <div className="flex min-w-0 flex-col gap-1"><span className="text-foreground/85">{service.nodeId}</span><span className="truncate text-[10px] text-foreground/45">{service.workload} · {service.name}</span></div>
              </div>
              <span className="text-[11px] text-foreground/60">Ready</span>
              <span className="text-right" aria-label={`CPU ${service.cpu + snapshot.sequence % 7} percent`}>{service.cpu + snapshot.sequence % 7}%</span>
              <span className="hidden text-right text-foreground/60 sm:block" aria-label={`Memory ${service.memory + snapshot.sequence % 3} percent`}>{service.memory + snapshot.sequence % 3}%</span>
              <MachineInfoTrigger service={service} open={expanded === service.id} panelId={`cluster-info-${service.id}`} onClick={() => setExpanded(expanded === service.id ? null : service.id)} />
            </div>
            <MachineInfo service={service} open={expanded === service.id} id={`cluster-info-${service.id}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventAsideIcon({ event, outgoing = false }: { event: MockEvent; outgoing?: boolean }) {
  return (
    <span aria-hidden="true" data-icon-phase={outgoing ? 'outgoing' : 'incoming'}
      className={cn('absolute inset-0 grid place-items-center', outgoing ? 'opacity-0 motion-safe:animate-event-icon-out' : 'motion-safe:animate-event-icon-in')}>
      <EventIcon kind={event.kind} />
    </span>
  );
}

function EventAsideRow({ event, compact, technical = false, outgoing = false }: { event: MockEvent; compact: boolean; technical?: boolean; outgoing?: boolean }) {
  const service = SERVICES.find((item) => item.id === event.service)!;
  const eventLabel = compact ? event.kind === 'request' ? 'Latest call' : event.kind === 'job' ? 'Latest job' : 'Latest release' : 'Latest event';
  return (
    <div aria-hidden={outgoing || undefined} data-event-phase={outgoing ? 'outgoing' : 'incoming'}
      className={cn('col-start-1 row-start-1 flex min-w-0 items-center gap-2.5', outgoing ? 'pointer-events-none opacity-0 motion-safe:animate-event-slide-out' : 'motion-safe:animate-event-slide-in')}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn('truncate', technical ? 'text-[11px]' : 'text-[9px]', compact ? 'text-foreground/60' : 'text-foreground/45')}>{eventLabel} <span className="mx-1 opacity-50">/</span> {technical ? `${service.nodeId} · ${service.workload}` : service.name}</span>
        <span className={cn('text-foreground/75', technical ? 'truncate font-[family-name:var(--font-geist-mono)] text-[12px]' : compact ? 'truncate font-[family-name:var(--font-geist-mono)] text-[10px]' : 'text-[11px]')}>{compact ? event.detail : event.message}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1"><span className={cn(mono, technical && 'text-[11px]')}>{compact ? event.result : event.time}</span><span className={cn('text-foreground/45', technical ? 'text-[11px]' : 'text-[9px]')}>{event.duration}ms</span></div>
    </div>
  );
}

function LatestEventAside({ event, previousEvent, compact = false, technical = false }: { event: MockEvent; previousEvent?: MockEvent; compact?: boolean; technical?: boolean }) {
  return (
    <aside aria-label="Latest event" className={cn('border-t', compact
      ? 'border-[var(--lt-ring)] px-3 py-2.5 leading-tight [background:var(--lt-sheen-s),linear-gradient(180deg,rgb(var(--sb-panel-from)),rgb(var(--sb-panel-to)))] [box-shadow:inset_0_1px_0_var(--lt-rim)]'
      : 'border-[var(--lt-ring)] bg-foreground/[0.025] px-4 py-3.5 sm:px-[22px]')}>
      <div className="flex items-center gap-2.5">
        <span className={cn(eventIcon, 'relative overflow-hidden', compact && 'h-[22px] w-[22px]', technical && 'h-7 w-7 [&_svg]:h-4 [&_svg]:w-4')}>
          {previousEvent && <EventAsideIcon key={previousEvent.id} event={previousEvent} outgoing />}
          <EventAsideIcon key={event.id} event={event} />
        </span>
        <div className="grid min-w-0 flex-1 overflow-hidden">
          {previousEvent && <EventAsideRow key={previousEvent.id} event={previousEvent} compact={compact} technical={technical} outgoing />}
          <EventAsideRow key={event.id} event={event} compact={compact} technical={technical} />
        </div>
      </div>
    </aside>
  );
}

function PulseCard({ snapshot }: { snapshot: MockSnapshot }) {
  return (
    <>
      <div className="px-4 pt-6 sm:px-[22px]">
        <div className="flex items-center gap-3">
          <span className={orb}><PulseIcon size={24} weight="duotone" aria-hidden="true" /></span>
          <div><h3 className={heading}>All systems, in rhythm.</h3><p className={subtitle}>Three machines. Always something happening.</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 pb-[22px] pt-[26px] min-[601px]:grid-cols-[1fr_1fr_1.2fr] min-[601px]:gap-5">
          <div className="flex min-w-0 flex-col">
            <span className={label}>Requests today</span>
            <strong className="my-1 text-[30px] font-medium leading-tight tracking-tighter text-foreground/90 tabular-nums">{snapshot.requests.toLocaleString('en-US')}</strong>
            <span className="text-[10px] text-foreground/55">Across the ecosystem</span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className={label}>API latency · p95</span>
            <strong className="my-1 text-[30px] font-medium leading-tight tracking-tighter text-foreground/90 tabular-nums">{snapshot.latency}<small className="ml-1 text-[13px] tracking-normal text-foreground/55">ms</small></strong>
            <span className="text-[10px] text-foreground/55">Karardex API</span>
          </div>
          <div className="col-span-2 flex min-w-0 flex-col min-[601px]:col-span-1">
            <span className={label}>Request activity</span>
            <Sparkline values={snapshot.traffic} />
            <span className="text-[10px] text-foreground/55">Illustrative rolling window</span>
          </div>
        </div>
      </div>
      <ServiceRows sequence={snapshot.sequence} />
    </>
  );
}

function DispatchCard({ snapshot }: { snapshot: MockSnapshot }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const events = snapshot.events.filter((event) => filter === 'all' || event.kind === filter).slice(0, 5);
  return (
    <>
      <div className="flex items-center gap-3 px-4 pb-[18px] pt-6 sm:px-[22px]">
        <span className={orb}><TerminalWindowIcon size={24} weight="duotone" aria-hidden="true" /></span>
        <div><h3 className={heading}>The latest dispatch.</h3><p className={subtitle}>A little less dashboard. A little more backstage.</p></div>
      </div>
      <div className="flex gap-1 px-4 pb-3.5 sm:px-[22px]" role="group" aria-label="Filter events">
        {([['all', 'Everything'], ['request', 'Requests'], ['job', 'Jobs'], ['deploy', 'Releases']] as const).map(([id, text]) => (
          <button type="button" key={id} aria-pressed={filter === id} onClick={() => { setFilter(id); setExpanded(null); }} className={cn('rounded-lg px-2.5 py-1.5 text-[10px] transition-colors motion-reduce:transition-none', focusRing, filter === id ? selectedSurface : 'text-foreground/55 hover:bg-foreground/5 hover:text-foreground/90')}>{text}</button>
        ))}
      </div>
      <div className="lt-well mx-4 overflow-hidden rounded-xl sm:mx-[22px]">
        <div className="flex justify-between border-b border-[var(--lt-ring)] px-3.5 pb-[9px] pt-3 text-[8px] font-medium tracking-widest text-foreground/55"><span>EVENT / SOURCE</span><span>RESULT</span></div>
        <div className="min-h-[270px]" role="group" aria-label="Simulated event stream">
          {events.map((event) => (
            <div className={cn('border-b border-[var(--lt-ring)] last:border-b-0', arrival)} key={event.id}>
              <button type="button" className={cn('flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-foreground/5 focus-visible:-outline-offset-2', focusRing)} onClick={() => setExpanded(expanded === event.id ? null : event.id)} aria-expanded={expanded === event.id}>
                <span className={eventIcon}><EventIcon kind={event.kind} /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <strong className="text-[11px] font-medium text-foreground/90">{event.message}</strong>
                  <span className="text-[9px] text-foreground/55">{SERVICES.find((service) => service.id === event.service)?.name} <span className="mx-[3px] opacity-40">/</span> {event.time}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-[3px] font-[family-name:var(--font-geist-mono)] text-[9px]">{event.result}<small className="text-[9px] text-foreground/55">{event.duration}ms</small></span>
              </button>
              {expanded === event.id && <div className="flex flex-col gap-[5px] break-words pb-3 pl-[50px] pr-3.5 text-[9px] text-foreground/55"><span className={mono}>{event.detail}</span><span>Synthetic event · no request bodies or personal data</span></div>}
            </div>
          ))}
          {events.length === 0 && <div className="grid min-h-[270px] place-items-center p-5 text-[11px] text-foreground/55">Waiting for a {filter === 'deploy' ? 'release' : filter} event…</div>}
        </div>
      </div>
      <p className="mb-0 px-4 py-3 text-[9px] text-foreground/45 sm:px-[22px]">Click an event to inspect</p>
    </>
  );
}

function ConstellationCard() {
  const [selected, setSelected] = useState<ServiceId>('eu-vps');
  const [infoFor, setInfoFor] = useState<ServiceId | null>(null);
  const service = SERVICES.find((item) => item.id === (infoFor ?? selected))!;
  return (
    <>
      <div className="px-4 pb-5 pt-[26px] text-center sm:px-[22px]"><h3 className={heading}>A small constellation.</h3><p className={subtitle}>The machines behind the things I make.</p></div>
      <div className="px-4 pb-[22px] sm:px-[22px]">
        <div className="lt-btn mx-auto flex w-fit items-center justify-center gap-2 rounded-[10px] px-3 py-[9px] text-[11px]"><PulseIcon size={16} weight="duotone" aria-hidden="true" /><span>My infrastructure</span><span className="border-l border-[var(--lt-ring)] pl-2 text-[9px] text-foreground/55">3 nodes</span></div>
        <div className="relative mx-[16.6667%] h-10 before:absolute before:left-0 before:right-0 before:top-5 before:h-px before:bg-primary/30 after:absolute after:left-1/2 after:top-0 after:h-5 after:w-px after:bg-primary/30" aria-hidden="true">
          <span className="absolute bottom-0 left-0 top-5 w-px bg-primary/30" /><span className="absolute bottom-0 left-1/2 top-5 w-px bg-primary/30" /><span className="absolute bottom-0 right-0 top-5 w-px bg-primary/30" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5" role="group" aria-label="Select a machine">
          {SERVICES.map((node) => {
            const Icon = node.id === 'laptop' ? LaptopIcon : HardDrivesIcon;
            return (
              <div className="group relative min-w-0" key={node.id}>
                <button type="button" className={cn('flex h-full w-full min-w-0 flex-col items-center rounded-xl border border-[var(--lt-ring)] px-1 pb-3.5 pt-9 transition-colors motion-reduce:transition-none sm:px-2', focusRing, node.id === selected ? selectedSurface : 'lt-btn')} aria-pressed={node.id === selected} onClick={() => { setSelected(node.id); if (infoFor !== null) setInfoFor(node.id); }}>
                  <span className="relative mb-2.5"><Icon size={24} weight={node.id === selected ? 'duotone' : 'regular'} aria-hidden="true" /><span className="absolute -right-[3px] bottom-0 h-[5px] w-[5px] rounded-full bg-primary ring-[3px] ring-background" /></span>
                  <strong className="text-center text-[10px] font-medium text-foreground/90 sm:text-[11px]">{node.name}</strong>
                  <span className="mt-1 text-[9px] text-foreground/55">{node.location}</span>
                  <small className="mt-2.5 text-[9px]">Healthy</small>
                </button>
                <MachineInfoTrigger className="absolute right-1.5 top-1.5" service={node} open={infoFor === node.id} panelId="map-machine-info" onClick={() => { setSelected(node.id); setInfoFor(infoFor === node.id ? null : node.id); }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mx-4 sm:mx-[22px]"><MachineInfo service={service} open={infoFor !== null} id="map-machine-info" /></div>
    </>
  );
}

export function LiveOperations({ embedded = false }: { embedded?: boolean }) {
  const [variant, setVariant] = useState<Variant>('cluster');
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if ((variant !== 'compact' && variant !== 'cluster' && hovered) || focused || reducedMotion) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') setSnapshot(advanceMockSnapshot);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [hovered, focused, reducedMotion, variant]);
  const direction = VARIANTS.find((item) => item.id === variant)!;

  return (
    <section className={cn("font-sans text-[13px] text-foreground/80", !embedded && "mb-10 mt-9")} aria-label="Cluster operations">
      {!embedded && <><div className="flex items-center justify-between gap-3">
        <div><span className="text-[10px] font-medium tracking-widest text-foreground/55">BEHIND THE SCENES</span><h2 id="operations-title" className="mt-1 font-serif text-[32px] font-medium italic leading-none tracking-tight text-foreground/90">Live operations</h2></div>
      </div>
      <p className="mb-[18px] mt-2.5 text-[13px] leading-relaxed text-foreground/55">{direction.description}</p>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-[3px] rounded-xl border border-[var(--lt-ring)] bg-foreground/[0.025] p-1 shadow-[inset_0_1px_2px_var(--lt-drop-s)] sm:inline-flex" role="group" aria-label="Card design variation">
          {VARIANTS.map((item, index) => <button type="button" className={cn('rounded-lg px-2 py-1.5 text-[11px] transition-colors motion-reduce:transition-none sm:px-2.5 sm:text-xs', index === VARIANTS.length - 1 && 'col-span-2', focusRing, variant === item.id ? selectedSurface : 'text-foreground/55 hover:bg-foreground/5 hover:text-foreground/90')} aria-pressed={variant === item.id} onClick={() => setVariant(item.id)} key={item.id}><span className="mr-1.5 hidden text-[9px] opacity-60 xs:inline">0{index + 1}</span>{item.label}</button>)}
        </div>
        <span className="hidden font-serif text-base italic text-foreground/55 min-[1200px]:inline">Five takes, one ecosystem</span>
      </div></>}
      <div className={cn('overflow-hidden rounded-2xl [background:var(--sb-panel-bg)] [box-shadow:var(--lt-e2)]', variant === 'compact' && 'max-w-[480px]', variant === 'cluster' && (embedded ? 'w-full max-w-none' : 'max-w-[520px]'))}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        {variant === 'pulse' && <PulseCard snapshot={snapshot} />}
        {variant === 'dispatch' && <DispatchCard snapshot={snapshot} />}
        {variant === 'constellation' && <ConstellationCard />}
        {variant === 'compact' && <CompactNodes event={snapshot.events[0]} />}
        {variant === 'cluster' && <ClusterCard snapshot={snapshot} />}
        <LatestEventAside event={snapshot.events[0]} previousEvent={snapshot.sequence > INITIAL_SNAPSHOT.sequence ? snapshot.events[1] : undefined} compact={variant === 'compact' || variant === 'cluster'} technical={variant === 'cluster'} />
      </div>
    </section>
  );
}
