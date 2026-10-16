export type ProjectKind = 'product' | 'mobile' | 'web' | 'archive';

export type Project = {
  id: string;
  name: string;
  description: string;
  href: string;
  /** App icon or brand mark */
  markSrc: string;
  /** Product screenshot or honest preview asset */
  previewSrc?: string;
  /** Dark-mode brand mark when different from markSrc */
  markSrcDark?: string;
  year?: number;
  /** Human-readable release note (App Store or product), not a fabricated launch year */
  releaseLabel?: string;
  archived?: boolean;
  kind: ProjectKind;
  category?: string;
  linkHref?: string;
  linkLabel?: string;
};

export type OriginWebsite = {
  id: 'first-website';
  title: string;
  description: string;
  quote: string;
  archiveHref: string;
  archiveCaptureLabel: string;
  previewSrc?: string;
  collaborators: string;
};

export const FEATURED_PROJECTS: Project[] = [
  {
    id: 'karardex',
    name: 'Karardex',
    description:
      'Turkish legal research with sourced citations, visible research steps, and document context from PDFs and Word files—plus MCP integration for traceable workflows.',
    href: 'https://karardex.com',
    markSrc: '/projects/karardex-mark.webp',
    markSrcDark: '/projects/karardex-mark-dark.webp',
    previewSrc: '/projects/karardex-chat-verified.webp',
    kind: 'product',
  },
  {
    id: 'postmixr',
    name: 'Postmixr',
    description:
      'Shared calendar and multi-platform scheduling for teams publishing across channels from one place.',
    href: 'https://postmixr.com',
    markSrc: '/projects/postmixr-mark.webp',
    previewSrc: '/projects/postmixr-preview.webp',
    kind: 'product',
  },
];

export const MOBILE_PROJECTS: Project[] = [
  {
    id: 'viralty',
    category: 'Analysis',
    name: 'Viralty',
    description: 'Viral Video Analysis for understanding what makes short-form video resonate.',
    href: 'https://apps.apple.com/app/id6806250572',
    markSrc: '/projects/viralty.webp',
    previewSrc: '/projects/viralty.webp',
    releaseLabel: 'Released Sep 2, 2026',
    year: 2026,
    kind: 'mobile',
  },
  {
    id: 'clean',
    category: 'Habits',
    name: 'Clean',
    description: 'Daily Habits for Women—gentle habit tracking designed for everyday routines.',
    href: 'https://apps.apple.com/app/id6802110217',
    markSrc: '/projects/clean.webp',
    previewSrc: '/projects/clean.webp',
    releaseLabel: 'Released Aug 25, 2026',
    year: 2026,
    kind: 'mobile',
  },
  {
    id: 'rooma',
    category: 'Interiors',
    name: 'Rooma - AI Interior Design',
    description:
      'AI-powered interior design app that helps you visualize and redesign any room in seconds.',
    href: 'https://apps.apple.com/nl/app/rooma-ai-interior-design/id6758413701?l=en-GB',
    markSrc: '/projects/rooma.png',
    previewSrc: '/projects/rooma.png',
    year: 2026,
    kind: 'mobile',
  },
  {
    id: 'glb',
    category: '3D',
    name: 'GLB: 3D Model Generator',
    description:
      'AI-powered app that generates high quality 3D .glb and .stl models from text or images.',
    href: 'https://apps.apple.com/nl/app/glb-3d-model-generator/id6749620007?l=en-GB',
    markSrc: '/projects/glb.png',
    previewSrc: '/projects/glb.png',
    year: 2026,
    kind: 'mobile',
  },
  {
    id: 'grip',
    category: 'Wellness',
    name: 'Grip: Mens Health & Wellness',
    description:
      'Private guided app to help men last longer in bed and build real confidence.',
    href: 'https://apps.apple.com/nl/app/grip-mens-health-welness/id6755091590?l=en-GB',
    markSrc: '/projects/grip.png',
    previewSrc: '/projects/grip.png',
    year: 2026,
    kind: 'mobile',
  },
  {
    id: 'vidgen3',
    category: 'Video',
    name: 'VidGen3: AI Video Maker',
    description: 'AI Video Maker that uses AI to help you create videos.',
    href: 'https://apps.apple.com/nl/app/vidgen3/id6749280633?l=en-GB',
    markSrc: '/projects/vidgen.png',
    previewSrc: '/projects/vidgen.png',
    year: 2025,
    kind: 'mobile',
  },
  {
    id: 'math-help-ai',
    category: 'Education',
    name: 'Math Help AI: Solve Questions',
    description: 'Math problem solver that uses AI to help you solve math problems.',
    href: 'https://apps.apple.com/nl/app/math-help-ai-solve-questions/id6740034105?l=en-GB',
    markSrc: '/projects/math.png',
    previewSrc: '/projects/math.png',
    year: 2025,
    kind: 'mobile',
  },
  {
    id: 'picu',
    category: 'Photos',
    name: 'PicU: Transform Your Photos AI',
    description: 'PicU is a photo editing app that allows you to transform your photos with AI.',
    href: 'https://apps.apple.com/nl/app/picu-transform-your-photos-ai/id6745964976?l=en-GB',
    markSrc: '/projects/picu.png',
    previewSrc: '/projects/picu.png',
    year: 2025,
    kind: 'mobile',
  },
  {
    id: 'pico-cards',
    category: 'Conversations',
    name: 'pico cards',
    description:
      'pico cards is a conversation-starting app designed to help people connect better with partners, friends, or family.',
    href: 'https://poshet.co/apps/pico',
    markSrc: '/projects/pico.png',
    previewSrc: '/projects/pico.png',
    year: 2025,
    kind: 'mobile',
  },
];

export const EARLIER_PROJECTS: Project[] = [
  {
    id: 'stellarzen',
    category: 'Astrology',
    linkHref: 'https://web.archive.org/web/20250222121617/https://stellarzen.co/',
    linkLabel: 'View website archive',
    name: 'stellarzen',
    description:
      'stellarzen offers personalized astrological insights, interpreting your birth chart to guide personal growth and important life decisions.',
    href: 'https://stellarzen.co',
    markSrc: '/projects/stellarzen.png',
    previewSrc: '/projects/stellarzen.png',
    year: 2024,
    kind: 'web',
  },
  {
    id: 'personal-website',
    category: 'Portfolio',
    name: 'Personal Website',
    description: 'My digital garden where I share my thoughts and experiences.',
    href: 'https://ybaha.com',
    markSrc: '/projects/baha.png',
    previewSrc: '/projects/baha.png',
    year: 2024,
    kind: 'web',
  },
  {
    id: 'botguise',
    category: 'Chatbots',
    name: 'Botguise',
    description:
      'BotGuise creates AI-powered chatbots that bring your favorite personalities to life, blending entertainment and engagement.',
    href: 'https://botguise.com',
    markSrc: '/projects/botguise.png',
    previewSrc: '/projects/botguise.png',
    year: 2023,
    kind: 'web',
  },
  {
    id: 'poshet',
    category: 'Agency',
    name: 'Poshet',
    description:
      'Poshet crafts tailored, SEO-first digital experiences that transform businesses with expertly designed websites, e-commerce solutions, and web apps to drive customer conversions.',
    href: 'https://poshet.co',
    markSrc: '/projects/poshet.png',
    previewSrc: '/projects/poshet.png',
    year: 2023,
    kind: 'web',
  },
  {
    id: 'fullsocial',
    category: 'Music',
    linkHref: '/projects/fullsocial.png',
    linkLabel: 'View saved preview (original site offline)',
    name: 'Fullsocial',
    description:
      'Fullsocial is a platform that helps you get image assets from spotify in high quality, album covers, artist images, user images, etc.',
    href: 'https://fullsocial.co',
    markSrc: '/projects/fullsocial.png',
    previewSrc: '/projects/fullsocial.png',
    year: 2023,
    archived: true,
    kind: 'web',
  },
];

export const FIRST_WEBSITE: OriginWebsite = {
  id: 'first-website',
  title: 'Sevgi Koleji 4-B',
  description:
    'In fourth grade, Mert and I built a class website for our teacher with a no-code builder—homework announcements and an after-school chat for friends.',
  quote: 'Bakalım iyi bir site olacak mı',
  archiveHref: 'https://web.archive.org/web/20110414154452/https://sevgikoleji4-b.tr.gg/',
  archiveCaptureLabel: 'Wayback capture · Apr 14, 2011',
  previewSrc: '/projects/sevgi-koleji-2011.webp',
  collaborators: 'Baha Erarslan & Mert',
};

/** Names preserved from `PROJECTS` in src/lib/constants.ts (read-only reference). */
export const LEGACY_PROJECT_NAMES_FROM_CONSTANTS: string[] = [
  'Rooma - AI Interior Design',
  'GLB: 3D Model Generator',
  'Grip: Mens Health & Wellness',
  'VidGen3: AI Video Maker',
  'Math Help AI: Solve Questions',
  'PicU: Transform Your Photos AI',
  'pico cards',
  'stellarzen',
  'Personal Website',
  'Botguise',
  'Poshet',
  'Fullsocial',
];

export function allShelfProjects(): Project[] {
  return [...MOBILE_PROJECTS, ...EARLIER_PROJECTS];
}
