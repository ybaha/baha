export type ProductDetail = {
  summary: string;
  stack: string[];
  highlights: { title: string; description: string }[];
  hosting?: { title: string; description: string; flow: string[] };
  metrics?: { label: string; value: number }[];
  snapshot?: string;
  metricNote?: string;
};

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  karardex: {
    summary: 'Rented RTX 5090s embedded over a million legal documents. A Linux laptop at home now serves the app and its RAG engine. Big corpus, small home setup.',
    stack: ['Next', 'Hono', 'oRPC', 'Auth', 'Postgres', 'RAG', 'Redis', 'MCP'],
    highlights: [
      { title: 'Real RAG. Real sources.', description: 'Vector retrieval, reranking and multi-round research turn the corpus into answers you can trace back to the original legal material.' },
      { title: 'Rented GPUs. Home-hosted software.', description: 'Web, API, vectors, Redis and query embeddings run on the Linux laptop. External LLMs do the answer generation; MCP brings the same research to other tools.' },
    ],
    hosting: {
      title: 'Production, from a laptop at home.',
      description: 'The Linux laptop runs the Next.js frontend, Hono API, PostgreSQL, Redis, embeddings and OCR workers. Cloudflare fronts nginx; separate web/API services and a self-hosted deployment runner keep releases isolated and rollbackable. Model inference and services such as billing remain external.',
      flow: ['Cloudflare', 'nginx', 'Linux laptop'],
    },
  },
  postmixr: {
    summary: 'A publishing workspace for creators and teams: one calendar for multiple social channels, alongside a suite of creator tools with durable background processing.',
    stack: ['Next', 'Hono', 'oRPC', 'Auth', 'Postgres', 'Drizzle', 'Queues', 'R2', 'Stripe'],
    highlights: [
      { title: 'One calendar, multiple channels', description: 'Shared workspaces bring drafting, scheduling and publishing into one workflow instead of separate tools for each channel.' },
      { title: 'Jobs that survive the request', description: 'PostgreSQL-backed queues coordinate publishing and video tools, with retries, backoff, durable job state and dead-letter handling.' },
      { title: 'A typed path from interface to API', description: 'The Next.js interface talks to a Hono API through oRPC, with Drizzle-managed data, shared authentication and R2-backed media storage.' },
    ],
    metrics: [
      { label: 'Registered accounts', value: 935 },
      { label: 'Completed tool runs', value: 1013 },
      { label: 'Active tool users · 24h', value: 12 },
      { label: 'Completed tool runs · 24h', value: 23 },
    ],
    snapshot: '2026-10-12T13:58:28Z',
    metricNote: 'Read-only production snapshot. Active tool users are distinct authenticated users who submitted or completed a tool job in the trailing 24 hours; this is not site traffic or all publishing activity. There were 1,383 job submissions overall and 28 in that window. Account totals may include test/review accounts.',
    hosting: {
      title: 'A split web and worker deployment.',
      description: 'The Next.js frontend is deployed on Vercel, while the API and PostgreSQL-backed workers run on a VPS. Long-running creator jobs are handled separately from the web request.',
      flow: ['Next.js web', 'Hono API', 'PostgreSQL queues'],
    },
  },
};
