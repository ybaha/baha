import {
  AirplaneTakeoffIcon,
  BabyIcon,
  BookIcon,
  BooksIcon,
  BriefcaseIcon,
  CircleIcon,
  CodeIcon,
  DotOutlineIcon,
  EnvelopeSimpleIcon,
  FileTextIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  MoonStarsIcon,
  PathIcon,
  PencilLineIcon,
  RocketLaunchIcon,
  SparkleIcon,
  SunIcon,
  TwitterLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { IconWeight } from "@phosphor-icons/react";

// Only the icons referenced from `lib/constants.ts` and content frontmatter
// are listed so the client bundle does not ship the whole Phosphor set. Keys
// are the stable names used in constants/frontmatter; values are the glyphs.
const ICONS = {
  Baby: BabyIcon,
  Book: BookIcon,
  BookUp: BooksIcon,
  Briefcase: BriefcaseIcon,
  Circle: CircleIcon,
  Code: CodeIcon,
  Dot: DotOutlineIcon,
  File: FileTextIcon,
  Github: GithubLogoIcon,
  Linkedin: LinkedinLogoIcon,
  Mail: EnvelopeSimpleIcon,
  MoonStar: MoonStarsIcon,
  PencilLine: PencilLineIcon,
  PlaneTakeoff: AirplaneTakeoffIcon,
  Rocket: RocketLaunchIcon,
  Search: MagnifyingGlassIcon,
  Sparkle: SparkleIcon,
  Sun: SunIcon,
  Twitter: TwitterLogoIcon,
  Wand: MagicWandIcon,
  Waypoints: PathIcon,
};

export type IconsType = keyof typeof ICONS;

type Props = {
  name: IconsType;
  color?: string;
  size?: number;
  className?: string;
  weight?: IconWeight;
};

export const Icons = ({ name, color, size, className, weight }: Props) => {
  const Icon = ICONS[name] ?? DotOutlineIcon;

  return <Icon color={color} size={size} className={className} weight={weight} />;
};
