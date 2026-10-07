import { cache } from 'react';
import {
  getAllWritingSlugs as getAllWritingSlugsFromContent,
  getAllWritingsMeta,
  getWritingBySlug as getWritingBySlugFromContent,
} from '@/lib/content/selectors';
import type { Writing, WritingMeta } from '@/lib/content/types';

export const getAllWritings = cache(async (): Promise<WritingMeta[]> => {
  return getAllWritingsMeta();
});

export const getWritingBySlug = cache(async (slug: string): Promise<Writing | undefined> => {
  return getWritingBySlugFromContent(slug);
});

export const getAllWritingSlugs = cache(async (): Promise<string[][]> => {
  return getAllWritingSlugsFromContent();
});
