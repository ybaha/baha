import { Icons, IconsType } from '@/components/icons';
import { Colors } from '@/stores/theme';

type Profile = {
  label: string;
  username: string;
  url: string;
  icon: IconsType;
};

export const SOCIALS: Profile[] = [
  {
    label: 'Twitter',
    username: 'bahaerarslan',
    url: 'https://twitter.com/bahaerarslan',
    icon: 'Twitter',
  },
  {
    label: 'Github',
    username: 'ybaha',
    url: 'https://github.com/ybaha',
    icon: 'Github',
  },
  {
    label: 'Linkedin',
    username: 'Baha Erarslan',
    icon: 'Linkedin',
    url: 'https://www.linkedin.com/in/bahaerarslan/',
  },
  {
    label: 'Email',
    username: 'ybahaerarslan@gmail.com',
    icon: 'Mail',
    url: 'mailto:ybahaerarslan@gmail.com',
  },
];

export const CV = `https://docs.google.com/document/d/1DMLHdW6D9c-Wy13KYntoTqrmeyLi02LXfO2IC5ecDos/edit?usp=sharing`;

export const sharedTitle = 'Yusuf Baha Erarslan';
export const sharedDescription =
  'Yusuf Baha Erarslan is a software engineer who is passionate about web technologies and open source.';

export const TWEETS_COLLECTION_ID = 15896982;

export const LINKS = [
  {
    href: '/',
    label: 'Home',
    icon: 'Sparkle',
  },
  {
    href: '/writings',
    label: 'Writings',
    icon: 'PencilLine',
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: 'Code',
  },
  {
    href: '/tech-stack',
    label: 'Tech Stack',
    icon: 'Wand',
  },
  {
    href: '/logs',
    label: 'Logs',
    icon: 'Waypoints',
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
    name: 'PicU',
    description: 'PicU is a photo editing app that allows you to transform your photos with AI.',
    image: '/projects/picu.png',
    url: 'https://apps.apple.com/nl/app/picu-transform-your-photos-ai/id6745964976?l=en-GB',
    year: 2025,
  },
  {
    name: 'pico cards',
    description:
      'pico cards is a conversation-starting app designed to help people connect better with partners, friends, or family.',
    image: '/projects/pico.png',
    url: 'https://poshet.co/apps/pico',
    year: 2025,
  },
  {
    name: 'stellarzen',
    description:
      'stellarzen offers personalized astrological insights, interpreting your birth chart to guide personal growth and important life decisions.',
    image: '/projects/stellarzen.png',
    url: 'https://stellarzen.co',
    year: 2024,
  },
  {
    name: 'Personal Website',
    description: 'My digital garden where I share my thoughts and experiences.',
    image: '/projects/baha.png',
    url: 'https://baha.vercel.app',
    year: 2024,
  },
  {
    name: 'Botguise',
    description:
      'BotGuise creates AI-powered chatbots that bring your favorite personalities to life, blending entertainment and engagement.',
    image: '/projects/botguise.png',
    url: 'https://botguise.com',
    year: 2023,
  },
  {
    name: 'Poshet',
    description:
      'Poshet crafts tailored, SEO-first digital experiences that transform businesses with expertly designed websites, e-commerce solutions, and web apps to drive customer conversions.',
    image: '/projects/poshet.png',
    url: 'https://poshet.co',
    year: 2023,
  },
  {
    name: 'Fullsocial',
    description:
      'Fullsocial is a platform that helps you get image assets from spotify in high quality, album covers, artist images, user images, etc.',
    image: '/projects/fullsocial.png',
    url: 'https://fullsocial.co',
    year: 2023,
    abandoned: true,
  },
];

export const COLORS = {
  pink: '255 115 179',
  green: '153 153 0',
  blue: '63 65 186',
};
