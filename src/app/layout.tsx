import "@/global.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Cormorant } from "next/font/google";

import { SideMenu } from "@/components/side-menu";
import { MenuContent } from "@/components/menu-content";
import { SOCIALS, sharedDescription, sharedTitle } from "@/lib/constants";
import MainLayout from "@/components/main-layout";
import { FloatingHeader } from "@/components/floating-header";
import { ScrollArea } from "@/components/scroll-area";
import { CommandMenu } from "@/components/command-k";
import { cookies } from "next/headers";
import { Metadata } from "next";

type Props = {
  children: React.ReactNode;
};

const getTitle = (path: string) => {
  if (path === "/") return "Home";
  if (path === "/writings") return "Writings";
  if (path === "/about") return "About";
  return "404";
};

const cormorant = Cormorant({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

export default async function RootLayout({ children }: Props) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme");

  return (
    <html
      lang="en"
      className={`${GeistSans.className} ${GeistMono.variable} ${cormorant.className}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {theme?.value && (
          <style>
            {`
              :root {
                --color-primary: ${theme?.value};
              }
           `}
          </style>
        )}
        <main vaul-drawer-wrapper="" className="min-h-screen bg-background">
          <MainLayout>
            <div className="lg:flex">
              <SideMenu>
                <MenuContent />
              </SideMenu>
              <div className="flex flex-1">
                <ScrollArea
                  className="flex flex-col lg:flex-row bg-background"
                  hasScrollTitle
                >
                  <FloatingHeader />
                  {children}
                </ScrollArea>
              </div>
            </div>
          </MainLayout>
        </main>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL("https://baha.vercel.app/"),
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
      url: "/favicon-light.ico",
    },
  ],
  openGraph: {
    title: {
      template: `%s — ${sharedTitle}`,
      default: sharedTitle,
    },
    description: sharedDescription,
    type: "website",
    url: "/",
    siteName: sharedTitle,
    locale: "en_IE",
  },
  themeColor: "#ffffff",
  alternates: {
    canonical: "/",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  twitter: {
    card: "summary_large_image",
    site: `@${
      SOCIALS.find((profile) => profile.url.includes("twitter"))?.username
    }`,
    creator: `@${
      SOCIALS.find((profile) => profile.url.includes("twitter"))?.username
    }`,
  },
  other: {
    pinterest: "nopin",
  },
};
