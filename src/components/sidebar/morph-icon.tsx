import { Icons, IconsType } from "@/components/icons";

// Karardex-style icon morph using Phosphor's native weight pairs: the regular
// glyph springs into its fill twin on hover / focus / active. The swap itself
// lives in sidebar.css (`.sb-icon`).
export const MorphIcon = ({ name }: { name: IconsType }) => (
  <span className="sb-icon" aria-hidden>
    <Icons name={name} size={16} weight="regular" className="sb-icon-rest" />
    <Icons name={name} size={16} weight="fill" className="sb-icon-morph" />
  </span>
);
