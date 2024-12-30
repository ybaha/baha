"use client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider
        defaultTheme="system"
        disableTransitionOnChange
        themes={["light", "dark"]}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
