import { icons } from "lucide-react";

type Props = {
  name: keyof typeof icons;
  color?: string;
  size?: number;
  className?: string;
};

export const Icons = ({ name, color, size, className }: Props) => {
  const LucideIcon = icons[name || "Dot"];

  return <LucideIcon color={color} size={size} className={className} />;
};

export type IconsType = keyof typeof icons;
