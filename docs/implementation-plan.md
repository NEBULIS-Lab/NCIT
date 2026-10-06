# NCIT website implementation

## Direction
A bilingual public-facing company/project website for 星云协智 (NCIT), grounded in the supplied 12-slide business plan. Audience: manufacturing teams, robot manufacturers, integrators, and research/commercial partners. Visual direction: graphite, white and electric violet; large editorial typography; actual lab photography; a clearly labelled simulation demonstration.

## Delivery
- Responsive static HTML/CSS/JavaScript, served at either a domain root or `/NCIT/` without a build tool.
- Chinese default, English switch, persistent language choice and shareable `?lang=en` URLs.
- Project introduction, manufacturing challenges, shared-world-model capabilities, first assembly scenario, original demo video, research foundation, roadmap, team and cooperation.
- Accessible keyboard navigation, working tabs, mobile menu, native video controls, reduced-motion support and usable no-JavaScript Chinese content.
- Optimize supplied images, retain the embedded video, and document image identities and slide sources.
- Publish source to the existing repository's main branch; provide GitHub Pages packaging and deployment workflow.

## Content boundaries
Use the project brand publicly; the company is proposed in the source, so retain startup/project status. Distinguish targets from completed results. Describe scene illustrations as concepts, simulation as simulation, and lab photographs as lab photographs. Omit internal equity allocation, financial forecasts and the source deck from website distribution. External contact information must come from the lab's public website.

## Verification
Run static asset/link and JavaScript checks; inspect desktop and mobile screenshots in both languages; exercise language persistence, shareable language URLs, capability tabs, lab/simulation tabs, navigation, video and keyboard interactions; check accessibility and overflow. Check the final Git diff and verify the pushed commit against the remote.
