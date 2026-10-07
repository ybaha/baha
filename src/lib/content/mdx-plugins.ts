import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeCodeTitles from 'rehype-code-titles';
import rehypePrism from 'rehype-prism-plus';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';

export const remarkPlugins: PluggableList = [remarkGfm];

export const rehypePlugins: PluggableList = [
  rehypeSlug,
  rehypeCodeTitles,
  [rehypePrism, { showLineNumbers: true }],
  [
    rehypeAutolinkHeadings,
    {
      properties: {
        className: ['anchor'],
      },
    },
  ],
];
