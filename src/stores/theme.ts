import { create } from "zustand";
import { COLORS } from "@/lib/constants";

export type Colors = keyof typeof COLORS;

type ThemeProps = {
  themeColor: Colors;
  setTheme: (theme: Colors) => void;
  getThemeColorHex: (theme: Colors) => string;
};

export const useThemeStore = create<ThemeProps>((set) => ({
  themeColor: "blue",
  getThemeColorHex: (theme) => COLORS[theme],
  setTheme: (theme) => set({ themeColor: "blue" }),
}));
