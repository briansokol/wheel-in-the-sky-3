# Liquid Glass Redesign — Design

Date: 2026-10-19
Workspace: `apps/web`
Builds on: the HeroUI v3 upgrade (PR #36, merged as `f4667d7`)

## Intent

The UI feels flat. Today the "glass" is just a background blur on a couple of
cards, and the edit page's form is mostly flat dark gray: the only color is
on buttons, switches and the active tab. The owner wants something closer to
Apple's liquid glass. The point isn't more blur. It's **light catching the
edges of panes, and real color showing through them**. The owner especially
wants a splash of color on the field being typed in.

Glass only shows color when there's something colorful behind it. On the
wheel page the wheel provides that. On the edit page nothing does, so the edit
page gets **soft glows in the current wheel's colors behind the form**.

## Goals

1. **Edit page backdrop.** Soft, heavily blurred glows in the current wheel's
   colors sit behind the form. They **update as the wheel's colors change**
   while editing, so the page stays in step with the preview.
2. **Edit form on one glass sheet.** The whole form sits on a single frosted
   glass sheet (owner chose "layout B" over per-field glass):
   - a translucent light tint over the glows, blurred and slightly saturated
   - a thin light rim, brightest along the top edge, plus a soft drop shadow
3. **Fields at rest are quiet dark wells** inside the sheet. They are
   translucent dark insets with a faint border, not individual glass panes.
4. **The active field glows purple.** The field being typed in:
   - fills with a soft purple tint
   - gets a pink-purple rim and an outward purple glow
   - **keeps its label color unchanged.** The owner explicitly rejected the
     label changing color.
5. **Switches and buttons** keep today's purple and pick up the same light rim
   (a top highlight), so they read as part of the glass.
6. **The same glass on other surfaces**, one blurred layer each, never glass
   stacked on glass:
   - **Navbar:** a floating glass bar with rounded corners, inset from the
     screen edges instead of a full-width strip. The active page's purple
     underline gets a faint glow, and "Actions" becomes a small glass pill.
   - **Actions drawer:** a glass panel sliding in from the right over a light
     dim of the page. Saved Wheels and Removed Winners sit in dark wells, like
     the form fields.
   - **Wheel preview card** on the edit page: glass matching the form sheet,
     sitting over the same wheel-color glows.
   - **Winner card** on the wheel page: glass over the wheel, with buttons
     using the same light rim.
   - **Mobile menu panel:** a glass sheet under the bar, with the page blurred
     behind it.
   - **Dropdowns and tooltips:** the list that opens from the color-scheme
     selects, and the hover tooltips on buttons, use the same glass.
     - The selected or hovered option in a dropdown uses a soft purple tint.
     - Tooltips are small, so a lighter blur is fine. They still keep the
       rim.
     - Owner decision, made after the builder check.

Visual reference: the owner reviewed and approved mockups during
brainstorming. They are saved, git-ignored, under
`.superpowers/brainstorm/396222-1792464791/content/`:

- `glass-direction.html`: option B
- `active-field.html`: option 2, but with the label color left unchanged
- `surfaces.html`: wheel page, drawer, phone menu

The CSS values in those files are a starting point, not a spec. Baseline
screenshots of the current app (HeroUI v3 default look) are in
`.superpowers/screenshots/heroui-v3/`.

## Non-goals

- **Home and About pages:** they are not restyled. They only get the new navbar,
  which is global.
- **Wheel page background:** no added glows. The wheel and any user-chosen
  custom background already supply the color.
- **Layout, wording, field order, behavior:** this is visual only. Every
  existing test should keep passing without edits, except where a test
  asserts on styling the redesign changes.
- **Light mode:** the app is dark-only and stays that way.
- **Pre-existing bugs from #36:** "Add Color" swatch, preview overflow at phone
  width, textarea auto-grow. They are out of scope unless they block the
  design.

## Anti-goals (failure even if it "works")

- Glass that reads as flat gray on the edit page, meaning the glows are too
  faint to show through.
- Busy, per-field glass. The owner chose the calmer single sheet.
- The active field's label changing color.
- Text that becomes hard to read over bright glows.
- Scrolling or animation that stutters on phones because of stacked blur.
  The PR #36 review bot flagged blur cost on low-end mobile GPUs.

## Constraints

- **Styling:** HeroUI v3 + Tailwind v4, with the theme in
  `apps/web/src/globals.css` (`.dark-purple`). HeroUI v3 components are
  styled through their BEM classes and CSS variables, or through `className`.
  Don't fight v3 defaults with `!important` where a variable or class works.
- **Accent colors:** the existing purple identity, accent `#c031e2` and focus
  `#F182F6`.
- **Animation:** Framer Motion only. Project rule: no hand-written CSS
  transitions. This covers the glows changing color as the wheel changes.
- **Page colors:** `--background` and `--foreground` belong to HeroUI. Page
  colors stay in `--page-background` and `--page-foreground` (see Gotcha 4 in
  `apps/web/CLAUDE.md`).
- **One blur per surface:** every glass surface uses a single
  `backdrop-filter` layer, with none nested inside another.
  - Overlapping sibling surfaces are fine. Examples: the fixed preview card
    over the scrolling form sheet, or the navbar bar next to the mobile menu
    panel.
  - Nesting is not fine. A `backdrop-filter` element inside another one
    breaks fixed positioning and blur sampling. PR #36's navbar test already
    pins the mobile panel outside the blurred header.
  - The mobile menu blurs the page behind it through the panel's own glass.
    There is no separate blurred dim layer.
- **Wheel blur overlay:** the wheel's motion-blur overlay (`wheel.tsx`,
  `wheel-animation-manager.ts`) is hard-coded to `blur(0)` today. It never
  stacks with the winner card's glass, so leave it alone.
- **Conventions:** kebab-case filenames, tests in `__tests__/`, strict
  TypeScript, and a `CHANGELOG.md` entry.

## Decisions made by the owner

1. Glass means light edges plus color showing through, not just blur.
2. On the edit page, glows taken from the wheel's colors sit behind the form
   and update as the colors change.
3. The form sits on one frosted sheet with dark-well fields (layout B).
4. The active field gets a purple tint and glow, and its label color does not
   change.
5. Switches and buttons get the light rim.
6. Glass applies to the edit form, navbar, Actions drawer, wheel preview card,
   winner card, mobile menu, select dropdowns and tooltips. Home and About are
   left alone.
7. The PR #36 review follow-ups were fixed on #36 before this work started.

## Calls made by Claude (owner can override)

- **Where the glow colors come from:** the wheel's color settings, meaning
  the color scheme type, base color and custom colors. They don't come from
  the exact rendered segments.
  - The function ignores the names list and `randomizeColor`. Typing names or
    shuffling never makes the glows flicker; only changing a color setting
    moves them.
  - Pick up to three colors spread evenly across the palette the scheme
    produces. Use fewer if the palette has fewer.
  - It's a pure function, `wheel color settings → glow colors`, with unit
    tests.
- **Glow placement:** glows are fixed to the viewport behind everything on
  the edit page. They stay put while the form scrolls, so the sheet and the
  fixed preview card always have color behind them.
- **Active-field glow scope:** the purple tint, rim and glow apply to every
  field-like control when focused: text inputs, the textarea, select
  triggers, and the color picker's hex input. Switches and buttons only get
  the light rim (Goal 5).
- **Glow motion:** when colors change, glows cross-fade or tween to the new
  colors with Framer Motion. They don't drift or animate at idle. Skip the
  tween under `prefers-reduced-motion`.
- **Reduced transparency:** under `prefers-reduced-transparency: reduce`,
  glass surfaces fall back to a solid dark surface with the same rim and
  border.
- **Readability:** text on glass meets WCAG AA contrast (4.5:1 for normal
  text). Tune the sheet's tint, or add a subtle darkening layer, so this holds
  over the brightest glows.
  - Worst cases to test: custom colors `#ffff00` and `#ffffff`.
  - Text checked: labels, input text, placeholders and descriptions.
  - Method: render in headless Chromium, sample the composited background
    behind each text element, and compute the ratio. Report the numbers.
- **Phones:** the design is the same at phone width. If blur proves too
  costly, lower the blur radius on small screens rather than dropping glass.
- **One definition:** the glass surface style (tint, blur, rim, shadow) is
  defined once and reused by every surface. It is not copied per component.

## Done means

1. Every surface in Goal 6 and the edit form match the approved direction at
   1440×900 and 390×844. New screenshots go next to the baseline in
   `.superpowers/screenshots/` for side-by-side review.
2. On the edit page, changing the color scheme, base color or custom colors
   visibly changes the glows behind the form, without a reload.
3. The active field shows the purple tint, rim and glow, and its label color is
   identical to a resting field's.
4. The reduced-transparency and reduced-motion fallbacks work. Check them in
   headless Chromium with media emulation.
5. Text contrast on every glass surface meets WCAG AA, measured over the
   brightest glow tested.
6. The existing test suite passes, and `npm run check-types`, lint and the
   build pass.
7. New tests cover:
   - the glow-color derivation (wheel config → glow colors), as a pure
     function
   - glows re-rendering when form colors change
8. There's a `CHANGELOG.md` entry.

## Left to the builder

- How glows are rendered: absolutely positioned blurred elements, a single
  canvas, or gradients. Choose for performance, within the one-blur-per-surface
  rule.
- Exact tint, blur radius, rim and shadow values, within the mockups' spirit.
- How to apply styles to HeroUI fields: BEM overrides scoped to the form sheet,
  `className`, or CSS variables.
- Whether the glass style is a Tailwind `@utility`, a CSS class, or a small
  wrapper component.
- Where the glow-color function lives. Pure color derivation could arguably
  belong in `@repo/shared` next to the existing wheel color logic. Follow
  `docs/architecture.md`.
