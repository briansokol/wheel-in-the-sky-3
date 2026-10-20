# Liquid Glass Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `apps/web` so that the edit form, navbar, mobile menu, Actions drawer, preview card, winner card, select dropdowns and tooltips are frosted glass with light rims, and the edit page shows glows in the wheel's colors behind the form.

**Architecture:**

- A pure function in `@repo/shared` turns a `WheelColorConfig` into up to three glow colors.
- A `WheelGlows` component renders them, fixed behind the edit page, and animates them with Framer Motion.
- All glass styling is defined once in `apps/web/src/globals.css`: Tailwind `@utility` classes for the surface and the rim, form-scoped field rules, and global overrides for HeroUI's popover and tooltip classes. Components only apply class names.

**Tech Stack:** React 19, HeroUI 3.2.6, Tailwind 4.2.1, Framer Motion 12.34.3, `@ctrl/tinycolor` 4.2.0 (already used in `@repo/shared`), Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-10-19-liquid-glass-redesign-design.md` (read it, including "Calls made by Claude").

**Visual reference:** the approved mockups in `.superpowers/brainstorm/396222-1792464791/content/`: `glass-direction.html` option B, `active-field.html` option 2 (but the label does **not** change color), and `surfaces.html`. Baseline screenshots are in `.superpowers/screenshots/heroui-v3/`.

## Global Constraints

- **Visual only.** No changes to layout order, wording or behavior. Existing tests must keep passing without edits, except for tests that assert styling this plan changes.
- **No CSS transitions.** Never write `transition` or `@keyframes` for new effects; animate with Framer Motion (project rule).
- **One blur per surface.** One `backdrop-filter` per glass surface. Never put a `backdrop-filter` element inside another one; overlapping siblings are fine.
- **Page variables.** `--background` and `--foreground` belong to HeroUI; page colors stay in `--page-*`.
- **Accent colors.** Accent `#c031e2`, focus `#F182F6`. The active field fills with a purple tint, gets a pink-purple rim and an outward purple glow, and its **label color is unchanged**.
- **Reduced transparency.** Under `prefers-reduced-transparency: reduce`, glass becomes a solid dark surface that keeps its rim and border.
- **Reduced motion.** Under `prefers-reduced-motion`, glow color changes are instant.
- **Contrast.** Text on glass must reach WCAG AA (4.5:1). Worst-case custom colors: `#ffff00` and `#ffffff`.
- **Conventions.**
  - Kebab-case filenames; tests in `__tests__/`; strict TypeScript, no `any`.
  - `@repo/shared` imports use `.js` extensions (`moduleResolution: nodenext`).
  - Install nothing new.
- **Commits.** Commits go through the pre-commit hook. End each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Leave `.serena/project.yml` unstaged.
- **Browser checks.** Headless Chromium via the throwaway tooling in `.superpowers/tools/`, which is git-ignored and documented in that folder. The Playwright MCP can't find Chrome on this machine.
  - Save screenshots to `.superpowers/screenshots/liquid-glass/`, which is git-ignored via its own `.gitignore` containing `*`; create the folder and that file if they're missing.
  - When you start dev servers, stop only the PIDs you started.

## Review Focus

These are the five failure modes most likely to bite a user that no feature test would otherwise cover. Each one is pinned by a test or check in the task named.

1. **A custom scheme with no colors, or a half-typed hex** (`#ff`, `''`) while the user edits a color. The glows must not throw or go blank; invalid colors are skipped and the default palette fills in. Pinned in Task 1.
2. **Typing names or toggling "randomize color"** must not move the glows. Pinned in Task 1 (pure) and Task 2 (page).
3. **Very light wheel colors** (`#ffffff`, `#ffff00`) washing out text on the sheet. Pinned by the Task 5 contrast measurement.
4. **Reduced transparency or reduced motion** set at the OS level. Pinned in Task 5 with media emulation, plus the Task 2 reduced-motion test.
5. **A select dropdown or tooltip opening over glass.** It must be readable and must not nest blur. Pinned in Task 4 with a browser check: the popover is portaled to `body`, so it is not a descendant of a blurred element.

---

### Task 1: Glow color derivation (`@repo/shared`)

**Files:**

- Create: `packages/shared/src/utils/glow-colors.ts`
- Test: `packages/shared/src/utils/__tests__/glow-colors.test.ts`

**Interfaces:**

- Produces:
  - `export const DEFAULT_GLOW_COLORS: readonly string[] = ['#c031e2', '#14b8a6', '#f59e0b']`
  - `export function getGlowColors(config: WheelColorConfig): string[]`, which returns 1–3 lowercase `#rrggbb` strings and never an empty array.
  - Web imports it as `@repo/shared/utils/glow-colors`. `utils` is already in the exports map.

Rules the function implements (they decide what the tests assert):

- **The palette depends only on the scheme type, base color and custom colors.**
  - It never reads `randomizeColor`.
  - The `WheelColorConfig` has no names, so names can't affect it.
- **Palette per scheme:**
  - Monochromatic: `new TinyColor(base).monochromatic(5)`.
  - Analogous: `new TinyColor(base).analogous(6).slice(1)`.
  - Triad: `.triad()`.
  - Tetrad: `.tetrad()`.
  - Custom: `colors`, keeping only entries where `new TinyColor(c).isValid`.
  - Random: `DEFAULT_GLOW_COLORS`.
- **Fallbacks:**
  - An invalid or missing base color for a base-color scheme gives `DEFAULT_GLOW_COLORS`.
  - A Custom scheme with no valid colors gives `DEFAULT_GLOW_COLORS`.
- **Choosing up to three:** with `n` palette entries and `k = min(3, n)`, take the indices `Math.round(i * (n - 1) / (k - 1))` for `i` in `0..k-1`. When `k = 1`, take index 0. Output is `toHexString()`.

- [ ] **Step 1: Write the failing tests** in `glow-colors.test.ts`:
  - `Random` → `DEFAULT_GLOW_COLORS`.
  - `Triad` with base `#c031e2` → length 3, and equal to `new TinyColor('#c031e2').triad().map(c => c.toHexString())`.
  - `Tetrad` → length 3: palette indices 0, 2 and 3 of the 4 (from `round(i*3/2)` = 0, 2, 3).
  - `Custom` with `['#ff0000']` → `['#ff0000']`.
  - `Custom` with `['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffffff']` → `['#ff0000', '#0000ff', '#ffffff']`.
  - `Custom` with `[]`, and with `['#ff', '']` → `DEFAULT_GLOW_COLORS` (Review Focus 1).
  - `Monochromatic` with an invalid base `'nope'` → `DEFAULT_GLOW_COLORS`.
  - `Monochromatic` with `randomizeColor: true` equals the same config with `randomizeColor: false` (Review Focus 2).
  - Every result matches `/^#[0-9a-f]{6}$/`.

  Build configs with `buildWheelColorConfig` from `packages/shared/src/utils/configs.ts`, so the tests use the real config shapes.

- [ ] **Step 2: Run** `npx vitest run packages/shared/src/utils/__tests__/glow-colors.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `getGlowColors` and `DEFAULT_GLOW_COLORS` per the rules above.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then run `npm run build --workspace packages/shared`. Expected: success.
- [ ] **Step 5: Commit** `feat(shared): derive glow colors from a wheel color config`.

---

### Task 2: Glass foundation, wheel glows, and the edit page

**Files:**

- Modify: `apps/web/src/globals.css`, adding the glass utilities and form field rules.
- Create: `apps/web/src/components/wheel-glows.tsx`
- Modify: `apps/web/src/pages/config-page.tsx`
- Test: `apps/web/src/components/__tests__/wheel-glows.test.tsx` (new), `apps/web/src/pages/__tests__/config-page.test.tsx` (add cases)

**Interfaces:**

- Consumes: `getGlowColors(config: WheelColorConfig): string[]` (Task 1), and `buildWheelColorConfig(type, baseColor, colors, randomizeColor)` from `@repo/shared/utils/configs`.
- Produces (later tasks only apply these class names):
  - **CSS custom properties on `:root`:** `--glass-tint`, `--glass-blur`, `--glass-border`, `--glass-rim`, `--glass-shadow`, `--glass-well-bg`, `--glass-well-border`. Every utility below reads from these, so Task 4 can reuse the values for HeroUI's popover and tooltip classes and Task 5 can tune contrast in one place.
  - **CSS `@utility glass-surface`:**
    - translucent light tint, about `rgb(255 255 255 / 7%)`
    - `backdrop-filter: blur(24px) saturate(160%)`
    - 1px border at about 14% white
    - `box-shadow: inset 0 1px 0` at about 25% white, plus a soft drop shadow
    - no border-radius, so each surface sets its own
  - **CSS `@utility glass-rim`:** the top highlight alone (`inset 0 1px 0` white highlight), for buttons and switches.
  - **CSS `@utility glass-well`:** the dark inset, about `rgb(0 0 0 / 25%)` with a border at about 8% white, used for fields and drawer sections.
  - **Reduced transparency:** under `@media (prefers-reduced-transparency: reduce)`, `glass-surface` becomes an opaque dark surface with the same border and rim, and no `backdrop-filter`.
  - **`.glass-form` scope:** inside it, HeroUI field controls get the well look at rest.
    - Controls: text input, textarea, select trigger, and the color picker's hex input.
    - On focus or focus-within they get the active look: a `#c031e2` tint at about 14%, a `#F182F6` border, an outward glow of about `0 0 26px` `#c031e2` at about 55%, and a faint inner top highlight.
    - Labels are not restyled.
    - Read the BEM class names (e.g. `.input`, `.textarea`, `.select__trigger`) from `node_modules/@heroui/styles`; don't guess them.
  - **`WheelGlows`:** `export function WheelGlows({ colors }: { colors: string[] }): JSX.Element`.
    - Renders a `fixed inset-0 -z-10 pointer-events-none overflow-hidden` layer with `aria-hidden="true"` and `data-testid="wheel-glows"`.
    - Contains one `motion.div` per color, with `data-testid="wheel-glow"` and `data-color={color}`.
    - Each is a large circle with heavy `filter: blur(…)`. That is `filter`, not `backdrop-filter`, so it isn't a glass surface.
    - Positions: top-right, bottom-left and bottom-right, as in the mockup.
    - Background color animates via Framer Motion `animate`, with a duration of about 0.6s.
    - When `useReducedMotion()` is true, the transition `duration` is 0.
- **Visual verification:** this task produces the first visible result. Take before and after screenshots of `/config?c=…` at 1440×900 and 390×844, with the field focused and unfocused.

Decisions:

- `config-page.tsx` computes `glowColors` with `useMemo` from `getGlowColors(buildWheelColorConfig(parsedWheelColorType, baseColor, deserializedCustomColors, false))`.
  - The memo depends on the color type, base color and custom colors only.
  - `randomizeColor` is passed as `false` deliberately, so the glows ignore it.
- It renders `<WheelGlows colors={glowColors} />` once, inside `<main>`.
- The `h1` and the `<form>` are wrapped in one `div` with `glass-surface glass-form rounded-3xl p-6` (`p-4` on phones). This matches mockup B, where the heading sits on the sheet.
- The preview `Card` replaces `bg-surface/70 backdrop-blur-md` with `glass-surface rounded-3xl`. Keep `p-0` and `shadow-lg` as they are.
- Switches and the Update, Create and Reset buttons in the form get `glass-rim`. The purple fill is unchanged.

- [ ] **Step 1: Write the failing tests.**
  - In `wheel-glows.test.tsx`:
    - "renders one glow per color": `getAllByTestId('wheel-glow')` has length 3, and its `data-color` values equal the input.
    - "is hidden from assistive tech": the root has `aria-hidden="true"`.
    - "applies new colors when props change": rerender with `['#ff0000']` → one glow, `data-color="#ff0000"`.
  - Add to `config-page.test.tsx`, reusing the existing mocks and render helper:
    - "shows glows from the wheel's color settings": with the mocked Triad config, the `data-color` list equals `getGlowColors(<that config's wheelColorConfig>)`.
    - "changing the color scheme updates the glows": choose another scheme via the select (same interaction as the existing scheme-description test), and the `data-color` list changes to the new scheme's `getGlowColors` result.
    - "typing names does not change the glows": change the segments textarea, and the `data-color` list is unchanged (Review Focus 2).
- [ ] **Step 2: Run** `npx vitest run apps/web/src/components/__tests__/wheel-glows.test.tsx apps/web/src/pages/__tests__/config-page.test.tsx`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the CSS utilities and `.glass-form` rules in `globals.css`, then `WheelGlows`, then the `config-page.tsx` changes.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then run the full `npm run test -- --run`. Expected: all pass, with no existing test edited.
- [ ] **Step 5: Browser check** on the dev server, comparing the screenshots against the mockups. Confirm:
  - glows visibly change when switching schemes
  - the active field shows tint, rim and glow
  - the label color is identical between active and resting fields (compare computed `color`)
  - no `backdrop-filter` element sits inside another; check with `el.closest` on every element whose computed `backdrop-filter` isn't `none`

  Record the results in the report.

- [ ] **Step 6: Commit** `feat(web): glass edit form with wheel-color glows`.

---

### Task 3: Navbar, mobile menu, and Actions drawer

**Files:**

- Modify: `apps/web/src/components/navbar.tsx`, `apps/web/src/components/action-accordion.tsx` (only if the wells need a class there), `apps/web/src/components/saved-wheels-list.tsx` / `removed-winners-list.tsx` (only class names)
- Test: `apps/web/src/components/__tests__/navbar.test.tsx` (add cases)

**Interfaces:**

- Consumes: `glass-surface`, `glass-rim`, `glass-well` (Task 2).

Decisions:

- **Header:** becomes a floating bar.
  - `sticky top-2 mx-2 sm:mx-4 rounded-2xl glass-surface`
  - Remove `backdrop-blur-lg` and the full-width border.
  - Keep `h-16`, `z-40` and the content layout.
- **Active underline:** keeps `bg-accent` and adds a faint glow, `shadow-[0_0_8px_#c031e2]`.
- **Actions button:** becomes a pill, `rounded-full glass-rim` with a light white tint. It stays the `Drawer` trigger.
- **Mobile panel:**
  - Stays a sibling of `<header>`, as required by the existing test "renders the mobile panel outside the backdrop-blur header".
  - Gets `glass-surface rounded-2xl` and is inset with `mx-2` under the bar.
  - Remove its own `backdrop-blur-lg`.
- **Drawer:**
  - The `Drawer.Dialog` gets `glass-surface` with rounded left corners.
  - The backdrop stays a light dim, with no blur.
  - The accordion sections get `glass-well rounded-2xl`.
- **Unchanged:** all navbar behavior and its tests (focus, inert, Escape, scroll lock, breakpoint close, route-change close).

- [ ] **Step 1: Write failing tests** in `navbar.test.tsx`:
  - "header and mobile panel are glass surfaces": the banner element has the class `glass-surface`. After opening the menu, the panel has `glass-surface`, and the panel is not a descendant of the banner.
  - "no nested backdrop blur": with the menu open, the panel has no ancestor element with the class `glass-surface`.
- [ ] **Step 2: Run** `npx vitest run apps/web/src/components/__tests__/navbar.test.tsx`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the class changes.
- [ ] **Step 4: Run** the navbar tests, then the full suite. Expected: all pass, with the existing navbar tests unedited.
- [ ] **Step 5: Browser check** with screenshots on the wheel page and `/config`:
  - desktop: navbar, drawer open
  - phone: navbar, menu open
  - confirm the Escape and Tab behavior still work, and the no-nested-blur check passes
- [ ] **Step 6: Commit** `feat(web): glass navbar, mobile menu and actions drawer`.

---

### Task 4: Winner card, select dropdowns, and tooltips

**Files:**

- Modify: `apps/web/src/pages/wheel-page.tsx` (the winner `Card` near line 192), `apps/web/src/globals.css` (global popover and tooltip overrides)
- Test: `apps/web/src/pages/__tests__/wheel-page.test.tsx` (add a case if the winner state can be rendered; see the step)

**Interfaces:**

- Consumes: `glass-surface`, `glass-rim` (Task 2).

Decisions:

- **Winner card:**
  - Replace `bg-background/50 … backdrop-blur-md backdrop-saturate-150 dark:bg-default/50` with `glass-surface rounded-3xl`.
  - Its buttons get `glass-rim`.
  - Leave the wheel's motion-blur overlay alone; it is hard-coded to `blur(0)`.
- **Select dropdowns:**
  - In `globals.css`, apply the glass look to HeroUI's select popover and list box classes, globally. Find the class names in `@heroui/styles`.
  - Hovered or selected options get a soft `#c031e2` tint at about 18%.
  - Use plain CSS declarations that read Task 2's `--glass-*` custom properties. You can't apply a Tailwind `@utility` to a third-party class.
- **Tooltips:** HeroUI's tooltip class gets the same glass, with a lighter blur of about 12px, and keeps the rim.

- [ ] **Step 1: Write the failing test.** If `wheel-page.test.tsx` can reach the winner state through the existing mocks and contexts, add "winner card is a glass surface", asserting the card element has `glass-surface`. If the winner state can't be reached without new production hooks, skip this test, say so in the report, and rely on the Step 4 browser check.
- [ ] **Step 2: Run** it. Expected: FAIL. Skip this step if Step 1 was skipped.
- [ ] **Step 3: Implement** the changes.
- [ ] **Step 4: Browser check** with screenshots:
  - spin a wheel to a winner at both sizes
  - open both selects on `/config`
  - hover a saved-wheel button to show a tooltip
  - confirm popover and tooltip elements are not descendants of any `glass-surface` (Review Focus 5)
  - confirm the hovered option's tint shows
- [ ] **Step 5: Run** the full suite. Expected: all pass. Then commit `feat(web): glass winner card, dropdowns and tooltips`.

---

### Task 5: Accessibility fallbacks, contrast, screenshots, and changelog

**Files:**

- Modify: `CHANGELOG.md` (under `## [3.0.0]` Unreleased, `### Changed`), and `apps/web/src/globals.css` only if a fallback or contrast fix is needed.

- [ ] **Step 1: Reduced transparency.** Emulate `prefers-reduced-transparency: reduce` in headless Chromium (`page.emulateMedia` doesn't cover it; use CDP `Emulation.setEmulatedMedia` with features `[{ name: 'prefers-reduced-transparency', value: 'reduce' }]`). Confirm every `glass-surface` and every popover or tooltip has computed `backdrop-filter: none` and an opaque background. Take screenshots.
- [ ] **Step 2: Reduced motion.** Emulate `prefers-reduced-motion: reduce`. Switch the color scheme, and confirm the glow `background-color` reaches its new value on the next animation frame, with no intermediate values sampled over 300ms.
- [ ] **Step 3: Contrast** (Review Focus 3).
  - Setup: on `/config` with a Custom scheme of `['#ffff00', '#ffffff']`, and separately with Triad `#c031e2`.
  - Measure: for labels, input text, placeholders and descriptions, take an element screenshot, compute the median background luminance behind the text box (excluding the glyph pixels), and compute the WCAG contrast ratio against the computed text color.
  - Pass: every ratio is at least 4.5. If one fails, darken the sheet tint or add a dark underlay inside `glass-surface` (one variable change), then re-run Tasks 2–4's browser checks.
  - Report: a table of the ratios.
- [ ] **Step 4: Final screenshots** of every changed surface at 1440×900 and 390×844, saved to `.superpowers/screenshots/liquid-glass/` with the same names as the baseline files for side-by-side comparison.
- [ ] **Step 5: Changelog.** Add `- Refreshed the look with frosted glass panels and glowing highlights in the wheel's colors on the configuration page.`
- [ ] **Step 6: Verify.** Run `npm run test -- --run`, `npm run lint`, `npm run check-types` and `npm run build --workspace apps/web`. Expected: all pass.
- [ ] **Step 7: Commit** `docs: changelog entry for the glass redesign`, together with any fallback or contrast fix as a separate `fix(web): …` commit before it.
