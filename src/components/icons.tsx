import {
  Baby,
  Book,
  BookUp,
  Briefcase,
  Circle,
  Code,
  Dot,
  File,
  Github,
  Linkedin,
  Mail,
  MoonStar,
  PencilLine,
  PlaneTakeoff,
  Rocket,
  Sparkle,
  Sun,
  Twitter,
  Wand,
  Waypoints,
} from "lucide-react";

// Only the icons referenced from `lib/constants.ts` and content frontmatter
// are listed so the client bundle does not ship the whole lucide set.
const ICONS = {
  Baby,
  Book,
  BookUp,
  Briefcase,
  Circle,
  Code,
  Dot,
  File,
  Github,
  Linkedin,
  Mail,
  MoonStar,
  PencilLine,
  PlaneTakeoff,
  Rocket,
  Sparkle,
  Sun,
  Twitter,
  Wand,
  Waypoints,
};

export type IconsType = keyof typeof ICONS;

type Props = {
  name: IconsType;
  color?: string;
  size?: number;
  className?: string;
};

export const Icons = ({ name, color, size, className }: Props) => {
  const LucideIcon = ICONS[name] ?? Dot;

  return <LucideIcon color={color} size={size} className={className} />;
};
