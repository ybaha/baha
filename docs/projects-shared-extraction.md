# Reuse plan for Projects page code

## What is genuinely shared
1. `useSpring` (3-axis damped spring with reduced-motion fallback) — used in the folder artwork. Move to `src/hooks/use-spring.ts` and convert to a generic tuple shape. Keep file-aware options (`axis` paint transform) out of the hook, leaving it to the caller.
2. `ExternalLink` — already a reusable link with trailing arrow, target blank, focus ring. Move to `src/components/ui/external-link.tsx`. The projects package re-exports it for type/usage continuity.
3. `SectionLabel` — small header. Move to `src/components/ui/section-label.tsx`. Projects can re-export.
4. `ProjectMark` and `ProductPreview` — projects-only; they need the project shape and dark variant. Keep inside `src/components/projects/shared.tsx`.
5. `OriginQuote` quote toggle and word-by-word animation — generic text-toggle component. Move to `src/components/ui/quoted-translation.tsx` (props: `original`, `english`, `ariaLabelEnglish`, `lang`). Reuse in the classroom site. Wait — there is exactly one usage in this codebase. Keep at `src/components/projects/origin-quote.tsx` for now; promote later if a second user appears.
6. `createSparklinePaths` — already a standalone math utility used only in the live ops cards. Not part of the projects work. Leave at `src/components/live-operations/chart-path.ts`. No extraction needed.

## What is project-specific
- `ProjectMark` (Karardex star, project shape, dark variant) — projects-only.
- `ProductPreview` (static-image with project mark fallback) — projects-only.
- `OriginStory` (header + grid + 2011 image) — projects-only.
- `FolderArtwork` (svg paths, spring axis painting, mask SVG data URL) — projects-only.
- `CollectionShelf` and `ProjectCollectionGrid` — projects-only.
- `RagSchematic` and `ProductDetails` and `ProductProof` — projects-only, deep coupling to product records.
- `SectionLabel` does not depend on projects, so it moves.
- `ExternalLink` does not depend on projects, so it moves.
- Tabs already lives at `src/components/ui/tabs.tsx`; no change.

## Risks
- `useSpring` is used in three places inside `folder-artwork.tsx` (card, flap, scale). Re-typing the tuple and verifying spring behavior on the live URL.
- `ExternalLink` becomes the canonical external link. If anything else in the repo still wraps an `<a target="_blank">`, the design is still fine — we are not changing the markup contract.
- `SectionLabel` is server-renderable. The dialog content uses it inside a client tree, but the component itself is a pure header. No client boundary required.

## Acceptance
- All 21 visual screenshots match the **before** set. Playwright assertions: folder back 321:270, modal contains 9 project links with `data-project-id`, Karardex details mentions "1M+ docs", Home + VPS present, story content gap ≤ 14 px, modal-close focus restoration, reduced-motion variants pass, no console/page errors.
- Build, tests, lint, whitespace pass.
- The only allowed edits are within `src/hooks`, `src/components/ui/`, and import statements in `src/components/projects/`.
