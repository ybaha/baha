# Log refresh sources

Verified 2026-10-17. Log dates describe the named milestone, not necessarily a project's first commit or first launch. Existing personal/work milestones and basename anchors were preserved. PicU's copied title/link and development date were replaced with its verified release details, retaining `#created-picu`.

## App releases

Apple's public Lookup API (`https://itunes.apple.com/lookup?id=APP_ID&country=nl`), using `releaseDate`, not `currentVersionReleaseDate`:

| App | ID | Release date |
| --- | --- | --- |
| PicU | 6745964976 | 2025-07-02 |
| Math Help AI | 6740034105 | 2025-08-12 |
| VidGen3 | 6749280633 | 2025-08-12 |
| GLB | 6749620007 | 2026-01-14 |
| Grip | 6755091590 | 2026-02-16 |
| Rooma | 6758413701 | 2026-02-20 |
| Clean | 6802110217 | 2026-08-25 |
| Viralty | 6806250572 | 2026-09-02 |

Pico Cards keeps its existing creation date and working product page. App links match the portfolio's product IDs. The additional VidGen3 entry describes June development (chat/video/image tools), not another initial release.

## Development milestones

Source repositories were inspected locally, read-only. Their private GitHub remotes are deliberately not public log links.

| Entry | Evidence |
| --- | --- |
| VidGen3 tools, June 28 | `vidgen-app` history, June 15–28: conversational generation, image-to-video and image generation |
| Valise, Aug 23 | `valise` README and `cb7c975`: trip bags, widget, passport map; July 13 packing/weather work. No public launch claimed. |
| Logar, Aug 31 | `logar` README, `b10a3b7` (cross-project overview), `7a6b4bc` (ingestion hardening), `b61ffce` (Feb event indexes) |
| Developer workflow, Sep 28 | `dotfiles` `fd72a92`: consolidated Pi/Herdr setup; `pi-orchestra` README identifies it as superseded. These are tools I use, not products I claim to have authored. |
| Postmixr, Oct 7 | `postmixr` `5529182` (video validation), `39ee0a8` (disconnection/scheduled-post safeguards); portfolio product details |
| TV dashboard, Oct 10 | `tv-dashboard` README and `e998faa`: private dashboard, Home Assistant, Android WebView; not linked to home infrastructure |
| Karardex, Oct 12 | `karardex` `ae165a5`, `683250b`: public decision search, filters, anonymous searches; portfolio product details for citations/documents/MCP |
| botbox, Oct 16 | `botbox` README, `c9c027d` (viewer), `89fbd1f` (snapshots/batch cloning). Ubuntu guests built with Nix; still development, not a released product. |
| bin, Oct 17 | `bin` README, `f35dad8` and Oct 16–17 authentication/deployment history |
| Website, Oct 17 | This repository: `fb74e4f` static export/API separation, `f554096` typography, existing projects and tech-stack pages. Build architecture, not a claim that deployment was performed. |

## Destinations

Successful HTTP checks with matching page titles: `karardex.com`, `postmixr.com`, `bin.ybaha.com`, `botguise.com`, `poshet.co/apps/pico`, and Atılım's `/en`, `/en/ise`, `/en/se` pages. Atılım previously pointed to METU. Stellarzen now uses the same Wayback capture as the portfolio instead of relying on the retired domain. Internal links target existing `/projects` and `/tech-stack` routes.

No private repository, dashboard endpoint, internal address, credential, or production user data was added to the logs. Re-check live destinations and release metadata when changing these entries; the automated tests do not make network requests.
