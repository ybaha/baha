import Link from '@/components/link';
import { cn } from '@/lib/utils';
import { cloneElement, type ReactElement } from 'react';

export const mdxComponentMap = {
  Image: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { alt, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={cn(rest.className, 'rounded-lg')}
        alt={alt ?? ''}
        loading="lazy"
        {...rest}
      />
    );
  },
  Link: (props: React.ComponentProps<typeof Link>) => <Link {...props} />,
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="mb-8 list-disc pl-7" />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="mb-8 list-decimal pl-6" />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className={cn(props.className, 'mb-5 lg:mb-5')} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className={cn(props.className, 'mb-4 lg:mb-5')} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 {...props} className={cn(props.className, 'mb-3 lg:mb-4')} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="text-sm sm:text-base mb-4 lg:mb-6" />
  ),
  pre: ({ children, className, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
    const hasLang = /language-(\w+)/.exec(className || '');
    const childElement = children as ReactElement<{ className?: string }> | undefined;
    const clonedChildren =
      childElement && typeof childElement === 'object'
        ? cloneElement(childElement, {
            className: cn(childElement.props?.className, 'bg-transparent'),
          })
        : children;

    return (
      <pre
        className={cn(
          'border rounded-lg font-medium bg-background-tertiary dark:bg-zinc-900 dark:border-border p-4 mb-4 overflow-x-auto relative',
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
  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        'font-mono text-sm bg-background-tertiary dark:bg-zinc-900 p-1 rounded-md',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  ),
};
