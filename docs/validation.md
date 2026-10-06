# NCIT website validation

Validated on 2026-10-07.

## Website

- Chinese and English checked at 1440, 768, 390 and 320 CSS pixels without horizontal page overflow.
- Language selection persists through reload. URL language selection, mobile navigation and Escape dismissal work.
- Fullscreen entry works through an explicit button click.
- Main-page automated WCAG A/AA checks report zero violations in both languages. These layout checks isolate the simulation iframe; the actual runtime is verified separately below.
- No missing main-page assets or script errors during the functional pass.
- No video element or reference to the prohibited cover background appears in the active website. The cover image and old recording are excluded from the publication bundle.
- Decorative illustrations, font files and gradient borders were checked in the built output. Scroll and pointer effects are enabled; reduced-motion preferences disable decorative animation.

## Identity, content and motion refinement

- The full English company name matches slide 1 of the business deck and is displayed in both language modes.
- The HKUST (Guangzhou) mark is displayed beside the laboratory identity using the original PPT asset, without changing its colors or proportions.
- Manufacturing challenges and the four-step partnership workflow are present in both languages.
- Both languages pass desktop and mobile layout checks from 320 to 1440 CSS pixels, with no horizontal overflow or automated WCAG A/AA violations.
- Sticky navigation, mobile link dismissal, active section indication and language persistence work.
- Pointer highlights update without React state updates. Diagram animation pauses outside the viewport; reduced-motion preferences suppress decorative motion.
- The obsolete chooser, previews and design-selection documents are removed from the source and publication bundle. Necessary third-party notices remain in one notice file.

## Policy links and icon refinement

- Four official policy/information sources are integrated into the existing solutions, manufacturing and partnership introductions in both languages; publication dates and supported claims are recorded in `policy-sources.md`.
- Each source link opens the official publication in a new tab, uses the surrounding paragraph’s text size and retains keyboard focus styling.
- Company names, source-link destinations, mobile layout and bilingual rendering were checked.
- Text-glyph arrows were replaced with consistent SVG icons. Fullscreen entry/exit and the matching icon state pass browser interaction checks.
- Main-page WCAG A/AA checks still report zero violations in both languages. The demo build remains byte-identical to the previously validated runtime.

## Readability and multi-arm VLA

- Category labels, roadmap labels and execution feedback text use at least 16px in desktop and mobile checks. Adjacent descriptions, team roles and demonstration controls also use larger supporting type.
- Both language versions introduce multi-arm VLA in the hero, core technology, architecture diagram, scenario copy and a research summary. The three communication paths, simulation scale and relative traffic result are mapped to the supplied technical attachment in `research-content.md`.
- Chinese and English layouts pass at 320–1440 CSS pixels, including the longer English research descriptions. Policy links, language persistence, SVG controls, fullscreen and reduced-motion behavior remain verified.

## Demo1 integration

- The actual local build loads four physical robot instances and 73 bodies.
- The complete four-stage assembly sequence reached `complete`, including observed tool striking, with zero physics warnings and no script or asset errors. Reset returned the sequence to idle. This automated run used the runtime’s supported 3× playback speed and moved the inspection camera away during the physics audit; the normal scene view was restored for the final capture.
- Start, pause, resume and reset operate on the actual simulation.
- Switching the website language updates the running demo controls without reloading the simulation.
- Robot, workcell and camera files are served from the same website.
- The four assembly controllers, scene layout, planning and sequence logic match the provided source hashes.
- The original fixed control clock is applied to the pinned mujoco-react runtime during the demo build.
- Graphics/runtime errors surface as a reloadable demo error instead of a permanently blank frame.

## Repeatable checks

```bash
npm run check
npm run typecheck
npm run build
git diff --check
```

The build produces the main website and `demo1/` together. The GitHub Actions workflow runs dependency installation, source checks, type checks and both builds before publication.
