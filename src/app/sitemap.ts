import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
import { getAllSnippetsMeta, getAllWritingsMeta } from '@/lib/content/selectors';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/writings`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/logs`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/vault`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/projects`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/tech-stack`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const writings = getAllWritingsMeta().map((writing) => ({
    url: `${siteUrl}/writings/${writing.slug}`,
    lastModified: new Date(writing.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const vault = getAllSnippetsMeta().map((snippet) => ({
    url: `${siteUrl}/vault/${snippet.slug}`,
    lastModified: new Date(snippet.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...writings, ...vault];
}
