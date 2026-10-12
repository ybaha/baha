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
  return <header className={cn('mb-4', className)}>
    <h2 id={titleId} className={cn('font-serif text-[26px] font-normal italic leading-tight text-foreground', titleClassName)}>{title}</h2>
    {description && <p className="mb-0 mt-1 text-[13px] leading-relaxed text-foreground/55">{description}</p>}
  </header>;
}
