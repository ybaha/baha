import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SectionLabelProps = {
  title: ReactNode;
  description?: ReactNode;
  titleId?: string;
  className?: string;
  titleClassName?: string;
};

export function SectionLabel({ title, description, titleId, className, titleClassName }: SectionLabelProps) {
  return (
    <header className={cn('mb-4', className)}>
      <h2
        id={titleId}
        className={cn('font-sans text-section-title font-semibold tracking-tight text-content', titleClassName)}
      >
        {title}
      </h2>
      {description && (
        <p className="mb-0 mt-1 text-body text-subtle">{description}</p>
      )}
    </header>
  );
}
