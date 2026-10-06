# NCIT · 星云协智

A bilingual company and startup-project website for **Nebulis Collaborative Intelligence Technology**, based on the supplied business presentation. Chinese is the default; the header button switches the entire website to English.

![NCIT Chinese homepage](docs/preview-zh.webp)

[English preview](docs/preview-en.webp) · [Validation notes](docs/validation.md)

## Preview

This is a static website with no application dependencies or build requirement. The included local server supports HTTP byte ranges for video seeking.

```bash
node scripts/serve.mjs 8080
```

Open `http://localhost:8080/`. English can be opened directly at `http://localhost:8080/?lang=en`; the language preference is also saved on the visitor’s device. Files can be served at the domain root or under `/NCIT/` without changing asset paths.

## Included

- Responsive desktop, tablet and mobile layouts
- Full Chinese / English copy, metadata, image descriptions and accessible control labels
- Keyboard-operable technology tabs and physical-lab / simulation tabs
- Original embedded simulation video with native playback controls and download
- Project positioning, applications, research, planned milestones, team and cooperation
- Supplied imagery optimized to WebP, reduced-motion support and a working Chinese page without JavaScript

## Edit

| File | Purpose |
| --- | --- |
| `index.html` | Semantic page structure and default Chinese text |
| `content.js` | Chinese/English copy, technology details and scene definitions |
| `styles.css` | Layout, theme and responsive styles |
| `app.js` | Language switching, menu and accessible tabs |
| `assets/` | Project images and original video |
| `docs/asset-sources.md` | Slide-by-slide media identities and content provenance |

When editing visible text, update the default Chinese in `index.html` and the corresponding language keys in `content.js`.

## Validate and package

Node.js 18 or newer is sufficient for these dependency-free commands:

```bash
node scripts/check.mjs
node scripts/build.mjs
```

The second command copies only website files into `.site/`; source documents and test artifacts are excluded from the published package.

## GitHub Pages

The included workflow checks every push and pull request. When Pages is configured, pushes to `main` also deploy the website.

For first publication:

1. Open repository **Settings → Pages**.
2. Select **GitHub Actions** as the build source.
3. Run **Actions → Validate and publish website → Run workflow**.

The deployment job reports the final URL. Organization-level custom-domain settings can determine whether the project appears under a custom domain or `https://nebulis-lab.github.io/NCIT/`. This repository does not change the parent laboratory website or its domain settings.

See [GitHub’s Pages configuration guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Content

Planned development targets are labelled as targets. The source business-plan deck, internal equity allocation and financial forecasts are not included. Media provenance and contact attribution are documented in `docs/asset-sources.md`.
