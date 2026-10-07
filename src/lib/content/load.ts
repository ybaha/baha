import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { Log, Snippet, Writing } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function basenameSlug(relativePath: string): string {
  const withoutExt = relativePath.replace(/\.mdx$/i, '');
  const segments = withoutExt.split('/');
  return segments[segments.length - 1] ?? withoutExt;
}

function collectMdxFiles(subdir: string): string[] {
  const root = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(root)) {
    return [];
  }

  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(full);
      }
    }
  }

  walk(root);
  return files;
}

function parseWriting(filePath: string): Writing {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
  const slug = basenameSlug(relative);
  const stats = readingTime(content);

  return {
    id: relative,
    slug,
    url: `/writings/${slug}`,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    date: String(data.date ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    image: data.image ? String(data.image) : undefined,
    imageClassName: data.imageClassName ? String(data.imageClassName) : undefined,
    aiGenerated: data.aiGenerated === true,
    author: data.author ? String(data.author) : undefined,
    readingTimeMinutes: stats.minutes,
    body: content,
  };
}

function parseLog(filePath: string): Log {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
  const slug = basenameSlug(relative);

  return {
    id: relative,
    slug,
    title: String(data.title ?? ''),
    icon: data.icon ? String(data.icon) : undefined,
    image: String(data.image ?? ''),
    date: String(data.date ?? ''),
    body: content,
  };
}

function parseSnippet(filePath: string): Snippet {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
  const slug = basenameSlug(relative);

  return {
    id: relative,
    slug,
    url: `/vault/${slug}`,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    image: data.image ? String(data.image) : undefined,
    date: String(data.date ?? ''),
    body: content,
  };
}

function assertUniqueSlugs<T extends { slug: string; id: string }>(items: T[], kind: string) {
  const seen = new Map<string, string>();
  for (const item of items) {
    const prev = seen.get(item.slug);
    if (prev) {
      throw new Error(`Duplicate ${kind} slug "${item.slug}" (${prev} and ${item.id})`);
    }
    seen.set(item.slug, item.id);
  }
}

export type ContentIndex = {
  writings: Writing[];
  logs: Log[];
  snippets: Snippet[];
};

let index: ContentIndex | null = null;

export function loadContentIndex(): ContentIndex {
  if (index) {
    return index;
  }

  const writings = collectMdxFiles('writings').map(parseWriting);
  const logs = collectMdxFiles('logs').map(parseLog);
  const snippets = collectMdxFiles('snippets').map(parseSnippet);

  assertUniqueSlugs(writings, 'writing');
  assertUniqueSlugs(logs, 'log');
  assertUniqueSlugs(snippets, 'snippet');

  index = { writings, logs, snippets };
  return index;
}

/** @internal test helper */
export function resetContentIndexForTests() {
  index = null;
}
