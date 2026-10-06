# NCIT · 星云协智

广州星云协智科技有限公司

Guangzhou Nebulis Collaborative Intelligence Technology Co., Ltd.

面向柔性制造的多机械臂协同智能。网站提供公司、技术、研发团队和合作路径的中英文介绍，以及可直接交互的四臂装配演示。

**Website:** https://nebulis-lab.com/NCIT/

## Features

- Chinese and English content, with synchronized controls in the live demo.
- Interactive four-arm assembly: orbit, zoom, run, pause, reset, camera views and full screen.
- Shared world model, collaborative multi-arm VLA, manufacturing challenges, research foundations, team, roadmap and partnership workflow.
- Responsive navigation, scroll transitions and pointer effects with reduced-motion support.
- Company and institutional identity drawn from the supplied business deck.
- Policy context and application opportunities woven into the main prose, with links to official publications.

## Development

Requires Node.js **22.12 or later**.

```bash
npm ci
npm run check
npm run typecheck
npm run build
npm run preview
```

The complete website is served at http://127.0.0.1:4176/. `npm run dev` starts the main Vite app; use the build preview for the integrated demo. `node scripts/serve.mjs 8080 .site` serves a built copy on another port.

Two Vite builds produce `.site/` and `.site/demo1/`. All paths are relative, including the robot assets, so GitHub Pages serves the project under `/NCIT/`. The workflow installs locked dependencies, validates sources and builds both applications before deploying.

## Structure

- `src/components/`: website sections and interactions.
- `src/i18n.tsx`, `src/copy.js`, `src/content.ts`: bilingual content and preferences.
- `public/assets/`: brand marks, laboratory photographs, team portraits, illustrations and fonts.
- `demo/src/`: embedded simulation.
- `scripts/fixedPhysicsControlPlugin.mjs`: fixed control clock for the simulation.
- `demo/physics-sources.json`: hashes for the original physics and controllers.
- `docs/asset-sources.md`: image provenance and content sources.
- `docs/policy-sources.md`: verified policy publications and their use on the site.
- `docs/research-content.md`: source mapping for the multi-arm VLA research summary.
- `THIRD_PARTY_NOTICES.md`: third-party notices.

The website and demo communicate within the same origin. Language changes preserve simulation state. Simulation activity pauses when the panel leaves the viewport or the document becomes hidden.
