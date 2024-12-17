import Balancer from "react-wrap-balancer";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: JSX.Element;
  className?: string;
  [x: string]: any;
};

export const PageTitle = ({ title, subtitle, className, ...rest }: Props) => {
  return (
    <div className={cn("mb-6", className)}>
      <Balancer
        as="h1"
        {...rest}
        className="text-foreground font-serif italic font-normal"
      >
        {title}
      </Balancer>
      {subtitle}
    </div>
  );
};
