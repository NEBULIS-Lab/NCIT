# Website validation

Validated on 2026-10-06 with a local Chromium browser.

- **Content:** 159 translated interface/content keys; language-aware descriptions, navigation and image alternative text.
- **Layouts:** Chinese and English at 1440, 768, 390 and 320 CSS pixels. No horizontal overflow, failed images, console exceptions or HTTP errors in the tested pages.
- **Interaction:** Language toggle, persisted preference, URL language override, technology tabs, scene tabs, keyboard arrows/Home/End, mobile navigation, Escape dismissal and resize cleanup.
- **Accessibility:** Automated axe-core checks against WCAG 2 A/AA and 2.1 A/AA tags reported zero violations in both languages at desktop and mobile widths. This is an automated check, not a certification of complete accessibility.
- **Media:** Original H.264 video, 1280 × 960, duration 410.2 seconds; playback, pause and seeking to 200 seconds verified. Byte-range requests to the local preview server returned HTTP 206 with the expected content range.
- **Fallback:** Chinese page content remains available with JavaScript disabled.
- **Packaging:** JavaScript syntax, local assets, internal anchors and the static distribution package checked. Source slide deck and private working files are excluded.

## Screenshots

- [Chinese desktop homepage](preview-zh.webp)
- [English desktop homepage](preview-en.webp)

## Publication status

Source delivery and public website hosting are separate. At initial delivery, GitHub Pages was not configured on the repository. The included workflow validates the source and prepares a Pages artifact, then deploys automatically when Pages has been enabled. Follow the README’s first-publication steps to activate hosting.
