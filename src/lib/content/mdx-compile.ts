import 'server-only';

import { compileMDX } from 'next-mdx-remote/rsc';
import { mdxComponentMap } from '@/components/mdx/mdx-component-map';
import { rehypePlugins, remarkPlugins } from './mdx-plugins';

export async function compileMdx(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponentMap,
    options: {
      mdxOptions: {
        remarkPlugins,
        rehypePlugins,
      },
    },
  });

  return content;
}
