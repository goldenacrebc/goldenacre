# Copilot instructions for Goldenacre Bowling Club website

## Project context

- This repository is a static multi-page website for Goldenacre Bowling Club, not a framework-based app.
- The site is primarily authored in plain HTML, CSS, and JavaScript and is served directly from the repository root.
- The primary landing page is `index.html`; other pages such as `about.html`, `gents.html`, `social.html`, and `weekly-schedule.html` share the same layout and navigation conventions.

## Build, test, and lint commands

- No package manifests (`package.json`, `pyproject.toml`, `go.mod`, etc.) or project-defined build/test/lint scripts were found in this repository.
- There is no automated test or lint command configured for this project.
- For local verification, serve the repository root as a static site, for example:

  ```bash
  cd /path/to/goldenacre
  python3 -m http.server 8000
  ```

  Then open `http://localhost:8000` in a browser.

- If a change is visual or content-only, validate it by checking the relevant page in a browser and confirming that navigation, modal behavior, and styling still render correctly.

## High-level architecture

- `style.css` is the shared stylesheet entry point and imports section-specific CSS from `styles/` in a fixed cascade order. See the project README for the intended ordering and cascade rules.
- Core styling is split across:
  - `styles/foundation.css` for resets, colours, shared layout, and header styles
  - `styles/club-sections.css` for page sections and news cards
  - `styles/membership-footer.css` for membership and footer styling
  - `styles/timelines.css` for timeline layouts
  - `styles/modals.css` for modal presentation
  - `styles/competition-draws.css` for draw tabs and competition UI
- Shared page logic is concentrated in root-level scripts such as `script.js` and `draws.js`, with modal behavior in `modals/modal-controller.js`.
- Individual modal content is defined in the `modals/` folder (for example `modal-membership.js`, `modal-facilities.js`, and `modal-social-events.js`).
- Competition draw data lives in `fixtures/*.js`, and the draw UI reads from `window.drawSheets` populated by those fixtures.
- Static media assets (photos, logo, etc.) live under `photos/` and are referenced by relative paths from each HTML page.
- `members-protected.html` and `test.html` are not generic templates; they are special pages used for protected/member-facing and test/demo content and should be treated as part of the site’s domain-specific behavior.

## Key conventions

- Keep `style.css` as the canonical stylesheet entry point. When updating styling, prefer the relevant file in `styles/` instead of adding ad hoc CSS directly in an HTML file.
- Do not reorder the `@import` statements in `style.css` unless the change is intentionally meant to alter cascade precedence.
- Preserve the existing shared site structure: header/nav, logo badge, club hero area, section layout, and membership/contact blocks.
- Use relative navigation links between pages (`index.html`, `about.html`, `contact.html`, etc.) rather than introducing a router or absolute URLs.
- Match the current JS patterns: page scripts defer execution until the DOM is ready, and modal logic is driven through `openNewsModal()` / `closeNewsModal()` rather than a framework-specific abstraction.
- Treat this as a content-focused static site: new content or club updates typically belong in existing HTML templates or the data files under `fixtures/` and `modals/`, not in a new application framework or build step.
- When adding CSS, keep the file split understandable by concern (foundation/global vs page section vs modal vs draw-related styling).

## Repository-specific guidance

- README.md is the best source for project intent and the styling import order.
- Since there is no CI or lint pipeline in the repo, rely on browser-based smoke tests and consistent adherence to the current static-site structure.
- Prefer small, focused edits that preserve the existing HTML/CSS layering and naming patterns used across the site.
