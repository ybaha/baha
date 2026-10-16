import { compileMdx } from '@/lib/content/mdx-compile';
import { cn } from '@/lib/utils';

type Props = {
  source: string;
  journey?: boolean;
  className?: string;
};

export async function MdxContent({ source, journey, className }: Props) {
  const content = await compileMdx(source);

  return (
    <div className={cn('text-content', journey && 'text-body', className)}>
      {content}
    </div>
  );
}
