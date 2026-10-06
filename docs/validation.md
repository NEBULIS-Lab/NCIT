# NCIT Open redesign validation

Validated on 2026-10-07.

## Website

- Built from the selected Cruip Open source; upstream revision and original terms are retained.
- Chinese and English checked at 1440, 768, 390 and 320 CSS pixels without horizontal page overflow.
- Language selection persists through reload. URL language selection, mobile navigation and Escape dismissal work.
- Fullscreen entry works through an explicit button click.
- Main-page automated WCAG A/AA checks report zero violations in both languages. These layout checks isolate the simulation iframe; the actual runtime is verified separately below.
- No missing main-page assets or script errors during the functional pass.
- No video element or reference to the prohibited cover background appears in the active website. The cover image and old recording are excluded from the publication bundle.
- Original Open illustrations, font files and gradient borders were checked in the built output. Scroll and pointer effects retain the template's behavior; reduced-motion preferences disable decorative animation.

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
