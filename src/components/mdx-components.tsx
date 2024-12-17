import Image from "next/image";
import Link from "next/link";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { cn } from "@/lib/utils";

const mdxComponents = {
  Image: (props: any) => (
    <img className={cn(props.className, "rounded-lg")} {...props} />
  ),
  Link: (props: any) => (
    <Link
      {...props}
      className="underline decoration-primary hover:bg-primary hover:text-white hover:no-underline transition-all duration-100 px-0.5 -mx-0.5"
    />
  ),
  ul: (props: any) => <ul {...props} className="mb-8 list-disc pl-7" />,
  ol: (props: any) => <ol {...props} className="mb-8 list-decimal pl-6" />,
  h2: (props: any) => (
    <h2 {...props} className={cn(props.className, "mb-5 lg:mb-5")} />
  ),
  h3: (props: any) => (
    <h3 {...props} className={cn(props.className, "mb-4 lg:mb-5")} />
  ),
  h4: (props: any) => (
    <h4 {...props} className={cn(props.className, "mb-3 lg:mb-4")} />
  ),
  p: (props: any) => (
    <p {...props} className="text-sm sm:text-base mb-4 lg:mb-6" />
  ),
  pre: (props: any) => (
    <pre
      {...props}
      className={cn(
        "border rounded-lg font-medium dark:bg-zinc-900 dark:border-border p-4 mb-4",
        props.className
      )}
    />
  ),
};

interface MdxProps {
  code: string;
  journey?: boolean;
  className?: string;
}

export function Mdx({ code, journey, className }: MdxProps) {
  const MDXContent = useMDXComponent(code);
  return (
    <div
      className={cn(
        "dark:text-gray-300 text-gray-800",
        journey && "text-sm",
        className
      )}
    >
      <MDXContent components={mdxComponents} />
    </div>
  );
}
