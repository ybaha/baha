export type ServiceId = 'eu-vps' | 'edge-vps' | 'laptop';
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
    id: 'eu-vps', name: 'EU VPS', role: 'Karardex API', location: 'Frankfurt', cpu: 23,
    nodeId: 'eu-01', workload: 'api', memory: 42,
    description: 'The API layer: serving searches and retrieving decisions for Karardex.',
    capacity: '2 vCPU · 4 GB RAM', stack: ['Node.js', 'PostgreSQL', 'Docker'],
  },
  {
    id: 'edge-vps', name: 'Edge VPS', role: 'Web & workers', location: 'Amsterdam', cpu: 14,
    nodeId: 'edge-01', workload: 'worker', memory: 31,
    description: 'The front door: hosting the web app, refreshing caches, and running background workers.',
    capacity: '2 vCPU · 2 GB RAM', stack: ['Next.js', 'Redis', 'Docker'],
  },
  {
    id: 'laptop', name: 'Home Laptop', role: 'Linux home server', location: 'Rotterdam', cpu: 38,
    nodeId: 'home-01', workload: 'ingest', memory: 56,
    description: 'A Linux server at home, running Karardex’s document pipeline and background processing jobs.',
    capacity: '8 cores · 16 GB RAM', stack: ['Linux', 'Python', 'Docker'],
  },
] as const;

const TEMPLATES: Omit<MockEvent, 'id' | 'time' | 'duration'>[] = [
  { service: 'eu-vps', kind: 'request', message: 'Search completed', detail: 'POST /api/search', result: '200 OK' },
  { service: 'edge-vps', kind: 'request', message: 'Health check passed', detail: 'GET /health', result: '200 OK' },
  { service: 'laptop', kind: 'job', message: 'Documents indexed', detail: 'index.documents · 38 documents', result: 'Done' },
  { service: 'eu-vps', kind: 'request', message: 'Decision retrieved', detail: 'GET /api/decisions/:id', result: '200 OK' },
  { service: 'edge-vps', kind: 'job', message: 'Cache refreshed', detail: 'cache.refresh · 126 entries', result: 'Done' },
  { service: 'edge-vps', kind: 'deploy', message: 'Deployment completed', detail: 'karardex-web · rolling update', result: 'Ready' },
  { service: 'laptop', kind: 'job', message: 'Ingestion batch finished', detail: 'ingest.batch · 24 documents', result: 'Done' },
  { service: 'eu-vps', kind: 'request', message: 'Search completed', detail: 'POST /api/search', result: '200 OK' },
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
