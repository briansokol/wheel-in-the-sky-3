# web (`apps/web`)

The React single-page application, bundled by Vite into `apps/web/dist` and
deployed to Cloudflare as static assets. There is no backend.

## Purpose

Owns the browser half of the product: routing, page composition, React contexts,
pointer and DOM interaction, and the HeroUI plus Tailwind presentation layer. It
also owns the wrangler configuration (`apps/web/wrangler.jsonc`) and the deploy.

Wheel math, the `Config` and `Segment` domain classes, and Zod validators do not
go here. They live in `packages/shared` and arrive through `@repo/shared/*`,
as does the share-link codec (`@repo/shared/utils/encoding`). What belongs here is anything that touches the DOM, React, or the browser URL.

## Layout

```
apps/web/
├── public/                 # copied verbatim into the build output: favicons, manifest, browserconfig
└── src/
    ├── assets/             # module-imported assets; holds only a .gitkeep
    ├── compatibility/v2/   # decodes v2-era wheel URLs and converts them to a v3 Config
    ├── components/         # reusable presentational and interactive components
    ├── constants/          # shared literal values, such as the PageBaseRoute enum
    ├── contexts/           # per concern: <name>.ts holds context and hook, <name>-provider.tsx holds the provider
    ├── hooks/              # reusable hooks, including reading and decoding the config in the URL fragment
    ├── pages/              # route-level screens and their layouts
    └── utils/              # browser helpers with no React dependency: routes, storage, math, animation, Sentry scrubbing
```

Each context is a pair, and both halves are required: `config.ts` exports
`ConfigContext` and `useConfig`, `config-provider.tsx` exports `ConfigProvider`.
The same split holds for rotation, segment, and removed-winners.

## Key entry points

| Path                                            | What it is                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/index.html`                           | Vite HTML entry; loads `/src/main.tsx` and sets the root theme classes                                                                           |
| `apps/web/src/main.tsx`                         | Mounts React, initializes Sentry, wraps everything in `BrowserRouter`                                                                            |
| `apps/web/src/providers.tsx`                    | Provider stack: config, rotation, segment, removed winners, and HeroUI `RouterProvider`, which HeroUI `Link` requires for client-side navigation |
| `apps/web/src/routes.tsx`                       | Every route, nested under `RootLayout`                                                                                                           |
| `apps/web/src/layout.tsx`                       | `RootLayout`: navbar, error boundary, and the routed `Outlet`                                                                                    |
| `apps/web/src/hooks/encoded-config.ts`          | `useEncodedConfig`, which reads the `c` value from the URL fragment                                                                              |
| `apps/web/src/hooks/config.ts`                  | `useDecodedConfig`, which decodes a config in the browser                                                                                        |
| `apps/web/src/utils/wheel-animation-manager.ts` | `WheelAnimationManager`, rotation animation driven outside React state                                                                           |
| `apps/web/src/constants/routes.ts`              | The `PageBaseRoute` enum, source of route path strings                                                                                           |
| `apps/web/src/globals.css`                      | Tailwind entry; imports HeroUI styles and defines the `dark-purple` theme                                                                        |
| `apps/web/vite.config.ts`                       | Vite plugins, the `@` alias, and the Vitest configuration                                                                                        |

## Commands

Run from the repo root.

| Task              | Command                                          | Notes                                                           |
| ----------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Dev server        | `npm run dev --workspace apps/web`               | `vite --host`                                                   |
| Dev, whole repo   | `npm run dev`                                    | Turbo; `apps/web/turbo.json` makes it build dependencies first  |
| Build             | `npm run build --workspace apps/web`             | Writes to `apps/web/dist`, see below                            |
| Build with Sentry | `npm run build:with-sentry --workspace apps/web` | Sets `WITH_SENTRY`, which adds the Sentry Vite plugin           |
| Typecheck         | `npm run check-types --workspace apps/web`       | `tsc --noEmit` on `tsconfig.app.json` then `tsconfig.node.json` |
| Lint              | `npm run lint --workspace apps/web`              | `oxlint .`                                                      |
| Test, watch       | `npm run test --workspace apps/web`              | `vitest`                                                        |
| Test, once        | `npm run test:ci --workspace apps/web`           | `vitest run --coverage`                                         |
| Preview build     | `npm run preview --workspace apps/web`           | `vite preview`                                                  |
| Deploy            | `npm run deploy --workspace apps/web`            | `wrangler deploy` of `dist` as static assets; build first       |

Scripts an agent may expect here but that do not exist: no `format` or `sherif`
script, both of which are root-only.

## Module resolution and imports

`moduleResolution` is `bundler` in both `apps/web/tsconfig.app.json` and
`apps/web/tsconfig.node.json`. Relative imports therefore carry no file
extension, and `allowImportingTsExtensions` is on. Do not add `.js` suffixes
here; see the extensionless imports in `apps/web/src/main.tsx`.

The path alias `@/*` maps to `src/*`. It is declared twice, in the `paths` block
of `apps/web/tsconfig.app.json` and in `resolve.alias` of
`apps/web/vite.config.ts`, and its scope is this workspace only.

`apps/web/tsconfig.json` itself compiles nothing: it is a solution file whose
`references` point at the app and node configs. Only `src` and `vitest-setup.ts`
are in the app config's `include`.

Imports of sibling workspaces use the published specifiers, for example
`@repo/shared/classes/config`, never a relative
path into another workspace.

## Build output and consumption

`npm run build --workspace apps/web` runs `tsc -b && vite build`. The two stages do different jobs: `tsc -b` builds the
two referenced projects, which is a pure typecheck because both set `noEmit`,
and `vite build` then emits the bundle. `apps/web/public` is copied into that
output, and `build.sourcemap` is enabled in `apps/web/vite.config.ts`.

The output lands in `apps/web/dist`, which is gitignored and emptied on each
build. `apps/web/wrangler.jsonc` points its `assets.directory` at it, with
`not_found_handling: "single-page-application"` so client routes and legacy
`/:oldId` links load the app. There is no Worker script and no bindings.
`CHANGELOG.md` is bundled into the About page at build time through a `?raw`
import.

There is no watch build here. `npm run dev --workspace apps/web` starts the Vite
dev server, which serves from memory and writes nothing to `dist`.

## Testing

The Vitest configuration is the `test` block inside `apps/web/vite.config.ts`,
using vite's `defineConfig`. This workspace has no `vitest.config.ts`. Tests run
in `jsdom` with `globals: true`, and `apps/web/vitest-setup.ts` is the setup
file: it registers the jest-dom matchers and calls `cleanup()` in an
`afterEach`.

The root `vitest.config.ts` picks this workspace up through the apps glob in its
`projects` array, so the root `npm run test` does include it.

Test directories that exist: `apps/web/src/components/__tests__`,
`apps/web/src/hooks/__tests__`, `apps/web/src/pages/__tests__`, and
`apps/web/src/utils/__tests__`. There are no tests under `src/contexts` or
`src/compatibility`.

Coverage deliberately excludes `./apps/web/src/components/**` and
`./apps/web/src/pages/**` in the root `vitest.config.ts`. Component and page
tests are still run, they simply do not register in coverage.

## Lint and format

`apps/web/oxlint.config.ts` extends both the `base` and `react` presets from
`@repo/oxlint`, and declares no ignore patterns of its own.

`apps/web/prettier.config.js` is not the bare shared config: it combines the
base with `makeTailwindConfig('./src/globals.css')`, which points the Tailwind
class sorter at this workspace's stylesheet. `apps/web/lint-staged.config.js`
combines the oxlint, prettier, and vitest configs from `@repo/lint-staged`.

## Gotchas

1. `@repo/shared` resolves through its `exports` map to its `dist` directory,
   so a stale or missing shared build makes a typecheck here meaningless.
   `apps/web/turbo.json` declares `dependsOn: ["^build"]` for `dev`, `build`,
   and `check-types`, so going through Turbo handles it and a direct
   `npm run --workspace` invocation does not.
2. The `@` alias lives in two files that must agree. Changing `paths` in
   `apps/web/tsconfig.app.json` without changing `resolve.alias` in
   `apps/web/vite.config.ts` breaks the runtime while the typecheck still
   passes, and the reverse breaks the typecheck while the app still runs.
3. HeroUI owns `--background` and `--foreground`. The page's own gradient and
   text color live in `--page-background` and `--page-foreground` in
   `apps/web/src/globals.css`; never put the page gradient back into the
   HeroUI variables.
4. The theme name is a cross-file contract. `dark-purple` is the
   `.dark-purple` block in `apps/web/src/globals.css`, applied through the
   `dark dark-purple` classes on the `<html>` element in `apps/web/index.html`;
   renaming one silently unstyles the app.
5. The wheel config lives in the URL fragment, not the query string. Read it
   with `useEncodedConfig` and build links with `buildConfigHash` from
   `apps/web/src/utils/routes.ts`; `useSearchParams` will not see it. Keep it
   out of anything sent to a server, and keep `scrubEncodedConfig` applied in
   the Sentry hooks in `apps/web/src/main.tsx`.
6. `VITE_APP_ENV=local`, set in `apps/web/.env.local`, disables Sentry in
   `apps/web/src/main.tsx`.
7. Sentry upload is opt-in at build time. `sentryVitePlugin` is only added to the
   plugin list when `WITH_SENTRY` is set, so a plain `build` produces sourcemaps
   but uploads nothing.
8. `react-aria` and `react-aria-components` are pinned as an exact pair matching
   what the installed `@heroui/react` was tested against (currently 3.52.1 /
   1.21.1 for 3.2.6). `react-aria-components` pins `react-aria` exactly, so bump
   the three together or a second copy of React Aria ends up in the tree.
   `@internationalized/date`, `@react-aria/ssr`, and `@react-aria/utils` are
   HeroUI peer deps, hence direct dependencies.

## Boundaries

Depends on:

- `@repo/shared`, for domain classes, types, enums, constants, validators, and
  the share-link codec
- `@repo/oxlint`, `@repo/prettier`, `@repo/lint-staged`, for tooling config

Depended on by: nothing. The package is named `web`, is private, is unscoped,
and no workspace lists it as a dependency.

The graph enforces a one-way flow. This workspace imports from the shared
packages, and nothing imports back into it, so React and DOM types never leak
out of `apps/web`.
