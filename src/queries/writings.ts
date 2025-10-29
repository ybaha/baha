import { cache } from 'react';
import { allWritings } from 'contentlayer2/generated';

export const getAllWritings = cache(async () => {
  return allWritings;
});

export const getWritingBySlug = cache(async (slug: string) => {
  return allWritings.find((writing) => writing.slug === slug);
});

export const getAllWritingSlugs = cache(async () => {
  return allWritings.map((writing) => writing._raw.flattenedPath.split('/'));
});
