# Wheel in the Sky 3

TypeScript React SPA, built with Vite and deployed as static assets on
Cloudflare Workers. There is no backend: wheel configs are encoded and decoded
in the browser.

See `docs/architecture.md` for the `src/` map and the decision flow for where
new code belongs.

## Core rules

### 1. Do what has been asked; nothing more, nothing less

No unrequested features, refactoring, or "improvements". Every changed line
should trace to the request.

### 2. Ask when unclear

If a request is ambiguous or conflicts with a documented pattern, ask a specific
question and wait for an answer. Do not guess.

### 3. Test before committing

Write Vitest tests for logic and React Testing Library tests for components.
Verify they pass. Do not commit failing tests.

### 4. AGPL-3.0 compliance

This is copyleft software. Preserve existing copyright headers and record
user-facing changes in `CHANGELOG.md`.

## Conventions

**Filenames are kebab-case, without exception**: `wheel-manager.ts`,
`config-provider.tsx`, `removed-winners-list.tsx`. This holds for components,
utilities, types, and tests alike. Never PascalCase or camelCase filenames.

**Identifiers** follow ordinary TypeScript convention: PascalCase for
components, types, and classes; camelCase for functions and variables;
UPPER_SNAKE_CASE for module-level constants. Do not confuse this with the
filename rule above.

**Tests live in `__tests__/` directories** beside the code they cover, named
`<subject>.test.ts` or `<subject>.test.tsx`. They are not co-located as siblings
of the source file.

**TypeScript is strict.** No `any`. Explicit types on parameters and return
values. `interface` for object shapes, `type` for unions and tuples.

**JSDoc on exported functions and classes.** Skip it where the code is obvious.
Do not narrate what a well-named function already communicates.

## Patterns

**State**, in order of preference. Use the narrowest option that works:

1. `useState` for state local to one component
2. React Context for app-level state, see `src/contexts/`

Never add Redux, MobX, or Zustand. Context is sufficient here.

**Forms**: React Hook Form with a Zod resolver. Shared schemas live in
`src/validators/`.

**Animation**: Framer Motion. Do not hand-write CSS transitions.

**Imports**: ordering is applied automatically by
`@trivago/prettier-plugin-sort-imports` via `prettier.config.js`. Do not
hand-order imports or work around the formatter.

**Dependencies**: Install pinned to an exact version. `saveExact: true` in
`pnpm-workspace.yaml` makes `pnpm add` write exact versions.

```bash
pnpm add <package>
```

pnpm refuses versions published less than 7 days ago (`minimumReleaseAge`), and
runs a dependency's install script only if the package is listed in
`allowBuilds`. Both live in `pnpm-workspace.yaml`.

## Layout

The app lives at the repository root. `index.html`, `vite.config.ts`,
`wrangler.jsonc`, the tsconfig files, and the tool configs sit beside `src/`.
`public/` is copied verbatim into the build output and holds the favicons,
manifest, and `browserconfig.xml`.

```
src/
├── assets/             # module-imported assets; holds only a .gitkeep
├── classes/            # Config, Segment, WheelManager
├── compatibility/v2/   # decodes v2-era wheel URLs and converts them to a v3 Config
├── components/         # reusable presentational and interactive components
├── constants/          # literal values: default colors, select options, size limits, the PageBaseRoute enum
├── contexts/           # per concern: <name>.ts holds context and hook, <name>-provider.tsx holds the provider
├── enums/              # PageColorType, WheelColorType
├── hooks/              # reusable hooks, including reading and decoding the config in the URL fragment
├── pages/              # route-level screens and their layouts
├── types/              # type declarations, plus some runtime defaults
├── utils/              # helpers, mostly framework-free, including the share-link pipeline
└── validators/         # Zod schemas, including hex-color.ts and wire-config.ts
```

Each context is a pair, and both halves are required: `config.ts` exports
`ConfigContext` and `useConfig`, `config-provider.tsx` exports `ConfigProvider`.
The same split holds for rotation, segment, and removed-winners.

## Key entry points

| Path                                   | What it is                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `index.html`                           | Vite HTML entry; loads `/src/main.tsx` and sets the root theme classes                                                                           |
| `src/main.tsx`                         | Mounts React, initializes Sentry, wraps everything in `BrowserRouter`                                                                            |
| `src/providers.tsx`                    | Provider stack: config, rotation, segment, removed winners, and HeroUI `RouterProvider`, which HeroUI `Link` requires for client-side navigation |
| `src/routes.tsx`                       | Every route, nested under `RootLayout`                                                                                                           |
| `src/layout.tsx`                       | `RootLayout`: navbar, error boundary, and the routed `Outlet`                                                                                    |
| `src/hooks/encoded-config.ts`          | `useEncodedConfig`, which reads the `c` value from the URL fragment                                                                              |
| `src/hooks/config.ts`                  | `useDecodedConfig`, which decodes a config in the browser                                                                                        |
| `src/utils/wheel-animation-manager.ts` | `WheelAnimationManager`, rotation animation driven outside React state                                                                           |
| `src/constants/routes.ts`              | The `PageBaseRoute` enum, source of route path strings                                                                                           |
| `src/globals.css`                      | Tailwind entry; imports HeroUI styles and defines the `dark-purple` theme                                                                        |
| `vite.config.ts`                       | Vite plugins, the `@` alias, and the Vitest configuration                                                                                        |

## Commands

Run every command from the repository root.

| Task              | Command                      | Notes                                                               |
| ----------------- | ---------------------------- | ------------------------------------------------------------------- |
| Dev server        | `pnpm run dev`               | `vite --host`; serves from memory and writes nothing to `dist`      |
| Build             | `pnpm run build`             | `tsc -b && vite build`; writes to `dist`                            |
| Build with Sentry | `pnpm run build:with-sentry` | Sets `WITH_SENTRY`, which adds the Sentry Vite plugin               |
| Typecheck         | `pnpm run check-types`       | `tsc --noEmit` on `tsconfig.app.json`, then on `tsconfig.node.json` |
| Lint              | `pnpm run lint`              | `oxlint .`                                                          |
| Format            | `pnpm run format`            | `prettier --write` over `ts`, `tsx`, `md`, and `css` files          |
| Test, watch       | `pnpm run test`              | `vitest`                                                            |
| Test, once        | `pnpm run test:ci`           | `vitest run --coverage`                                             |
| Preview build     | `pnpm run preview`           | `vite preview`                                                      |
| Deploy            | `pnpm run deploy`            | `wrangler deploy` of `dist` as static assets; build first           |
| Update deps       | `pnpm run ncu`               | Interactive npm-check-updates via `pnpm dlx`; installs nothing      |
| Install hooks     | `pnpm run prepare`           | `husky`; pnpm runs it after `pnpm install`                          |

In `pnpm run build`, `tsc -b` is a pure typecheck because both referenced
projects set `noEmit`, and `vite build` then emits the bundle into `dist`.
`wrangler.jsonc` points `assets.directory` at `dist`, with
`not_found_handling: "single-page-application"` so client routes and legacy
`/:oldId` links load the app. There is no Worker script and no bindings.

## Share-link pipeline

| File                            | Role                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `src/utils/encoding.ts`         | `encodeConfig` and `decodeConfig`: `v5.` prefix, `deflate-raw`, base64url, size caps |
| `src/utils/wire-config.ts`      | `toWireConfig` and `fromWireConfig`: `Config` to and from the compact payload        |
| `src/utils/form-config.ts`      | `configFromFormInputs`: validates config-form values and builds a `Config`           |
| `src/validators/wire-config.ts` | `wireConfigSchema`, applied to every decoded link                                    |
| `src/validators/hex-color.ts`   | `hexColorSchema`, the one hex color rule                                             |
| `src/constants/limits.ts`       | Size limits shared by the form schema, the payload schema, and the codec             |

Every decode goes through `wireConfigSchema`. Never `JSON.parse` a link payload
and trust the result. Changing the payload shape requires a new version prefix.

## Module resolution and imports

`moduleResolution` is `bundler` in both `tsconfig.app.json` and
`tsconfig.node.json`. Imports therefore carry no file extension. Do not add
`.js` suffixes.

The path alias `@/*` maps to `src/*`, for example `@/classes/config`. It is
declared twice: in the `paths` block of `tsconfig.app.json` and in
`resolve.alias` of `vite.config.ts`.

`tsconfig.json` compiles nothing. It is a solution file whose `references`
point at the app and node configs. The app config includes only `src` and
`vitest-setup.ts`.

## Testing

The Vitest configuration is the `test` block inside `vite.config.ts`. There is
no `vitest.config.ts`. Tests run in `jsdom` with `globals: true`.
`vitest-setup.ts` registers the jest-dom matchers and calls `cleanup()` in an
`afterEach`.

`src/utils/__tests__/encoding.test.ts` runs under `// @vitest-environment node`,
because the jsdom `Blob` lacks `stream()`.

Test directories exist under `src/classes/`, `src/compatibility/v2/`,
`src/components/`, `src/hooks/`, `src/pages/`, and `src/utils/`.

Coverage deliberately excludes `./src/components/**` and `./src/pages/**`.
Component and page tests still run, but they do not count toward coverage.

## Workflow

Work on a feature branch. Write tests alongside the implementation. Update
`CHANGELOG.md` for user-facing changes.

The husky `pre-commit` hook runs, in order:

1. `pnpm run check-types`
2. `pnpm exec lint-staged`, which applies `oxlint --fix`, `prettier --write`, and
   `vitest related --run` to staged files

A commit therefore runs the tests related to your staged changes. Run
`pnpm run test` yourself for the full suite.

## Gotchas

1. The `@` alias lives in two files that must agree. Changing `paths` in
   `tsconfig.app.json` without changing `resolve.alias` in `vite.config.ts`
   breaks the runtime while the typecheck still passes. The reverse breaks the
   typecheck while the app still runs.
2. HeroUI owns `--background` and `--foreground`. The page's own gradient and
   text color live in `--page-background` and `--page-foreground` in
   `src/globals.css`. Never put the page gradient back into the HeroUI
   variables.
3. The theme name is a cross-file contract. `dark-purple` is the `.dark-purple`
   block in `src/globals.css`, applied through the `dark dark-purple` classes on
   the `<html>` element in `index.html`. Renaming one silently unstyles the app.
4. The wheel config lives in the URL fragment, not the query string. Read it
   with `useEncodedConfig` and build links with `buildConfigHash` from
   `src/utils/routes.ts`. `useSearchParams` does not see the fragment. Keep the
   config out of anything sent to a server, and keep `scrubEncodedConfig`
   applied in the Sentry hooks in `src/main.tsx`.
5. `VITE_APP_ENV=local`, set in `.env.local`, disables Sentry in
   `src/main.tsx`.
6. Sentry upload is opt-in at build time. `sentryVitePlugin` joins the plugin
   list only when `WITH_SENTRY` is set, so a plain `build` produces sourcemaps
   but uploads nothing.
7. `react-aria` and `react-aria-components` are pinned as an exact pair matching
   what the installed `@heroui/react` was tested against: 3.53.1 and 1.22.1 for
   HeroUI 3.2.7. `react-aria-components` pins `react-aria` exactly, so bump the
   three together or a second copy of React Aria ends up in the tree.
   `@internationalized/date`, `@react-aria/ssr`, and `@react-aria/utils` are
   HeroUI peer dependencies, hence direct dependencies.
8. `types/` is not purely types. `src/types/wheel-colors.ts` exports the runtime
   constant `defaultWheelColorConfig`, so an `import type` from that module
   drops a value some code depends on.
