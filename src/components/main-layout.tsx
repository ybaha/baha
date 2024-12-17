"use client";
import { ThemeProvider } from "next-themes";

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <ThemeProvider
      defaultTheme="system"
      disableTransitionOnChange
      themes={["light", "dark"]}
    >
      {children}
    </ThemeProvider>
  );
}
