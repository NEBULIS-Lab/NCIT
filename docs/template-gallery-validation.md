# Template chooser validation

Checked on 2026-10-07 for the replacement template-selection homepage.

- Six real template entries with six original screenshots and six playable H.264 motion recordings.
- All/free/paid/dark/light filters return 6/4/2/4/2 entries respectively.
- Selection survives reload; clearing removes it. Choosing from the preview dialog works.
- Clipboard export contains the selected template and original URL. Denied clipboard access opens a manual-copy dialog.
- Chinese and English switches persist; tested at 320, 390, 768 and 1440 pixel widths without horizontal page overflow.
- All six preview videos decode and play. Screenshot tabs, keyboard arrows, Escape, pause and source cleanup work.
- Reduced-motion preference suppresses automatic preview playback and interface animation.
- Automated WCAG A/AA checks report zero violations for both language variants and the preview dialog.
- Screenshots of the desktop and mobile layouts were visually reviewed.
- No browser script errors or failed local asset requests during the functional pass.
- The previous NCIT site remains available at `previous.html`.
- `node scripts/check.mjs`, `node scripts/build.mjs` and `git diff --check` pass.

This validates the chooser. Final adaptation of NCIT content and motion follows the user’s template selection.
