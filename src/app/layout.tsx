import '@/global.css';
import '@/components/sidebar/sidebar.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';

import { SideMenu } from '@/components/side-menu';
import { MenuContent } from '@/components/menu-content';
import { SOCIALS, sharedDescription, sharedTitle } from '@/lib/constants';
import { siteUrl } from '@/lib/site';
import MainLayout from '@/components/main-layout';
import { FloatingHeader } from '@/components/floating-header';
import { ScrollArea } from '@/components/scroll-area';
import type { Metadata, Viewport } from 'next';
import { ClientToaster } from '@/components/client-toaster';
import { ContentMetadataProvider } from '@/components/content-metadata-provider';
import { getAllLogsMeta, getAllWritingsMeta } from '@/lib/content/selectors';

type Props = {
  children: React.ReactNode;
};

export const dynamic = 'force-static';

const getTitle = (path: string) => {
  if (path === '/') return 'Home';
  if (path === '/writings') return 'Writings';
  if (path === '/about') return 'About';
  return '404';
};

const cormorant = localFont({
  src: '../assets/Cormorant-Variable.woff2',
  weight: '300 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-cormorant',
});

export default async function RootLayout({ children }: Props) {
  const writings = getAllWritingsMeta();
  const logs = getAllLogsMeta();

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans text-body text-content" suppressHydrationWarning>
        <main vaul-drawer-wrapper="" className="sb-shell min-h-screen">
          <ContentMetadataProvider writings={writings} logs={logs}>
          <MainLayout>
            <div className="lg:flex">
              <SideMenu>
                <MenuContent />
              </SideMenu>
              <div className="app-main flex flex-1">
                <ScrollArea className="flex flex-col lg:flex-row bg-background" hasScrollTitle>
                  <FloatingHeader />
                  {children}
                </ScrollArea>
              </div>
            </div>
          </MainLayout>
          </ContentMetadataProvider>
        </main>
        <ClientToaster />
      </body>
    </html>
  );
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: {
    index: true,
    follow: true,
  },
  title: {
    template: `%s — ${sharedTitle}`,
    default: sharedTitle,
  },
  description: sharedDescription,
  icons: [
    // {
    //   media: '[data-theme="dark"]',
    //   url: "/favicon.ico",
    // },
    {
      // media: '[data-theme="light"]',
      url: '/favicon-light.ico',
    },
  ],
  openGraph: {
    title: {
      template: `%s — ${sharedTitle}`,
      default: sharedTitle,
    },
    description: sharedDescription,
    type: 'website',
    url: '/',
    siteName: sharedTitle,
    locale: 'en_IE',
  },
  alternates: {
    canonical: '/',
  },
  twitter: {
    card: 'summary_large_image',
    site: `@${SOCIALS.find((profile) => profile.url.includes('twitter'))?.username}`,
    creator: `@${SOCIALS.find((profile) => profile.url.includes('twitter'))?.username}`,
  },
  other: {
    pinterest: 'nopin',
  },
};
