# Projects page — current design

## Content

- Karardex is the flagship; Postmixr is the second featured product.
- Three switchable compositions: V1 Editorial, V2 Workspace, V3 Index. Shared content and interactions, not three divergent datasets.
- Mobile apps and earlier work open in wide accessible collection dialogs. Viralty and Clean lead the app collection. All twelve original projects remain available.
- The classroom-site story with Mert remains visible. The owner’s 1728×1201 screenshot sits inline in the story card without cropping; clicking opens its full-size image. The Turkish quote has an animated English translation toggle. The archive link identifies April 2011 rather than an invented launch date.

## Visual constraints

- Match baha.vercel.app typography: the existing Georgia serif and system-sans rendering. No new fonts or monospace project labels.
- Respect the actual content container (maximum 768px), including laptop widths narrowed by the sidebar. Use container queries, not just viewport breakpoints.
- Product titles are normal, non-italic serif. Postmixr uses the same neutral glossy card material as collection launchers. Folder artwork uses the owner-provided geometry and spring motion, a softened primary tint, a dent-matched backdrop mask, and logo-only contents that spread wider on hover.
- Image frames have modest rounded corners. Karardex and Postmixr use verified, privacy-safe, lossless 1600×900 captures, displayed at their native 16:9 ratio without object-cover or another optimization pass.
- Dark page background is quiet charcoal rather than absolute black. Preserve shared surface lighting and restrained shadows.
- Badges use spans, not globally indented list items. Local paragraph spacing is explicit.

## Interactions

- Version selector supports roving focus, arrows, Home/End and tab/panel associations.
- Folder previews fan on hover/focus; click, Enter or Space opens a wide dialog with larger icons, single-word categories, correct external links, Escape dismissal and restored trigger focus.
- Both featured products have detail dialogs. Karardex’s shorter RAG schematic shows owner-reported 1M+ embedded documents, rented RTX 5090 batch compute, and laptop-hosted serving, with external LLMs distinguished. Tech labels are compact and Karardex carries a star marker.
- Postmixr’s latest read-only snapshot is 935 accounts and 1,013 completed tool events at 2026-10-12T13:58:28Z. The card shows the supported 1,000+ tool-run floor, underlined; it does not claim the unsupported 950+ account floor.
- Live-ops variants and homepage integration were checkpointed in git commit 76ced6b before relocation. The homepage no longer mounts them; Projects embeds the full-width cluster with larger text. Its synthetic telemetry remains a local design prototype and is not production evidence. Presentation-only fixture labels are hidden.
- Postmixr shows a dated aggregate-only production snapshot. Registered account count, completed tool runs and trailing-24-hour authenticated tool users are explicitly distinguished from paid customers and general website traffic.
- Karardex’s laptop-hosting description comes from current self-host deployment docs, not mock homepage telemetry. No private infrastructure addresses, credentials or customer details are published.

## Acceptance

Inspect actual renders of all three versions before handoff. Check narrow laptop, phone, light/dark and reduced-motion states; modal sizing, keyboard behaviour, image aspect ratios, rounded clipping, actual rendered fonts and external URLs. Build/typecheck, unit tests and configured lint must pass. Preserve unrelated existing edits; no package installs, new servers, source-repo commits or production database writes.
