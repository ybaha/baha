import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import readingTime from "reading-time";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import rehypeCodeTitles from "rehype-code-titles";
import rehypePrism from "rehype-prism-plus";

export const Writing = defineDocumentType(() => ({
  name: "Writing",
  filePathPattern: `writings/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    image: { type: "string", required: false },
    imageClassName: { type: "string", required: false },
    date: { type: "date", required: true },
    aiGenerated: { type: "boolean", required: false },
    author: { type: "string", required: false },
    slug: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: false },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (post) => `/${post._raw.flattenedPath}`,
    },
    slug: {
      type: "string",
      resolve: (post) => {
        const path = post._raw.flattenedPath;
        const slug = path.split("/").pop();
        return slug;
      },
    },
    readingTime: {
      type: "number",
      resolve: (post) => readingTime(post.body.raw),
    },
  },
}));

export const Log = defineDocumentType(() => ({
  name: "Log",
  filePathPattern: `logs/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    icon: { type: "string", required: false },
    image: { type: "string", required: true },
    date: { type: "date", required: true },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (post) => `/${post._raw.flattenedPath}`,
    },
    slug: {
      type: "string",
      resolve: (post) => {
        const path = post._raw.flattenedPath;
        const slug = path.split("/").pop();
        return slug;
      },
    },
  },
}));

export const Snippet = defineDocumentType(() => ({
  name: "Snippet",
  filePathPattern: `snippets/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: true },
    image: { type: "string", required: false },
    date: { type: "date", required: true },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (post) => `/${post._raw.flattenedPath}`,
    },
    slug: {
      type: "string",
      resolve: (post) => {
        const path = post._raw.flattenedPath;
        const slug = path.split("/").pop();
        return slug;
      },
    },
  },
}));

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Writing, Log, Snippet],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      rehypeCodeTitles,
      [rehypePrism, { showLineNumbers: true }],
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ["anchor"],
          },
        },
      ],
    ],
  },
});
