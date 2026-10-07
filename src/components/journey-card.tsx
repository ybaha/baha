import { Icons } from "./icons";
import Balancer from "react-wrap-balancer";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: ReactNode;
  image?: string;
  index: number;
  date: string;
}

export const JourneyCard = (props: Props) => {
  const { title, description, image, index, date } = props;

  return (
    <div className="word-break-word flex flex-col group ">
      <Balancer>
        <span className="font-semibold">
          {title}
          {date && (
            <span className="text-xs text-foreground/70 font-[400] group-hover:opacity-100 opacity-0 transition-all inline-block">
              {<Icons name="Dot" size={16} className="inline-block mx-1" />}
              {new Date(date).toLocaleString("en-UK", {
                day: "numeric",
                month: "long",
              })}
            </span>
          )}
        </span>
      </Balancer>

      {description}
    </div>
  );
};
