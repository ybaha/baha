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
    <div className={cn('dark:text-gray-300 text-gray-800', journey && 'text-sm', className)}>
      {content}
    </div>
  );
}
