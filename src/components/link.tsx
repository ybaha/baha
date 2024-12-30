import { default as NextLink } from "next/link";
import { AnchorHTMLAttributes } from "react";
import { Url } from "url";

type Props = {
  children: React.ReactNode;
  href: Url | string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export default function Link(props: Props) {
  return (
    <NextLink
      {...props}
      className="underline decoration-primary hover:bg-primary hover:text-white hover:no-underline transition-all duration-100 px-0.5 -mx-0.5"
    />
  );
}
