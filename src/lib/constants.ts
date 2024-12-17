import { Icons, IconsType } from "@/components/icons";
import { Colors } from "@/stores/theme";

type Profile = {
  label: string;
  username: string;
  url: string;
  icon: IconsType;
};

export const SOCIALS: Profile[] = [
  {
    label: "Twitter",
    username: "bahaerarslan",
    url: "https://twitter.com/bahaerarslan",
    icon: "Twitter",
  },
  {
    label: "Github",
    username: "ybaha",
    url: "https://github.com/ybaha",
    icon: "Github",
  },
  {
    label: "Linkedin",
    username: "Baha Erarslan",
    icon: "Linkedin",
    url: "https://www.linkedin.com/in/bahaerarslan/",
  },
  {
    label: "Email",
    username: "ybahaerarslan@gmail.com",
    icon: "Mail",
    url: "mailto:ybahaerarslan@gmail.com",
  },
];

export const CV = `https://docs.google.com/document/d/1DMLHdW6D9c-Wy13KYntoTqrmeyLi02LXfO2IC5ecDos/edit?usp=sharing`;

export const sharedTitle = "Yusuf Baha Erarslan";
export const sharedDescription =
  "Yusuf Baha Erarslan is a software engineer who is passionate about web technologies and open source.";

export const TWEETS_COLLECTION_ID = 15896982;

export const LINKS = [
  {
    href: "/",
    label: "Home",
    icon: "Sparkle",
  },
  {
    href: "/writings",
    label: "Writings",
    icon: "PencilLine",
  },
  {
    href: "/logs",
    label: "Logs",
    icon: "Waypoints",
  },
  // {
  //   href: "/stack",
  //   label: "Stack",
  //   icon: "Wand",
  // },
  // {
  //   href: "/vault",
  //   label: "Vault",
  //   icon: "Files",
  // },
  // {
  //   href: "/projects",
  //   label: "Projects",
  //   icon: "Code",
  // },
] as {
  href: string;
  label: string;
  icon?: IconsType;
}[];

export const MOBILE_SCROLL_THRESHOLD = 20;

export const PROJECTS = [
  {
    title: "Botguise",
    description: "A platform to create and talk to AI powered custom chatbots.",
    url: "https://botguise.com",
  },
];

export const COLORS = {
  pink: "255 115 179",
  green: "153 153 0",
  blue: "63 65 186",
};
