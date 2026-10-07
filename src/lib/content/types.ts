export type WritingMeta = {
  id: string;
  slug: string;
  url: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  image?: string;
  imageClassName?: string;
  aiGenerated?: boolean;
  author?: string;
  readingTimeMinutes: number;
};

export type Writing = WritingMeta & {
  body: string;
};

export type LogMeta = {
  id: string;
  slug: string;
  title: string;
  icon?: string;
  image: string;
  date: string;
};

export type Log = LogMeta & {
  body: string;
};

export type SnippetMeta = {
  id: string;
  slug: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  date: string;
};

export type Snippet = SnippetMeta & {
  body: string;
};

export type LogYearGroup = {
  year: number;
  items: Log[];
};
