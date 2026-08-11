# web (`apps/web`)

The React single-page application, bundled by Vite directly into the Worker's
static asset directory in `apps/api`.

## Purpose

Owns the browser half of the product: routing, page composition, React contexts,
pointer and DOM interaction, and the HeroUI plus Tailwind presentation layer. It
also owns the typed fetch layer that calls the Worker
(`apps/web/src/utils/api.ts`) and the React Query cache in front of it.

Wheel math, the `Config` and `Segment` domain classes, and Zod validators do not
go here. They live in `packages/shared` and arrive through `@repo/shared/*`.
HTTP route handlers do not go here either; they go in `packages/api-handlers`.
What belongs here is anything that touches the DOM, React, or the browser URL.

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
    ├── hooks/              # reusable hooks, including the React Query wrappers over the API client
    ├── pages/              # route-level screens and their layouts
    └── utils/              # browser helpers with no React dependency: API client, storage, math, animation
```

Each context is a pair, and both halves are required: `config.ts` exports
`ConfigContext` and `useConfig`, `config-provider.tsx` exports `ConfigProvider`.
The same split holds for rotation, segment, and removed-winners.

## Key entry points

| Path                                            | What it is                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `apps/web/index.html`                           | Vite HTML entry; loads `/src/main.tsx` and sets the root theme classes          |
| `apps/web/src/main.tsx`                         | Mounts React, initializes Sentry, wraps everything in `BrowserRouter`           |
| `apps/web/src/providers.tsx`                    | Provider stack: React Query, config, rotation, segment, removed winners, HeroUI |
| `apps/web/src/routes.tsx`                       | Every route, nested under `RootLayout`                                          |
| `apps/web/src/layout.tsx`                       | `RootLayout`: navbar, error boundary, and the routed `Outlet`                   |
| `apps/web/src/utils/api.ts`                     | Hono typed client `hc<ApiAppType>` and the shared `QueryClient`                 |
| `apps/web/src/hooks/config.ts`                  | `useDecodedConfig` and `useEncodeConfigMutation`, the config round trip         |
| `apps/web/src/utils/wheel-animation-manager.ts` | `WheelAnimationManager`, rotation animation driven outside React state          |
| `apps/web/src/constants/routes.ts`              | The `PageBaseRoute` enum, source of route path strings                          |
| `apps/web/src/globals.css`                      | Tailwind entry; also loads `src/hero.ts` as a plugin                            |
| `apps/web/src/hero.ts`                          | HeroUI theme, including the `dark-purple` theme                                 |
| `apps/web/vite.config.ts`                       | Vite plugins, the `@` alias, and the Vitest configuration                       |

## Commands

Run from the repo root.

| Task              | Command                                          | Notes                                                          |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Dev server        | `npm run dev --workspace apps/web`               | `vite --host`. Does not start the Worker; that is `apps/api`   |
| Dev, whole repo   | `npm run dev`                                    | Turbo; `apps/web/turbo.json` makes it build dependencies first |
| Build             | `npm run build --workspace apps/web`             | Writes to `apps/api/public`, see below                         |
| Build with Sentry | `npm run build:with-sentry --workspace apps/web` | Sets `WITH_SENTRY`, which adds the Sentry Vite plugin          |
| Typecheck         | `npm run check-types --workspace apps/web`       | `tsc --noEmit`                                                 |
| Lint              | `npm run lint --workspace apps/web`              | `oxlint .`                                                     |
| Test, watch       | `npm run test --workspace apps/web`              | `vitest`                                                       |
| Test, once        | `npm run test:ci --workspace apps/web`           | `vitest run --coverage`                                        |
| Preview build     | `npm run preview --workspace apps/web`           | `vite preview`                                                 |

Scripts an agent may expect here but that do not exist: there is no `deploy`
script (only `apps/api` has one), no `types` script even though the root
`turbo.json` defines a `types` task, and no `format` or `sherif` script, both of
which are root-only.

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
`@repo/shared/classes/config` and `@repo/api-handlers/client`, never a relative
path into another workspace.

## Build output and consumption

`npm run build --workspace apps/web` runs `tsc -b && vite build
--outDir=../api/public`. The two stages do different jobs: `tsc -b` builds the
two referenced projects, which is a pure typecheck because both set `noEmit`,
and `vite build` then emits the bundle. `apps/web/public` is copied into that
output, and `build.sourcemap` is enabled in `apps/web/vite.config.ts`.

The output lands in `apps/api/public`, which `apps/api/.gitignore` ignores, so
the bundle is never committed. The Worker serves that directory, which makes the
web build the only thing that updates what the deployed API serves. The root
`postbuild` script also copies `CHANGELOG.md` into that same directory.

There is no watch build here. `npm run dev --workspace apps/web` starts the Vite
dev server, which serves from memory and writes nothing to `apps/api/public`.

## Testing

The Vitest configuration is the `test` block inside `apps/web/vite.config.ts`,
using vite's `defineConfig`. This workspace has no `vitest.config.ts`. Tests run
in `jsdom` with `globals: true`, and `apps/web/vitest-setup.ts` is the setup
file: it registers the jest-dom matchers and calls `cleanup()` in an
`afterEach`.

The root `vitest.config.ts` picks this workspace up through the apps glob in its
`projects` array, so the root `npm run test` does include it.

Test directories that exist: `apps/web/src/components/__tests__`,
`apps/web/src/hooks/__tests__`, and `apps/web/src/utils/__tests__`. There are no
tests under `src/pages`, `src/contexts`, or `src/compatibility`.

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

1. Building this workspace overwrites the Worker's asset directory. The output
   path is `../api/public`, set in the `build` script of
   `apps/web/package.json`, not a local `dist`.
2. `@repo/shared` and `@repo/api-handlers` resolve through their `exports` maps
   to their `dist` directories, so a stale or missing dependency build makes a
   typecheck here meaningless. `apps/web/turbo.json` declares `dependsOn:
["^build"]` for `dev` and `build`, so going through Turbo handles it and a
   direct `npm run --workspace` invocation does not.
3. The `@` alias lives in two files that must agree. Changing `paths` in
   `apps/web/tsconfig.app.json` without changing `resolve.alias` in
   `apps/web/vite.config.ts` breaks the runtime while the typecheck still
   passes, and the reverse breaks the typecheck while the app still runs.
4. `apps/web/src/hero.ts` is reachable only from CSS. `apps/web/src/globals.css`
   loads it with `@plugin './hero.ts'`, and no TypeScript module imports it, so
   it reads as dead code to anything following the import graph.
5. The theme name is a cross-file contract. `dark-purple` is defined in
   `apps/web/src/hero.ts` and applied as a class on the `<html>` element in
   `apps/web/index.html`; renaming one silently unstyles the app.
6. Two different `public` directories are in play. `apps/web/public` is source,
   copied into the bundle; `apps/api/public` is the build destination. Editing
   the latter is editing generated output.
7. The API base URL flips on an env var. `apps/web/src/utils/api.ts` rewrites the
   origin's port to 8787 when `VITE_APP_ENV` is `local`, which
   `apps/web/.env.local` sets, and otherwise calls same-origin `/`. The same
   variable disables Sentry in `apps/web/src/main.tsx`.
8. Sentry upload is opt-in at build time. `sentryVitePlugin` is only added to the
   plugin list when `WITH_SENTRY` is set, so a plain `build` produces sourcemaps
   but uploads nothing.

## Boundaries

Depends on:

- `@repo/shared`, for domain classes, types, enums, constants, and validators
- `@repo/api-handlers`, for the `ApiAppType` client contract only
- `@repo/oxlint`, `@repo/prettier`, `@repo/lint-staged`, for tooling config

Depended on by: nothing. The package is named `web`, is private, is unscoped,
and no workspace lists it as a dependency. It reaches `apps/api` as build
output, never as an import.

The graph enforces a one-way flow. This workspace imports from the shared
packages, and nothing imports back into it, so React and DOM types never leak
out of `apps/web`.
