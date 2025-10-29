import Link from '@/components/link';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { cn } from '@/lib/utils';
import { cloneElement } from 'react';

const mdxComponents = {
  Image: (props: any) => <img className={cn(props.className, 'rounded-lg')} {...props} />,
  Link: (props: any) => <Link {...props} />,
  ul: (props: any) => <ul {...props} className="mb-8 list-disc pl-7" />,
  ol: (props: any) => <ol {...props} className="mb-8 list-decimal pl-6" />,
  h2: (props: any) => <h2 {...props} className={cn(props.className, 'mb-5 lg:mb-5')} />,
  h3: (props: any) => <h3 {...props} className={cn(props.className, 'mb-4 lg:mb-5')} />,
  h4: (props: any) => <h4 {...props} className={cn(props.className, 'mb-3 lg:mb-4')} />,
  p: (props: any) => <p {...props} className="text-sm sm:text-base mb-4 lg:mb-6" />,
  pre: ({ children, className, ...props }: any) => {
    const hasLang = /language-(\w+)/.exec(className || '');

    // react.cloneElement(children, { className: cn(children.props.className, 'bg-transparent') });
    const clonedChildren = cloneElement(children, {
      className: cn(children.props.className, 'bg-transparent'),
    });

    return (
      <pre
        className={cn(
          'border rounded-lg font-medium dark:bg-zinc-900 dark:border-border p-4 mb-4 overflow-x-auto relative',
          className,
        )}
        {...props}
      >
        {hasLang && (
          <div className="absolute right-4 top-4 text-xs text-gray-400">{hasLang[1]}</div>
        )}
        {clonedChildren}
      </pre>
    );
  },
  code: ({ className, children, ...props }: any) => {
    return (
      <code
        className={cn('font-mono text-sm bg-[#f0f0f0] dark:bg-zinc-900 p-1 rounded-md', className)}
        {...props}
      >
        {children}
      </code>
    );
  },
};

interface MdxProps {
  code: string;
  journey?: boolean;
  className?: string;
}

export function Mdx({ code, journey, className }: MdxProps) {
  const MDXContent = useMDXComponent(code);
  return (
    <div className={cn('dark:text-gray-300 text-gray-800', journey && 'text-sm', className)}>
      <MDXContent components={mdxComponents} />
    </div>
  );
}
