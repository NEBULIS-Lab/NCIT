# NCIT · 星云协智

A bilingual company/project website adapted from **Cruip Open**, with the original user-provided **Demo1** running directly in the browser.

**Live:** https://nebulis-lab.com/NCIT/

## What is included

- Open's dark layout, animated gradient headings, original decorative illustrations, scroll reveals and pointer spotlight cards.
- Chinese/English navigation and content, including the embedded demo controls.
- Self-hosted Demo1: four physical robot instances, the original assembly sequence, orbit/zoom, run, pause, reset, camera views and full screen. The page loads the actual simulation; no video player is used.
- Product, technology, laboratory images, team and development roadmap adapted from the supplied business deck.
- The business deck's cover background photograph is excluded. The old website and video are no longer published.

## Development

Requires Node.js **22.12 or later**.

```bash
npm ci
npm run check
npm run build
npm run preview
```

The complete website is served at http://127.0.0.1:4176/. `npm run dev` starts the main Vite app; use the build preview for the integrated demo. `node scripts/serve.mjs 8080 .site` serves a built copy on another port.

Two Vite builds produce `.site/` and `.site/demo1/`. All paths are relative, including the demo's robot assets, so GitHub Pages can serve the project under `/NCIT/`. The Pages workflow installs locked dependencies, validates sources and builds both applications before deploying.

## Source and design

- `src/components/`: Open template components adapted for NCIT.
- `src/i18n.tsx`, `src/copy.js`: bilingual copy and persistence.
- `public/assets/`: selected images from the business deck; no cover image.
- `public/open/`: original Open decorative SVGs and fonts.
- `demo/src/`: supplied Demo1 runtime, with an NCIT embed presentation.
- `scripts/fixedPhysicsControlPlugin.mjs`: original reproducible fixed-control-clock adaptation; required for Demo1 physics.
- `demo/physics-sources.json`: hashes for the unmodified source physics and controllers.
- `docs/open-template/`: exact upstream template revision and terms.
- `THIRD_PARTY_NOTICES.md`: template, dependency and robot-asset attribution.
- `templates.html`: the previous template chooser, retained as a secondary page.

The main site and demo communicate only within the same origin. Language updates preserve simulation state. The simulation pauses when its panel leaves the viewport or the document becomes hidden. Camera thumbnails are collapsed initially to keep the workcell visible.

Template source: https://github.com/cruip/open-react-template

Demo source: https://github.com/Shuaijun-LIU/web-robot-example-0
