import type { ReactNode } from 'react';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

export type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  'aria-label'?: string;
};

export function ExternalLink({ href, children, className, title, ...rest }: ExternalLinkProps) {
  return <a href={href} target="_blank" rel="noopener noreferrer" title={title} aria-label={rest['aria-label']}
    className={cn('inline-flex items-center gap-1.5 rounded-sm text-body text-subtle transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}>
    {children}<ArrowUpRightIcon size={14} aria-hidden="true" className="shrink-0" />
  </a>;
}
