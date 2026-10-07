import { loadContentIndex } from './load';
import type {
  Log,
  LogMeta,
  LogYearGroup,
  Snippet,
  SnippetMeta,
  Writing,
  WritingMeta,
} from './types';

function toWritingMeta(writing: Writing): WritingMeta {
  const { body: _body, ...meta } = writing;
  return meta;
}

function toLogMeta(log: Log): LogMeta {
  const { body: _body, ...meta } = log;
  return meta;
}

function toSnippetMeta(snippet: Snippet): SnippetMeta {
  const { body: _body, ...meta } = snippet;
  return meta;
}

export function getAllWritingsMeta(): WritingMeta[] {
  const { writings } = loadContentIndex();
  return writings
    .map(toWritingMeta)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllWritings(): Writing[] {
  const { writings } = loadContentIndex();
  return [...writings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getWritingBySlug(slug: string): Writing | undefined {
  const { writings } = loadContentIndex();
  return writings.find((writing) => writing.slug === slug);
}

export function getAllWritingSlugs(): string[][] {
  return getAllWritingsMeta().map((writing) => [writing.slug]);
}

export function getAllLogsMeta(): LogMeta[] {
  const { logs } = loadContentIndex();
  return logs
    .map(toLogMeta)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllLogs(): Log[] {
  const { logs } = loadContentIndex();
  return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getLogsGroupedByYear(): LogYearGroup[] {
  const sorted = getAllLogs();
  const groups = new Map<number, Log[]>();

  for (const log of sorted) {
    const year = new Date(log.date).getFullYear();
    const bucket = groups.get(year) ?? [];
    bucket.push(log);
    groups.set(year, bucket);
  }

  return Array.from(groups.entries())
    .map(([year, items]) => ({ year, items }))
    .sort((a, b) => b.year - a.year);
}

export function getAllSnippetsMeta(): SnippetMeta[] {
  const { snippets } = loadContentIndex();
  return snippets
    .map(toSnippetMeta)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllSnippets(): Snippet[] {
  const { snippets } = loadContentIndex();
  return [...snippets].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getSnippetBySlug(slug: string): Snippet | undefined {
  const { snippets } = loadContentIndex();
  return snippets.find((snippet) => snippet.slug === slug);
}
