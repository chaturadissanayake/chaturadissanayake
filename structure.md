# Site structure — chaturadissanayake.vercel.app

This reflects what is actually deployed today. The old version of this file
was out of date: it pointed at a `chaturadissanayake.github.io` host, a single
global `style.css`/`app.js`, and an `index.html`-per-project convention — none
of which match the live site. (That mismatch is what caused `sitemap.xml` to
point at `/projects/<slug>/index.html` URLs that don't exist.)

```
chaturadissanayake.vercel.app/
│
├── index.html                  Homepage
├── journal.html                "Off Duty" personal page — noindex, linked
│                                 from index.html's About section only
├── privacy.html                Privacy policy
├── 404.html                    Custom not-found page (noindex)
│
├── robots.txt
├── sitemap.xml
├── rss.xml                     Local copy; the live feed is served by
│                                 rss.app at the URL in <atom:link>
├── vercel.json                 Security + caching headers
│
├── assets/
│   ├── css/
│   │   ├── base.css            Resets, tokens (colour/spacing/type), globals
│   │   ├── layout.css          Header, footer, grid/section scaffolding
│   │   ├── components.css      Buttons, cards, modals, form controls, etc.
│   │   ├── sections.css        Page-specific section styling
│   │   ├── animations.css      Site loader, scroll-reveal, keyframes
│   │   └── off-duty.css        Theme override for journal.html only
│   │
│   ├── js/
│   │   ├── utilities.js        Shared helpers (icon init, motion prefs)
│   │   ├── main.js             Site loader, reveal-on-scroll, contact form,
│   │   │                         cookie banner, count-up stats, map tooltip
│   │   ├── navigation.js       Header/mobile menu, scroll spy, sidebar toggle,
│   │   │                         "next project" loader
│   │   ├── modals.js           Project detail modal + image lightbox
│   │   └── projects.js         Renders the project grid from data/projects.json
│   │
│   ├── icons/                  Self-hosted Lucide icon modules, imported via
│   │                             `<script type="module">` per page (only the
│   │                             icons that page actually uses)
│   │
│   ├── fonts/                  Self-hosted woff2 files (Fraunces, Inter,
│   │                             IBM Plex Mono) — do not also load these from
│   │                             Google Fonts on any page, it's redundant
│   │
│   ├── favicons/               favicon-16x16.png, favicon-32x32.png,
│   │                             apple-touch-icon.png, site.webmanifest
│   │                             (link hrefs must include this /favicons/
│   │                             segment — several project pages were
│   │                             missing it)
│   │
│   ├── documents/
│   │   ├── Services_Guide.pdf
│   │   └── Chatura_CurriculumVitae.pdf
│   │
│   ├── visualisations/         Images for the homepage "Visualisations" grid
│   ├── off-duty/               Images used only by journal.html
│   └── world-map.svg           Fetched at runtime for the clients map
│
├── data/
│   └── projects.json           Single source of truth for the project grid.
│                                 Each entry has: id, category, title,
│                                 challenge, role, outcome, link, status, tags,
│                                 thumbnail, date, sortDate, priority, archive.
│                                 `link` is either a same-site case-study path
│                                 (see below) or an external URL — projects.js
│                                 and navigation.js both fetch this file from
│                                 `/data/projects.json`.
│
└── projects/                   One folder per case study that lives on this
    │                            site. The page filename matches the project
    │                            slug — it is NOT index.html.
    │
    ├── ceylon-harvest/
    │   ├── ceylon-harvest.html
    │   └── assets/
    ├── influential/
    │   ├── influential.html
    │   └── assets/
    ├── midnight-sun/
    │   ├── midnight-sun.html
    │   └── assets/
    ├── mood-of-the-nation/
    │   ├── mood-of-the-nation.html
    │   └── assets/
    ├── practical-solutions-for-inclusive-growth/
    │   ├── practical-solutions-for-inclusive-growth.html
    │   └── assets/
    └── road-remains/
        ├── road-remains.html
        └── assets/
```

## Projects that do NOT have a page in `/projects/`

These exist only as entries in `data/projects.json`, with `link` pointing to
an external URL (their own domain, GitHub Pages, UN pages, or a Drive
folder). They should **not** appear in `sitemap.xml` — this is not their
canonical domain:

- `ditwah-cyclone` → cycloneditwah.vercel.app
- `drug-crisis` → chaturadissanayake.github.io/theshadowwar
- `ycli-field-assessment` → chaturadissanayake.github.io/projectycli
- `why-sri-lanka-pays-more` → chaturadissanayake.github.io/whysrilankapaysmore (also `archive: true`)
- `un-annual-results`, `un-sdg-fund` → srilanka.un.org
- `embracy-platform` → Google Drive folder

## Conventions worth keeping consistent when adding a new case study page

1. Head: preload `inter-regular.woff2` and `fraunces-variable.woff2` locally.
   Do not add a Google Fonts `<link>` — Fraunces is already self-hosted.
2. Favicons: `/assets/favicons/apple-touch-icon.png`, `favicon-32x32.png`,
   `favicon-16x16.png`, `site.webmanifest`.
3. Icons: `<script type="module">` importing only the icons the page uses
   from `/assets/icons/`, mirroring `index.html` — never the unpkg/CDN build.
4. `<body class="loading">` with the `#site-loader` markup, so the page
   doesn't reveal itself until images/assets have actually finished loading.
5. `<main id="main-content" tabindex="-1" style="outline: none;">` so the
   skip-link can move focus there.
6. Give scroll-triggered content the `section-fade-in` class (driven by the
   `IntersectionObserver` in `main.js`), and add `.section-fade-in` to the
   page's `<noscript>` fallback alongside `.reveal-up` so it isn't invisible
   with JS disabled.
7. Footer legal links: `/assets/documents/Services_Guide.pdf` and
   `/assets/documents/Chatura_CurriculumVitae.pdf` — same filenames as the
   homepage footer, not `/assets/Chatura_Dissanayake_CV.pdf`.
8. Add the new page to `sitemap.xml` (own-domain pages only) and to
   `data/projects.json`.