import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: ReactElement;
  className?: string;
  [x: string]: any;
};

export const PageTitle = ({ title, subtitle, className, ...rest }: Props) => {
  return (
    <div className={cn("mb-6", className)}>
      <h1
        {...rest}
        className="text-balance font-serif text-page-title font-normal italic text-content md:text-page-title-lg"
      >
        {title}
      </h1>
      {subtitle}
    </div>
  );
};
