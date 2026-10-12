export type ServiceId = 'laptop' | 'vps';
export type EventKind = 'request' | 'job' | 'deploy';

export interface MockEvent {
  id: number;
  service: ServiceId;
  kind: EventKind;
  message: string;
  detail: string;
  result: string;
  duration: number;
  time: string;
}

export const SERVICES = [
  {
    id: 'laptop', name: 'Home laptop', role: 'Karardex frontend + backend', location: 'At home', cpu: 38,
    nodeId: 'home', workload: 'Karardex FE + BE', memory: 56,
    description: 'Both Karardex’s Next.js frontend and API run on the Linux home server, alongside its RAG index, PostgreSQL, Redis and local query embeddings.',
    capacity: 'Full-stack hosting · RAG data', stack: ['Next.js', 'Hono', 'PostgreSQL', 'pgvector', 'Redis', 'PM2'],
  },
  {
    id: 'vps', name: 'VPS', role: 'Application services & workers', location: 'VPS', cpu: 23,
    nodeId: 'vps', workload: 'Postmixr + apps', memory: 42,
    description: 'PM2 runs the other application services here: Postmixr API and worker, Viralty, Clean, GLB, Rooma, Grip, Math Help, VidGen, Stellarzen and Logar.',
    capacity: '19 PM2 application processes', stack: ['PM2', 'Node.js', 'Bun', 'Python'],
  },
] as const;

const TEMPLATES: Omit<MockEvent, 'id' | 'time' | 'duration'>[] = [
  { service: 'laptop', kind: 'request', message: 'Search completed', detail: 'karardex · POST /api/search', result: '200 OK' },
  { service: 'vps', kind: 'request', message: 'Health check passed', detail: 'postmixr · GET /health', result: '200 OK' },
  { service: 'laptop', kind: 'job', message: 'Documents indexed', detail: 'index.documents · 38 documents', result: 'Done' },
  { service: 'laptop', kind: 'request', message: 'Decision retrieved', detail: 'karardex · GET /api/decisions/:id', result: '200 OK' },
  { service: 'vps', kind: 'job', message: 'Tool job completed', detail: 'postmixr · video-tools', result: 'Done' },
  { service: 'laptop', kind: 'deploy', message: 'Deployment completed', detail: 'karardex FE + BE · update', result: 'Ready' },
  { service: 'vps', kind: 'job', message: 'Video analysed', detail: 'viralty · analysis.complete', result: 'Done' },
  { service: 'laptop', kind: 'request', message: 'Search completed', detail: 'karardex · POST /api/search', result: '200 OK' },
];

export function createMockEvent(id: number): MockEvent {
  const seconds = 14 * 3600 + 32 * 60 + id * 3;
  const time = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
  return {
    ...TEMPLATES[id % TEMPLATES.length],
    id,
    time,
    duration: 82 + (id * 37) % 170,
  };
}

export const INITIAL_EVENTS = [3, 2, 1, 0].map(createMockEvent);
export const INITIAL_TRAFFIC = [18, 26, 22, 38, 32, 28, 46, 40, 54, 42, 36, 48, 62, 52, 44, 58, 50, 68, 56, 64, 48, 60, 72, 62];

export interface MockSnapshot {
  sequence: number;
  requests: number;
  latency: number;
  traffic: number[];
  events: MockEvent[];
}

export const INITIAL_SNAPSHOT: MockSnapshot = {
  sequence: 3,
  requests: 1248,
  latency: 184,
  traffic: INITIAL_TRAFFIC,
  events: INITIAL_EVENTS,
};

export function advanceMockSnapshot(previous: MockSnapshot): MockSnapshot {
  const sequence = previous.sequence + 1;
  return {
    sequence,
    requests: previous.requests + 3 + sequence % 5,
    latency: 164 + (sequence * 13) % 48,
    traffic: [...previous.traffic.slice(1), 28 + (sequence * 17) % 48],
    events: [createMockEvent(sequence), ...previous.events].slice(0, 12),
  };
}
