'use client';

import { useEffect, useState } from 'react';
import type { Project } from './data';
import { ProjectMark } from './shared';
import { useSpring } from '@/hooks/use-spring';

const FLAP_PATH = 'M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z';
const GLASS_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="321" height="241" viewBox="0 0 321 241"><path d="${FLAP_PATH}" fill="white"/></svg>`)}")`;
type Pose = [number, number, number];

function FileCard({ project, pose, delay, reduced, scale }: { project: Project; pose: Pose; delay: number; reduced: boolean; scale: number }) {
  const cardRef = useSpring<HTMLDivElement>(pose, (node, value) => {
    node.style.transform = `translateX(${value[0]}px) translateY(${value[1]}px) rotate(${value[2]}deg)`;
  }, { delay, reduced });
  const scaleRef = useSpring<HTMLDivElement>([0, 0, scale], (node, value) => {
    node.style.transform = `scale(${value[2]})`;
  }, { reduced });
  return <div ref={cardRef} className="absolute" data-folder-file style={{ transform: `translateX(${pose[0]}px) translateY(${pose[1]}px) rotate(${pose[2]}deg)` }}>
    <div className="grid h-[128px] w-[128px] place-items-center">
      <div ref={scaleRef} style={{ transform: `scale(${scale})` }}><ProjectMark project={project} size={128} className="rounded-[22px]" /></div>
    </div>
  </div>;
}

function Flap({ active, open, reduced, id }: { active: boolean; open: boolean; reduced: boolean; id: string }) {
  const target: Pose = [0, 0, open ? -72 : active ? -65 : -15];
  const initial = `translate(-50%, -50%) rotateX(${open ? -72 : active ? -65 : -15}deg)`;
  const flapRef = useSpring<HTMLDivElement>(target, (node, value) => {
    node.style.transform = `translate(-50%, -50%) rotateX(${value[2]}deg)`;
  }, { reduced });
  return <div ref={flapRef} className="absolute left-1/2 top-1/2 mt-4 h-[241px] w-[321px]" data-folder-flap style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d', transform: initial }}>
    <div className="absolute inset-0" data-folder-glass style={{ backdropFilter: `blur(${active || open ? 2 : 4}px) saturate(0.95)`, WebkitBackdropFilter: `blur(${active || open ? 2 : 4}px) saturate(0.95)`, backgroundColor: 'rgb(var(--sb-panel-from) / 0.06)', clipPath: `path('${FLAP_PATH}')`, WebkitClipPath: `path('${FLAP_PATH}')`, maskImage: GLASS_MASK, WebkitMaskImage: GLASS_MASK, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', transition: reduced ? 'none' : 'backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease' }} />
    <svg className="absolute inset-0" width="321" height="241" viewBox="0 0 321 241" fill="none">
      <g filter={`url(#${id}-flap)`}><path d={FLAP_PATH} fill="color-mix(in srgb, rgb(var(--color-primary)) 45%, rgb(var(--sb-panel-from)))" fillOpacity="0.58" /><path d="M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z" stroke="color-mix(in srgb, rgb(var(--color-primary)) 30%, rgb(var(--sb-panel-from)))" /></g>
      <path d={FLAP_PATH} fill={`url(#${id}-fog)`} />
      <defs><linearGradient id={`${id}-fog`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--lt-sheen)" stopOpacity="0.45" /><stop offset="0.7" stopColor="var(--lt-sheen)" stopOpacity="0.08" /></linearGradient><filter id={`${id}-flap`} x="-25.4" y="-25.4" width="371.8" height="291.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" /><feOffset /><feGaussianBlur stdDeviation="2.65" /><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" /><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0" /><feBlend in2="shape" /></filter></defs>
    </svg>
  </div>;
}

function uniqueId() {
  return `flap-${Math.random().toString(36).slice(2, 10)}`;
}

export function FolderArtwork({ projects, active, open }: { projects: Project[]; active: boolean; open: boolean }) {
  const [reduced, setReduced] = useState(false);
  const [flapId] = useState(() => uniqueId());
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const poses: Pose[] = [
    [open ? 94 : active ? 80 : 45, open ? -110 : active ? -88 : -55, open ? 18 : active ? 16 : 9],
    [0, open ? -122 : active ? -104 : -65, open ? -3 : -1],
    [open ? -94 : active ? -80 : -45, open ? -116 : active ? -92 : -58, open ? -18 : active ? -16 : -9],
  ];
  return <span aria-hidden="true" data-folder-art className="relative block shrink-0 [--folder-scale:0.32] @2xl:[--folder-scale:0.42]" style={{ width: 'calc(321px * var(--folder-scale))', height: 'calc(270px * var(--folder-scale) * 0.82)' }}>
    <div className="absolute left-1/2 top-1/2" style={{ width: 321, height: 270, transform: 'translate(-50%, -50%) scale(var(--folder-scale))', perspective: '1400px' }}>
      <div className="absolute inset-0" style={{ transform: 'scale(0.82)', transformStyle: 'preserve-3d' }}>
        <div data-folder-back className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[270px] w-[321px] rounded-[25px] border border-primary/35 [background:var(--lt-sheen-s),linear-gradient(180deg,color-mix(in_srgb,rgb(var(--color-primary))_42%,rgb(var(--sb-panel-from))),color-mix(in_srgb,rgb(var(--color-primary))_34%,rgb(var(--sb-panel-to))))] [box-shadow:inset_0_1px_0_var(--lt-rim)]" />
      </div>
      <div className="absolute left-1/2 top-[159px] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        {projects.slice(0, 3).reverse().map((project, index) => <FileCard key={project.id} project={project} pose={poses[index]} reduced={reduced} scale={active || open ? 1.18 : 1} delay={open ? [0.1, 0.05, 0][index] : active ? [0.12, 0.06, 0][index] : 0} />)}
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ transform: 'scale(0.82)', transformStyle: 'preserve-3d' }}><Flap active={active} open={open} reduced={reduced} id={flapId} /></div>
    </div>
  </span>;
}
