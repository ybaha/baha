# Modernization plan: current stable, lean, and verified

Status: planned; implementation follows supervised Composer checkpoints.
Date: 2026-10-07
Repository: `~/code/baha`, `main`, original HEAD `caa47ffa0c63ad241826071e215e652ccd2693fa`.

## Objective

A small, maintainable personal site on current stable Next.js and Prisma, with server-rendered local MDX, working comments/auth, an accessible responsive UI, and a reproducible build. Preserve published URLs, content, the database model contract, and the recognizable design. Remove redundant implementations and dependencies rather than replacing them with a different large framework.

“Latest” means the newest stable compatible releases, verified against the registry and official migration guides—not prereleases or unsupported peer overrides. Any compatibility exception must be explicit in the final version table.

## Starting point

The preceding critical tranche is preserved: non-destructive builds, no homepage visitor fingerprinting, disabled legacy telemetry endpoints, privacy-safe comment feeds, correct pagination/static parameters, vault rendering, and a single article mount.

The security patch tranche is also preserved: Next 15.5.27, React 19.0.8, NextAuth 4.24.15 with its v4 Prisma adapter, and patched dependencies. Its recorded tests, typecheck, lint, production build, and desktop/mobile dev checks pass. Full npm audit remains at 53 affected entries (0 critical, 27 high, 26 moderate); production-install audit has 46 entries. These are dependency entries, not a count of independently exploitable vulnerabilities.

All existing changes are uncommitted. The accepted baseline, package/lock snapshots, and partial diff are saved under `/tmp/baha-modernization/before`. No worker may discard them.

## Target stack

Registry snapshot (verify again when installing):

| Area | Target | Decision |
| --- | --- | --- |
| Next.js | 16.4.0 | Current stable; migrate CLI/config/request API behavior, not just the version. |
| React / React DOM | 19.3.0 | Matching stable versions and corresponding React types. |
| Prisma CLI / Client / PostgreSQL adapter | 7.10.0 for all three | Matching stable versions. The CLI's `latest` tag currently points to **8.0.0-rc.21**, while Client/adapter stable is 7.10.0; do not mix releases or adopt the RC silently. |
| PostgreSQL driver | `pg` 8.23.1 | Explicit driver for the Prisma 7 PostgreSQL adapter; controlled pool lifecycle. |
| TypeScript | 7.0.2 | Validate the native/compiler API transition and migrate tests away from assumptions about the old `transpileModule` API. If a required integration is incompatible, report the exact blocker before choosing an older release. |
| ESLint / Next config | 10.12.0 / 16.4.0 | Flat config; invoke ESLint directly, not removed `next lint`. |
| Tailwind / PostCSS plugin | 4.3.3 / 4.3.3 | CSS-first token/source configuration, preserving existing colors/breakpoints/typography and responsive behavior. |
| MDX | `@mdx-js/mdx` 3.1.1 plus one small RSC renderer if justified | Replace Contentlayer's generated-client/plugin/tooling graph with a server-only local-content loader. `next-mdx-remote` 6.0.0 is a candidate; no duplicate MDX/rendering stacks. |
| Theme | `next-themes` 0.4.6 if retained | One light/dark mechanism and one accent preference; no unused Zustand store or automatic focus-stealing demo. |
| Auth | NextAuth stable 4.24.15 initially | Keep GitHub/Google and database sessions; no gratuitous auth-provider migration or beta Auth.js adoption. Validate v4 adapter compatibility with Prisma 7 and Next 16 using actual local DB/session tests. |
| Node | A supported minimum satisfying installed tools | Current machine is Node 22.21.1. Prisma requires Node 20.19/22.12+, ESLint 10 requires 22.13+ on the 22 line. Declare and document a coherent minimum; do not install a new system runtime. |

Retained UI libraries must have demonstrated use and compatible stable versions. Do not upgrade unused libraries: delete them after proving they have no consumers.

## Non-negotiable boundaries

- Preserve current routes, writing slugs, log anchors, MDX text, project links, existing user/account/session data semantics, and the visual identity.
- No production database connection, introspection, migration, schema push, destructive command, push, commit, deployment, or secret inspection. Upgrade Prisma mechanically without changing business models.
- Project-local package installs are approved. Global/Python/browser/runtime/plugin installs are **not** approved. Use the already installed browser tooling; report setup failures instead of installing a fallback.
- Do not use `--force`, `--legacy-peer-deps`, audit suppression, ignored type/build failures, placeholder tests, or source-level validation backdoors.
- One source writer per checkout. Parallel Composer work is read-only planning/review only. Every writer phase has a bounded output, real validation, and a checkpoint before the next phase.
- User-visible feature removal is not implied by “less bloat.” Preserve comments, votes, search, filters, themes, and public pages. Removing the unsafe legacy developer-only AI publisher must be explicitly identified in the plan/checkpoint; do not replace it with another unprotected HTTP writer.

## Phase 0 — Recon, decisions, and baseline

Two read-only Composer specialists inspect independent seams:

1. Next 16 / Prisma 7 / latest TypeScript-ESLint compatibility, official migration rules, driver/generator/adapter contracts, and safe real-DB testing.
2. Content/UI/package import graph, a simpler local MDX architecture, genuinely dead code/dependencies, Tailwind 4 migration, and preservation tests.

Record installed/locked versions, direct/total dependency count, production JS payload baseline where practical, route/content inventory, existing test results, and audit evidence. Finalize this plan with their evidence; unresolved material decisions go to the parent before source changes.

### Acceptance

A specific dependency/version matrix, route/content preservation inventory, removal list backed by call sites, implementation order, and test commands. No unbounded rewrite assignment.

## Phase 1 — Modern platform and database foundation

- Move Next to stable 16.4.0 and React/DOM to 19.3.0 with aligned types.
- Replace `next lint` and legacy ESLint configuration with direct ESLint and flat Next config. Keep actual lint/type checks; no ignore flags.
- Validate TypeScript 7 and update compiler target/config/test tooling for modern supported browsers. Keep a small Node-based test runner; introduce a TS execution helper only if it materially simplifies the tests.
- Upgrade Prisma CLI/Client/adapter together to stable 7.10.0; add `prisma.config.ts`, move datasource configuration out of the schema as required, supply the PostgreSQL driver adapter, and keep one development-safe client/pool instance.
- Choose the supported generated-client output/import contract based on the v4 auth adapter and fresh-install evidence. Prefer the current Prisma generator where compatible; do not leave stale generated node_modules to conceal incompatibility. An explicitly documented supported legacy generator is acceptable only if required by the retained auth adapter and verified from a clean generation.
- Preserve all existing models/constraints. No production migration is required merely to change ORM runtime/config; do not invent/apply a migration baseline for the existing deployment.
- Use `--webpack` temporarily if Contentlayer remains during this phase. Remove the flag only after the content plugin is gone and default Turbopack is proven.
- Scope Next tracing to this repository instead of an unrelated parent lockfile.

### Acceptance

Matching Prisma versions and clean generation; no stale imports/clients or peer conflicts; `npm ls`, typecheck, lint, tests, production build, and auth providers/session/CSRF checks pass. Current content routes and P0 behaviors still work. No source backdoors and no production DB access.

## Phase 2 — Remove the content/tooling bloat

- Replace Contentlayer with a small server-only local-content module and one MDX rendering path. Typed metadata plus a raw MDX body are enough; no bespoke plugin/telemetry system or generated body code shipped to the browser.
- Explicitly validate required metadata, dates, tags, duplicate slugs, and file containment. Provide sorted pure selectors for writings, logs, and snippets.
- Preserve the existing filename-derived writing/vault URLs and current log anchors. Existing frontmatter slugs conflict with published URLs; resolve that ambiguity without silently renaming pages. Fix reading-time type/data mismatch.
- Compile/render article and timeline MDX on the server. Pass metadata-only arrays to search, sidebar/filter, and floating-header clients; pass rendered children to interactive wrappers instead of embedding every article body in client bundles.
- Preserve current Markdown/MDX features: custom Link/Image components, GFM, code blocks/titles/highlighting, heading anchors, and timeline content. Test the real 19 documents, not only fabricated Markdown.
- Delete Contentlayer config, generated-path coupling, obsolete plugins, and old MDX/rendering dependencies only after all consumers have migrated.
- Replace `next-sitemap` and stale checked-in XML/robots artifacts with native App Router metadata routes. Include real public URLs, exclude admin/invalid routes, use one site-origin setting, and emit route-specific canonicals/social URLs.

### Acceptance

All 19 content documents load/render; published URLs/anchors are unchanged; no Contentlayer imports/webpack plugin remain; no body/code collections in client props; native sitemap/robots/canonical behavior is tested. Default Next 16 dev/build bundling is proven or any temporary compatibility exception is named.

## Phase 3 — Lean UI, styling, and accessibility

- Migrate to Tailwind 4 CSS-first configuration with the official PostCSS plugin; remove redundant nesting/import/autoprefixer tooling where no longer needed.
- Preserve current custom breakpoints, spacing, typography, colors, dark selector, and scroll layout. Complete missing semantic tokens used by retained UI components.
- Keep one command palette, one drawer implementation, one icon mechanism, one theme mechanism, and one tag component. Delete unused alternatives and genuinely unreferenced UI components/assets.
- Replace all-icons imports with a small explicit icon map covering current constants/content and a safe fallback. Remove the separate unused icon package.
- Remove unused state/store and obsolete server/demo integrations. Replace redundant cookie helpers with a single small accent-preference implementation where appropriate.
- Restore persisted accents and live toast theming; remove automatic popover/focus/preference changes. Respect reduced motion.
- Fix missing control names, keyboard-inaccessible triggers, duplicate DOM IDs, disabled focus indicators, missing image alternatives, and tag-overflow loading state.
- Avoid in-place sorting/mutating props, debug dumps, and unnecessary per-item measurement/event listeners.
- Retain Framer Motion/carousel/etc. only where actually used and valuable; small CSS equivalents are preferred when they preserve behavior. Do not break public functionality to chase package counts.

### Acceptance

Desktop/mobile screenshots, navigation, keyboard search/filter/drawer, light/dark/accent persistence, content readability/scrolling, and reduced-motion checks pass. No unexpected console errors/horizontal overflow; measurable dependency/client-payload reduction.

## Phase 4 — Simple, consistent server contracts

- One comments service for actions and REST routes, with runtime validation, bounded pagination, valid post slugs, trimmed/nonempty text, privacy-safe DTOs, and consistent error results.
- Enforce the existing daily comment quota atomically in PostgreSQL, including concurrent-request tests. Do not add Redis or another external service merely for this small site.
- Authenticate and authorize every vote mutation, make toggles concurrency-safe, and validate target comments. Remove public helper actions that delete arbitrary IDs.
- Preserve drafts on failures, preserve expanded comment pages during interactions, prevent late responses overwriting newer post state, and expose useful errors/loading states without clearing user input.
- Validate view slugs and prevent duplicate mount/tab increments. Keep view counts explicitly approximate; do not reintroduce fingerprinting or invent a tracking/analytics platform. A stronger distributed analytics contract requires a separate owner decision.
- Remove or replace unsafe/unneeded legacy developer-only AI publishing/admin and dormant Notion/Telegram/encryption code after the parent confirms that feature is not required. Retain explicit Gone responses for retired public endpoints where useful.

### Acceptance

Real local DB tests cover sessions, private-data exclusion, cursor boundaries, authorizations, quota concurrency, vote toggles, and invalid input. Browser tests cover authenticated commenting/voting using synthetic local database sessions—no real OAuth provider calls.

## Phase 5 — Reproducibility, docs, and final review

- Keep deterministic lockfile/engine requirements and explicit direct dependencies. Remove obsolete overrides once their parent trees disappear; do not carry security patches for deleted packages.
- Add concise setup, required environment **names**, local content workflow, safe build/deploy, Prisma generation/config, and migration-baseline documentation. No real keys/URLs containing credentials in docs/tests.
- Add CI for install, generate, lint, typecheck, unit/integration tests as appropriate, and a production build with safe synthetic configuration. No implicit production schema sync.
- Compare direct/total dependency counts and production JS payload to Phase 0. Report the actual reduction, not invented targets.
- Run final full/production audit; aim for zero critical/high entries where safe upgrades/removals permit it. Every remaining advisory needs a dependency path, applicability assessment, and honest disposition, not an audit suppression.
- Independent read-only Composer review of the real diff, compatibility, database/auth contracts, dependency graph, and browser/build evidence. Parent inspects artifacts and owns acceptance.

## Validation contract

For each implementation checkpoint:

1. Capture real exit codes and complete logs outside the repository. A validation command may return a normal tool result while recording a failed check; it may never be represented as a pass.
2. Run current Node regression tests, typecheck, ESLint, generation/content checks, and production build. Inspect generated route output, not just a successful compiler process.
3. Start owned Next dev on a free loopback port; leave other projects alone. Use existing Python Playwright and cached Chromium—no browser installations.
4. Check homepage, all public indexes, writings, vault snippets, log anchors, search/filter, theme persistence, desktop 1440×900 and mobile 390×844 scrolling/sticky header, comments pagination/privacy/authorization, and retired endpoints.
5. Block non-local browser requests by parsed hostname; distinguish intentionally blocked resources from application errors. Check browser **and** current-run server logs.
6. Exercise Prisma/auth against a disposable PostgreSQL cluster using the already installed PostgreSQL 14.21 tools under a unique `/tmp` directory/loopback port. Schema creation is allowed **only** for that owned disposable test DB. Reject any non-loopback DB URL in the harness. Never connect to or migrate the configured production database.
7. Shut down owned Node process groups and temporary Postgres in `finally`, verify ports are free, retain useful logs/screenshots, and keep scratch artifacts out of source.
8. Check the final diff and that changes are unstaged/uncommitted unless the owner later requests otherwise.

## Execution board

- [x] Read-only compatibility and lean-content/UI research.
- [x] Final plan and Phase 0 baseline.
- [x] Phase 1 (platform/database), Phase 2 (content/SEO), Phase 3 (UI/a11y), Phase 4 (server contracts), Phase 5 (docs/CI/metrics): each with gates run by the parent.
- [ ] Independent read-only review of the final diff (not run: the subagent budget was exhausted before Phase 5; the parent verified each phase instead).
- [ ] Owner decisions and deployment (see "Open items").

## Results (measured, Phase 5)

| Metric | Original `HEAD` | Now |
| --- | ---: | ---: |
| Direct `dependencies` | 52 | 37 |
| Direct `devDependencies` | 11 | 14 |
| Packages in `package-lock.json` | 902 | 989 |
| Of which non-dev | 667 | 653 |
| `npm audit` (all) | 73 (6 critical) | 19 (0 critical, 11 high) |
| `npm audit --omit=dev` | not recorded | 16 (0 critical, 9 high) |

The transitive tree is **not** smaller overall: Prisma 7, TypeScript 7 (plus the
TS6 compatibility package ESLint needs) and ESLint 10 add more than the removed
libraries took out. Direct production dependencies fell by 15.

Client JS (gzip, scripts referenced by the prerendered HTML, polyfills excluded),
same method before/after the icon fix: about 323 kB → 216 kB per public page
(`/` 216 kB, `/writings/<slug>` 223 kB). The full `lucide-react`
icon map had been bundled via `icons[name]`; icons are now an explicit registry
(`src/components/icons.tsx`). The earlier Next 15.5 build log reported 116 kB for
`/`, but that was a different tool and counting method and no baseline build
exists to remeasure, so no like-for-like claim against it is made. The React +
Next runtime alone is about 131 kB.

Remaining advisories (19) are all in build/dev tooling, not in code that handles
requests:

- `tailwindcss@3` → `chokidar`/`micromatch`/`braces`/`fast-glob`, `postcss-nested`,
  `postcss-selector-parser`, `@tailwindcss/typography`, `tailwindcss-animate`:
  build-time globbing/parsing of this repo's own files. The advisory-free path is
  Tailwind 4 (deferred, high-risk).
- `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob`/`micromatch`/
  `braces`: lint-time only. `npm audit`'s "fix" is a downgrade to v14.
- `prisma` CLI → `@prisma/config` → `deepmerge-ts`, and `mysql2`: Prisma CLI
  tooling; this app only uses PostgreSQL through `@prisma/adapter-pg`. The offered
  "fix" is a downgrade to Prisma 6.
- `gray-matter` → `js-yaml@3` → `argparse` → `sprintf-js`: parses author-owned
  frontmatter in `content/` only. Removable by switching frontmatter parsing to
  `next-mdx-remote`'s built-in option; not done.

No audit suppression is used. The `postcss` and `protobufjs` overrides were
removed because audit results are unchanged without them.

## Resolved by the owner after Phase 5

- `/admin` and `/api/write` (dev-only AI publisher) deleted, together with `openai`, `axios`, and the `OPENAI_API_KEY` / `IMGBB_API_KEY` variables.
- `sync-images` / `watch-images` scripts deleted.
- Untracked `AGENTS.md` deleted.

## Open items

1. Production runs PostgreSQL 12.22 (EOL upstream); consider upgrading the server.
2. `next/font/google` (Cormorant) is fetched from Google at build time, so builds need network access (self-hosting the font would remove that).
3. The hydration warning seen in earlier browser runs is a Playwright artifact (it injects `caret-color` when screenshotting mid-hydration); with no screenshot there are zero hydration warnings in dev or production.
4. `.github/workflows/ci.yml` has not run on GitHub; it was validated by running
   the same commands in a clean copy with `npm ci` and synthetic environment only.
5. Tailwind 3 → 4 migration (clears most remaining audit entries) is deferred.

## Database baseline (done)

Production (`blog_db`, PostgreSQL 12.22) was backed up (custom + plain dumps, restore verified by row counts), diffed against `schema.prisma` (no difference), and `0_init` was marked applied. Only the `_prisma_migrations` bookkeeping table was added; application tables/rows are unchanged.
