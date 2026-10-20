# HeroUI v3 Upgrade — Design

Date: 2026-10-18
Workspace: `apps/web`

## Intent

The owner wants to modernize the UI: move from today's plain blurred cards
toward something closer to Apple's "liquid glass", and add color to the edit
page's forms, which are currently flat dark gray with color only on buttons,
switches, and tab highlights.

HeroUI has shipped v3, a ground-up rewrite. Rather than redesign on top of v2
and then redo it, the owner chose to **upgrade to HeroUI v3 first**, as its own
project, and do the visual redesign afterward on the new foundation.

This document covers only the upgrade. The glass-and-color redesign is a
separate, later project with its own design document.

## Goals

- `apps/web` runs on `@heroui/react` v3 (current latest: 3.2.6).
- Every HeroUI usage in `apps/web` is ported to the v3 API.
- The app keeps all current behavior on every page.
- The `dark-purple` theme is ported to v3's CSS-variable theming.

## Non-goals

- **Matching today's look.** The owner explicitly accepts v3's default
  component styling. Spacing, radii, input styles, card styles, and so on may
  change to whatever v3 does by default. Do not write overrides to recreate v2's
  appearance.
- **The redesign.** No glass effects, no new form colors, no new layouts. That
  comes next.
- Upgrading other dependencies beyond what v3 requires.
- Changing anything outside `apps/web`, except the root lockfile and
  `CHANGELOG.md`.

## Anti-goals (failure even if it technically works)

- Any lost behavior: saving/updating/creating wheels, form reset, the wheel
  preview, spinning, the saved-wheels drawer, the removed-winners list, the
  mobile navbar menu, links between pages.
- Deleting tests to make the suite pass. Tests that depended on v2 markup are
  updated, not removed.
- Mixing in redesign work, which would make the upgrade hard to review.

## Current state

- `@heroui/react` 2.8.9, `@heroui/system` 2.4.27, `@heroui/theme` 2.4.26.
- Theme: `apps/web/src/hero.ts` defines `dark-purple` (extends `dark`) through
  the `heroui()` Tailwind plugin, loaded only from `apps/web/src/globals.css`
  via `@plugin './hero.ts'`, plus an `@source` line pointing into
  `@heroui/theme/dist`. The theme class `dark-purple` is applied on `<html>` in
  `apps/web/index.html`. Primary is a magenta-purple scale (DEFAULT
  `#c031e2`), focus `#F182F6`, background `rgb(10 10 10)`, foreground white.
  `globals.css` also sets a fixed page-background gradient
  (`rgb(10 10 10)` → `rgb(25 25 60)`).
- 13 files use HeroUI: `providers.tsx`, `components/action-accordion.tsx`,
  `color-picker.tsx`, `navbar.tsx`, `removed-winners-list.tsx`,
  `saved-wheels-list.tsx`, `wheel-preview.tsx`, `pages/about-page.tsx`,
  `config-page.tsx`, `home-page.tsx`, `legacy-page.tsx`, `wheel-page.tsx`,
  plus `hero.ts`.
- Components used: Accordion/AccordionItem, Button, ButtonGroup,
  Card/CardHeader/CardBody/CardFooter (two use `isBlurred`), Divider, Drawer
  (+Header/Body/Content), Input, Link, Navbar (+Brand/Content/Item/Menu/
  MenuItem/MenuToggle), Select/SelectItem, Skeleton, Switch, Textarea,
  HeroUIProvider, and the `useDisclosure` hook.
- `framer-motion` 12.34.3 is a dependency but nothing in `apps/web` imports it
  directly; it is there for HeroUI v2.

## Decisions made by the owner

1. **Upgrade first, redesign later**, as two separate projects.
2. **Accept v3's default look.** No effort to preserve v2 styling.
3. **Rebuild the navbar** as a custom component. v3 removed `Navbar` with no
   replacement. Build it from plain markup plus v3 `Button`/`Link`, keeping
   today's layout and today's mobile menu behavior (toggle that opens the
   menu on small screens). File stays `components/navbar.tsx`.
4. **Keep `framer-motion`** as a dependency even though v3 no longer needs it.
   The project rules name it as the animation library and the redesign will
   likely use it.

## Constraints

- Follow repo conventions in `CLAUDE.md` and `apps/web/CLAUDE.md`: kebab-case
  filenames, tests in `__tests__/`, strict TypeScript, no `any`.
- Install from repo root, pinned exact:
  `npm install --save-exact --workspace apps/web <package>`.
- v3 peer dependencies must be installed explicitly and pinned: `react-aria`,
  `react-aria-components`, `@react-aria/ssr`, `@react-aria/utils`,
  `@internationalized/date` (versions satisfying v3.2.6's peer ranges).
- Remove `@heroui/system` and `@heroui/theme` once nothing uses them.
- `npm run sherif`, `npm run check-types`, lint, and `npm run test` must pass.
- Work on a feature branch; record the change in `CHANGELOG.md`.

## Theme port

- Replace the `heroui()` plugin and `hero.ts` with v3's CSS approach:
  `@import "@heroui/styles";` in `globals.css` and a custom theme defined as
  CSS variables under a selector (v3 uses `[data-theme="<name>"]`, also
  supporting classes).
- Keep the theme name `dark-purple` and keep it dark-based. Update
  `index.html` to however v3 expects the theme applied (attribute and/or
  class), and keep the `dark` variant working for anything that relies on it.
- Map the existing palette onto v3 tokens: accent from the primary DEFAULT
  `#c031e2`, accent foreground white, focus `#F182F6`, background
  `rgb(10 10 10)`, foreground white. v3 doesn't have v2's 50–900 primary
  scale; use the single accent token and let v3 derive the rest.
- The `:root` block in `globals.css` defines `--background` (a gradient) and
  `--foreground`, which collide with v3 token names. Rename the page-level
  variables (e.g. `--page-background`, `--page-foreground`) so v3's tokens
  stay intact. _(Planner's call.)_
- Keep the page-background gradient and the existing `globals.css` utilities
  (`animate-float`, the wheel focus ring, the Tailwind v3 border-color compat
  block).
- If `hero.ts` ends up empty, delete it and remove the `@plugin` and
  `@source` lines. Update the "Gotchas" entries in `apps/web/CLAUDE.md` that
  mention `hero.ts` and the theme contract so they stay accurate.

## Done means

1. `@heroui/react` is on v3; v2-only packages are removed; peer deps are
   installed and pinned.
2. `dark-purple` works through v3 theming with the same purple palette.
3. Every page loads and works: home, wheel, config (edit), about, legacy,
   not-found. Specifically verified: navbar on desktop and the mobile menu,
   saved-wheels drawer (open, load, delete), the action accordion, removed
   winners list, wheel spin, edit form save/update/create-new/reset, the
   wheel preview expand/collapse, select dropdowns, switches, the color picker.
4. Type check, lint, sherif, and the full test suite pass. Tests are updated
   where v2 markup changed.
5. The app is run and screenshots of each page are taken at desktop and phone
   widths, handed to the owner as the "v3 default look" baseline for the
   redesign. Screenshots are not committed; they go in a scratch location
   outside the repo. _(Planner's call.)_
6. `CHANGELOG.md` has an entry under the Unreleased 3.0.0 section.

## Left to the builder

- The order components are migrated in, and whether to use v3's incremental
  migration path or switch in one go.
- The exact v3 equivalent for each v2 component and prop (`Divider` →
  `Separator`, `useDisclosure` → `useOverlayState`, Input/Textarea →
  `TextField`/`TextArea`, compound sub-components, `color`/`variant` mappings
  on Button). Use the official migration guide:
  https://heroui.com/docs/react/migration (machine-readable:
  https://heroui.com/react/llms-full.txt).
- Whether `HeroUIProvider` is still needed in `providers.tsx` (v3 says
  styling needs no provider). Today `HeroUIProvider navigate={navigate}`
  gives HeroUI links client-side routing; keep that behavior, e.g. via React
  Aria's `RouterProvider`.
- Mapping leftover v2 color props and utility classes (`color="secondary"`,
  `bg-primary`, `text-primary`, `default-*` shades) to v3 equivalents.
- What happens to the two `isBlurred` cards if v3 has no equivalent: drop the
  prop and accept v3's default card. Glass comes back in the redesign.
- How react-hook-form integration is wired for v3 fields, provided form
  behavior and validation stay identical.
- Exact markup and styling of the rebuilt navbar, within "same layout, same
  mobile menu behavior, v3 default look".
