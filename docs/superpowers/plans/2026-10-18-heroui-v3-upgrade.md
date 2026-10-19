# HeroUI v3 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `apps/web` from HeroUI 2.8.9 to 3.2.6 with all behavior intact and v3's default look.

**Architecture:** Full migration on branch `feat/heroui-v3-upgrade`. Task 1 makes a v2-compatible prep change. Task 2 swaps the dependencies and theme, which breaks the type check until Tasks 3–6 port the remaining files. Task 7 verifies the whole branch. v2 and v3 can't share one tree cleanly because both define `--background`, `--foreground`, `.dark` and React Aria, so we don't try to run them side by side.

**Tech Stack:** React 19.2.4, Tailwind 4.2.1, HeroUI 3.2.6 (React Aria Components), react-hook-form 7.71.2, react-router 7.13.1, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-18-heroui-v3-upgrade-design.md`

## Global Constraints

- Accept v3's default look. Do not write CSS to recreate v2 styling. Only port what is needed to keep **behavior** and keep the purple accent identity.
- Install from the repo root, pinned exact: `npm install --save-exact --workspace apps/web <pkg>`.
- Keep `framer-motion` 12.34.3 in `apps/web` dependencies.
- Keep the theme name `dark-purple` and its palette: accent `#c031e2`, accent foreground `#ffffff`, focus `#F182F6`, background `rgb(10 10 10)`, foreground `#ffffff`.
- Filenames are kebab-case. Tests go in `__tests__/<subject>.test.tsx`. Strict TypeScript, no `any`.
- No changes outside `apps/web` except `package-lock.json`, the root `package.json` `allowScripts` entry, and `CHANGELOG.md`.
- v3 reference: https://heroui.com/react/llms-full.txt. Per-component guides are at `https://heroui.com/docs/react/migration/<component>`.
- **Commits in Tasks 2–5 use `git commit --no-verify`.** The pre-commit hook runs the type check, and that fails until Task 6 is done. Before committing, each of those tasks must show `npx tsc --noEmit -p apps/web/tsconfig.app.json` reporting **no errors in the files that task touched**. Its own tests must also pass. From Task 6 on, commits go through the hook.

### v2 → v3 cheat sheet (applies to every task)

| v2 | v3 |
|---|---|
| `onPress` on Button | unchanged |
| `color="primary"` (solid) | `variant="primary"` |
| `color="primary" variant="flat"` | `variant="tertiary"` |
| `color="secondary"` | `variant="secondary"` |
| `color="danger" variant="flat"` | `variant="danger-soft"` |
| `color="default"` (solid/flat), `variant="light"` | `variant="tertiary"` / `variant="ghost"` |
| `variant="shadow"`, `shadow="lg"` | drop it; add class `shadow-lg` |
| `startContent` / `endContent` | icon as first or last child |
| `radius="lg"` | drop it (class `rounded-lg` if needed) |
| `Button as={Link} href=…` | react-router `<Link to=… className={buttonVariants({ variant, size })}>`, with `buttonVariants` from `@heroui/react` |
| `Card isBlurred` | classes `backdrop-blur-md backdrop-saturate-150` |
| `CardHeader` / `CardBody` / `CardFooter` | `Card.Header` / `Card.Content` / `Card.Footer` |
| `Divider` | `Separator` |
| `useDisclosure` | `useOverlayState` (`.isOpen`, `.open`, `.close`, `.toggle`) |
| `Link showAnchorIcon` | `<Link href>text<Link.Icon /></Link>` |
| `text-medium` / `text-small` / `text-default-500` | `text-base` / `text-sm` / `text-muted` |
| `text-primary` / `bg-primary` | `text-accent` / `bg-accent` |
| `dark:bg-default-100/50` | `dark:bg-default/50` |
| `bg-secondary text-secondary-foreground hover:bg-secondary/80` | `bg-default text-default-foreground hover:bg-default-hover` |
| `bg-primary text-primary-foreground hover:bg-primary/90` | `bg-accent text-accent-foreground hover:bg-accent-hover` |

## Review Focus

1. **The config form loads asynchronously, then `setValue`/`reset` must show in every field.** v3 TextField, Switch and Select are React-controlled and their ref is not the input, so `register` silently stops reflecting `setValue`. Covered by `config-page.test.tsx` "populates every field from the loaded config" and "Reset restores the loaded values" (Task 6).
2. **Links must navigate inside the app, not reload the page.** This depends on `RouterProvider` in `providers.tsx`. Covered by `navbar.test.tsx` "clicking About navigates without a page load" (Task 5).
3. **A user-chosen page background or foreground must not recolor HeroUI components.** It must also not break `bg-background`. Covered by `colors.test.ts` asserting that `--background` and `--foreground` are **not** set inline (Task 1).
4. **The Actions drawer closes after loading a saved wheel.** `closeDrawer` must be `close`, not a toggle. Covered by `navbar.test.tsx` "closeDrawer from the accordion closes the drawer" (Task 5).
5. **The mobile menu's scroll lock must be released** when the menu closes or the navbar unmounts. Covered by `navbar.test.tsx` "restores body scroll when the menu closes and on unmount" (Task 5).

---

### Task 1: Rename the page color variables

v3 owns `--background` and `--foreground`. The app writes a gradient and user colors into them, so give the app its own names first. This still works on v2, so it commits through the hook.

**Files:**
- Modify: `apps/web/src/globals.css` (the `:root` block and the `html, body` rule in `@layer utilities`)
- Modify: `apps/web/src/hooks/colors.ts` (`useSetDocumentBackgroundColor`, `useSetDocumentForegroundColor`)
- Test: `apps/web/src/hooks/__tests__/colors.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--page-background` and `--page-foreground` on `document.documentElement`. Hook signatures are unchanged.

- [ ] **Step 1: Update the tests.** In `colors.test.ts`, change the two assertions (around lines 60 and 67) to read `--page-background` / `--page-foreground`. To each, add `expect(document.documentElement.style.getPropertyValue('--background')).toBe('')` (or `'--foreground'` respectively).
- [ ] **Step 2: Run** `npx vitest run apps/web/src/hooks/__tests__/colors.test.ts`. Expected: the 2 updated tests FAIL.
- [ ] **Step 3: Implement.** Set `--page-background` / `--page-foreground` in `hooks/colors.ts`. In `globals.css`, rename the `:root` variables and the `var(...)` references in the `html, body` rule to match.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then run `npm run dev --workspace apps/web` and confirm that the page gradient and the wheel page's custom background still render.
- [ ] **Step 5: Commit** (hook enabled): `git commit -m "refactor(web): rename page color CSS variables to avoid HeroUI v3 token clash"`

---

### Task 2: Swap dependencies, theme, and routing provider

**Files:**
- Modify: `apps/web/package.json`, `package-lock.json`, and the root `package.json` (remove the `allowScripts` entry `"@heroui/shared-utils@2.1.12"`)
- Delete: `apps/web/src/hero.ts`
- Modify: `apps/web/src/globals.css`, `apps/web/index.html`, `apps/web/src/providers.tsx`, `apps/web/CLAUDE.md`

**Interfaces:**
- Produces: v3 installed, the `dark-purple` theme via CSS, and `RouterProvider` wrapping the app. Later tasks rely on `RouterProvider` so that HeroUI `Link href` navigates client-side.

- [ ] **Step 1: Swap packages** from the repo root:
  ```bash
  npm uninstall --workspace apps/web @heroui/react @heroui/system @heroui/theme
  npm install --save-exact --workspace apps/web @heroui/react@3.2.6 @heroui/styles@3.2.6 react-aria-components@1.21.1 react-aria@3.52.1 @react-aria/ssr@3.10.1 @react-aria/utils@3.34.1 @internationalized/date@3.12.4
  ```
  `react-aria-components` 1.21.1 pairs exactly with `react-aria` 3.52.1, the pair HeroUI 3.2.6 was tested against. Do not take 1.22.x. Then remove the `allowScripts` entry. Run `npm ls react-aria @heroui/react` and expect a single copy of each. Run `npm run sherif` and expect no issues.
- [ ] **Step 2: Theme.** In `globals.css`:
  - Add `@import '@heroui/styles';` directly after `@import 'tailwindcss';`.
  - Delete `@plugin './hero.ts'`, the `@source '…@heroui/theme…'` line, and `@custom-variant dark …`. HeroUI's `dark` variant covers `.dark`.
  - Add `@layer base { .dark-purple { --accent: #c031e2; --accent-foreground: #ffffff; --focus: #F182F6; --background: rgb(10 10 10); --foreground: #ffffff; } }`.
  - Delete `hero.ts`.
  - In `index.html`, set `<html lang="en" class="dark dark-purple">`. The body gradient now comes from `--page-background`.
- [ ] **Step 3: Routing.** In `providers.tsx`, replace `HeroUIProvider navigate={navigate}` with `RouterProvider` from `@heroui/react`, passing `navigate={navigate} useHref={useHref}` (`useHref` from `react-router`). Keep the provider order otherwise unchanged.
- [ ] **Step 4: Docs.** Update `apps/web/CLAUDE.md`:
  - In the key entry points table, remove `hero.ts` and describe the theme as living in `globals.css`.
  - Rewrite Gotchas 4 and 5: the theme is the `.dark-purple` block in `globals.css` and the `dark dark-purple` classes in `index.html`.
  - Mention that `--background`/`--foreground` belong to HeroUI and that the page uses `--page-*`.
- [ ] **Step 5: Verify** with `npx tsc --noEmit -p apps/web/tsconfig.app.json 2>&1 | grep -E "providers.tsx"`. Expected: no output. Errors in other files are expected at this stage.
- [ ] **Step 6: Commit** with `--no-verify`: `chore(web): switch to HeroUI v3 packages, CSS theme, and RouterProvider`

---

### Task 3: Port the static pages and simple components

**Files:**
- Modify: `apps/web/src/pages/home-page.tsx`, `legacy-page.tsx`, `about-page.tsx`, `wheel-page.tsx`, `apps/web/src/components/wheel-preview.tsx`, `color-picker.tsx`, `error-boundary.tsx` (only the two `bg-secondary…` / `bg-primary…` class strings; leave the pre-existing `bg-card`/`destructive` classes alone and mention them in the PR)
- Test: `apps/web/src/pages/__tests__/home-page.test.tsx` (new), `apps/web/src/pages/__tests__/legacy-page.test.tsx` (new), and the existing `wheel-page.test.tsx`

**Interfaces:**
- Consumes: the cheat sheet; `buttonVariants` from `@heroui/react`.

Decisions:
- **home-page:** the CTA becomes a react-router `Link` styled with `buttonVariants({ variant: 'primary', size: 'lg' })` plus `shadow-lg`.
- **legacy-page:** the CTA becomes `<Button variant="primary" size="lg" isDisabled={!newConfig} onPress={() => navigate(<same target as today>)}>`. A link can't be disabled, so it is a button.
- **wheel-page:** the blurred winner card gets `backdrop-blur-md backdrop-saturate-150 shadow-lg`.
- **wheel-preview:** Card keeps its `data-testid` and `style`. Add `p-0` only if v3's padding visibly breaks the preview.
- **color-picker:** keep the bare `Input` primitive. The swatch buttons get `min-w-10` so they keep their size.

- [ ] **Step 1: Write tests.**
  - `home-page.test.tsx`: "the create-wheel call to action links to the config page". Assert that `getByRole('link', { name: <existing CTA text> })` has `href="/config"`.
  - `legacy-page.test.tsx`: "the call to action is disabled until a legacy config decodes". Render with no decodable config and assert `getByRole('button', { name: <existing CTA text> })` is disabled. Wrap in `MemoryRouter` and the providers the page needs, following `wheel-page.test.tsx`.
- [ ] **Step 2: Run** `npx vitest run apps/web/src/pages/__tests__`. Expected: the new tests FAIL (the imports are still v2).
- [ ] **Step 3: Port** each file using the cheat sheet.
- [ ] **Step 4: Run** the tests. Expected: all pass, including `wheel-page.test.tsx`. Then run `npx tsc --noEmit -p apps/web/tsconfig.app.json 2>&1 | grep -E "home-page|legacy-page|about-page|wheel-page|wheel-preview|color-picker|error-boundary"`. Expected: no output.
- [ ] **Step 5: Commit** with `--no-verify`: `refactor(web): port pages and simple components to HeroUI v3`

---

### Task 4: Port the Actions drawer contents

**Files:**
- Modify: `apps/web/src/components/action-accordion.tsx`, `saved-wheels-list.tsx`, `removed-winners-list.tsx`
- Test: `apps/web/src/components/__tests__/action-accordion.test.tsx` (new)

**Interfaces:**
- Produces: `ActionAccordion({ pathname, closeDrawer }: ActionAccordionProps)`, with the signature unchanged. `closeDrawer: () => void` is called after an action that should dismiss the drawer, exactly where it is called today.

Decisions:
- **Accordion:**
  - Use `allowsMultipleExpanded` and `defaultExpandedKeys={['saved-wheels', 'removed-winners']}` (keep today's default keys).
  - Each item is `Accordion.Item id=…` › `Accordion.Heading` › `Accordion.Trigger` (title text + `Accordion.Indicator`) › `Accordion.Panel` › `Accordion.Body`.
- **Icon buttons:** `primary`+`flat` becomes `variant="tertiary"` plus `className="bg-accent-soft text-accent-soft-foreground"`, which keeps the purple tint as part of the identity.
- **Delete buttons:** use `variant="danger-soft"`.
- **ButtonGroup:** keep it.

- [ ] **Step 1: Write tests** in `action-accordion.test.tsx`:
  - "shows Saved Wheels and Removed Winners expanded by default": both triggers have `aria-expanded="true"`.
  - "collapses a section when its header is clicked": click "Saved Wheels" and expect `aria-expanded="false"`.
  - Use the providers the lists need (removed-winners, config) and `MemoryRouter`.
- [ ] **Step 2: Run** `npx vitest run apps/web/src/components/__tests__/action-accordion.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Port** the three files.
- [ ] **Step 4: Run** the test. Expected: PASS. Run the `tsc` grep for these three files. Expected: no output.
- [ ] **Step 5: Commit** with `--no-verify`: `refactor(web): port actions accordion and lists to HeroUI v3`

---

### Task 5: Rebuild the navbar

v3 has no Navbar. Rebuild `AppNavBar` in `components/navbar.tsx` from plain markup, keeping today's layout and behavior.

**Files:**
- Modify: `apps/web/src/components/navbar.tsx`
- Test: `apps/web/src/components/__tests__/navbar.test.tsx` (new)

**Interfaces:**
- Consumes: `ActionAccordion` (Task 4); `RouterProvider` (Task 2) for the test wrapper.
- Produces: `export function AppNavBar(): JSX.Element`, with the export name unchanged.

Behavior to keep (from the current component):
- Sticky bar, `h-16`, content max width `max-w-5xl`, translucent background with `backdrop-blur-lg`.
- Left: a hamburger toggle, visible below `sm` only. It is a native `<button>` with `aria-expanded`, and its `aria-label` switches between "Open Menu" and "Close Menu".
- Brand: a link to `/` labelled "Wheel in the Sky".
- Centre (`sm` and up): the items from the existing `buildNavbarItems` logic:
  - Wheel, only when `?c=` is present
  - Create Wheel or Change Wheel
  - About
  - Each item is a HeroUI `Link`. The active one gets `aria-current="page"` and a 2px `bg-accent` underline drawn with `after:`.
- Right (`sm` and up): `<Button variant="ghost" onPress={drawer.open}>Actions<FaList /></Button>`.
- Mobile menu: when open, a panel below the bar shows the same items, then a `Separator`, then `<ActionAccordion closeDrawer={closeMenu} />`. Animate it with Framer Motion `AnimatePresence`. While open, set `document.body.style.overflow = 'hidden'` and restore it on close or unmount. Clicking an item closes the menu.
- The drawer:
  - `const drawer = useOverlayState()`
  - `<Drawer state={drawer}>` › `Drawer.Backdrop` › `Drawer.Content placement="right"` › `Drawer.Dialog className="sm:w-md"` › `Drawer.CloseTrigger`, `Drawer.Header` › `Drawer.Heading` "Actions", and `Drawer.Body` › `<ActionAccordion closeDrawer={drawer.close} />`

- [ ] **Step 1: Write tests** in `navbar.test.tsx`. Render `AppNavBar` plus a `Routes` outlet inside `MemoryRouter` › `RouterProvider` (same props as `providers.tsx`) › the providers `ActionAccordion` needs.
  - "shows the Wheel link only when a config is in the URL": compare `/config` with `/config?c=abc`.
  - "marks the current page with aria-current": at `/about`, the About link has `aria-current="page"`.
  - "clicking About navigates without a page load": click the About link and assert that the routed About placeholder renders. A full page load can't happen in jsdom, so this proves the click went through RouterProvider.
  - "toggle opens and closes the mobile menu": the toggle's `aria-label` goes from "Open Menu" to "Close Menu", `aria-expanded` becomes `"true"`, and the menu items are visible.
  - "restores body scroll when the menu closes and on unmount": open → `document.body.style.overflow === 'hidden'`; close → `''`; open then `unmount()` → `''`.
  - "Actions opens the drawer": click Actions → `getByRole('dialog')` contains the heading "Actions".
  - "closeDrawer from the accordion closes the drawer": open the drawer, trigger an accordion action that calls `closeDrawer` (e.g. load a saved wheel seeded in local storage), then assert that `queryByRole('dialog')` is gone.
- [ ] **Step 2: Run** `npx vitest run apps/web/src/components/__tests__/navbar.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Rebuild** `navbar.tsx`.
- [ ] **Step 4: Run** the test. Expected: PASS. Run the `tsc` grep for `navbar.tsx`. Expected: no output.
- [ ] **Step 5: Commit** with `--no-verify`: `feat(web): rebuild navbar without HeroUI Navbar for v3`

---

### Task 6: Port the config (edit) page form

This is the riskiest file. v3 fields are React-controlled, so every field registered with `register` moves to react-hook-form `Controller`. The `setValue` effect, `useWatch`, and `onSubmit` stay as they are.

**Files:**
- Modify: `apps/web/src/pages/config-page.tsx`
- Test: `apps/web/src/pages/__tests__/config-page.test.tsx` (new)

**Interfaces:**
- Consumes: `useDecodedConfig`, `useEncodeConfigMutation` from `@/hooks/config` (mocked in tests, as `wheel-page.test.tsx` does).
- Produces: none new. The submit payload `ConfigFormInputs` is unchanged.

Field mapping (all fields go through `<Controller control={control} name=… rules=…>`):
- **title, description:**
  - `TextField` with `name`, `value`, `onChange`, and `onBlur` from `field`
  - inside it: `Label`, `Input placeholder`, and `Description` where one exists today
- **names:**
  - `TextField isRequired isInvalid={!!fieldState.error}`, with `rules={{ required: true }}`
  - inside it: `Label` "Wheel Segments", `TextArea placeholder`, `Description`, and `FieldError` with the existing error text
- **randomizeOrder, showNames, randomizeColor:**
  - `<Switch isSelected={field.value} onChange={field.onChange} name={field.name}>`
  - inside it: `Switch.Content` › `Switch.Control` › `Switch.Thumb`, then the label text
- **colorSchemeType, backgroundColorType:**
  - `<Select data-testid=… isRequired name value={field.value} onChange={(k) => field.onChange(String(k))} items={…}>`, keeping the existing `data-testid` values
  - `Label`
  - `Select.Trigger` › `Select.Value` (render prop shows `selectedItem?.label`) and `Select.Indicator`
  - `Description` with the current description text
  - `Select.Popover` › `ListBox` › `ListBox.Item id={String(o.id)} textValue={o.label}`, containing `Label` and `Description` and `ListBox.ItemIndicator`
  - Remove `popoverProps` and `disallowEmptySelection`
- **ColorPicker blocks:** unchanged (they use `FormProvider` context).
- **Buttons:**
  - Update: `variant="primary" type="submit"`
  - Create New: `variant={isNew ? 'primary' : 'secondary'}`
  - Reset: `<Button variant="danger-soft" onPress={() => { methods.reset(); navigate(PageBaseRoute.Config); }}>`
  - Preview toggle: `isIconOnly variant="secondary"` with class `shadow-lg`
  - Icons as children, following the cheat sheet
- **Preview card:** `className="shadow-lg backdrop-blur-md bg-surface/70"`, with `Card.Content`.
- **Error card:** `Card.Header` / `Card.Content` / `Card.Footer`.

- [ ] **Step 1: Write tests** in `config-page.test.tsx`. Mock `useDecodedConfig` to return a `Config` with:
  - title "Team Lunch"
  - description "Fridays"
  - names `['Alice','Bob']`
  - `randomizeOrder: true`, `showNames: false`
  - a non-default wheel color type

  Mock `useEncodeConfigMutation` to return `{ mutateAsync: vi.fn().mockResolvedValue({ encodedConfig: 'enc' }) }`. Render at `/config?c=abc` with the providers from `wheel-page.test.tsx` plus `RotationProvider`.

  Tests:
  - "populates every field from the loaded config": the title input has the value "Team Lunch"; the segments textarea has "Alice\nBob"; the randomize-order switch is checked; the show-names switch is unchecked; the wheel color select trigger shows that type's label.
  - "submits the edited values": change the title to "Dinner", toggle show names, click Update Existing Wheel, and expect `mutateAsync` to have been called with `expect.objectContaining({ title: 'Dinner', showNames: true, names: 'Alice\nBob' })`.
  - "changing the color scheme updates its description": open the wheel color select, choose another option, and assert that the new description text is shown.
  - "requires at least one segment": clear the segments, submit, assert the error text is shown, and assert `mutateAsync` was not called.
  - "Reset restores the loaded values": edit the title, click Reset Form, and expect the title to be "Team Lunch" again.
- [ ] **Step 2: Run** `npx vitest run apps/web/src/pages/__tests__/config-page.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Port** `config-page.tsx`. Remove `register` from the destructure if it ends up unused.
- [ ] **Step 4: Run** the test. Expected: PASS. Run `npm run check-types`. Expected: **zero errors in the whole repo**, since this is the last file to port.
- [ ] **Step 5: Commit** with the hook enabled: `refactor(web): port config form to HeroUI v3 with controlled fields`

---

### Task 7: Whole-branch verification, screenshots, changelog

**Files:**
- Modify: `CHANGELOG.md` (under `## [3.0.0] … Unreleased` › `### Changed`)

- [ ] **Step 1:** `grep -rn "@heroui/system\|@heroui/theme\|HeroUIProvider\|useDisclosure\|CardBody\|Divider\|startContent\|endContent\|isBlurred" apps/web/src`. Expected: no matches.
- [ ] **Step 2:** From the root, run `npm run sherif && npm run check-types && npm run lint && npm run test -- --run && npm run build --workspace apps/web`. Expected: all succeed. Paste the summary lines into the PR description.
- [ ] **Step 3:** Run the app (`npm run dev`) and go through the spec's "Done means" item 3 by hand:
  - navbar on desktop and the mobile menu
  - drawer: open, load a saved wheel, delete a saved wheel
  - accordion
  - removed winners
  - wheel spin
  - edit form: save, update, create new, reset
  - preview expand and collapse
  - both selects, all switches, both color pickers
  - links navigate without a full reload (the Network tab shows no document request)

  Note anything broken and fix it before continuing.
- [ ] **Step 4:** Take screenshots of home, wheel, config, about, legacy and not-found at 1440×900 and 390×844. Save them **outside the repo** and hand the paths to the owner.
- [ ] **Step 5:** Add to `CHANGELOG.md`: `- Upgraded the UI library to HeroUI v3; components use its new default styling.`
- [ ] **Step 6:** Commit with the hook enabled: `docs: changelog entry for HeroUI v3 upgrade`
