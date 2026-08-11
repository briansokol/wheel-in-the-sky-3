# @repo/api-handlers (`packages/api-handlers`)

The Hono application: every API route the Worker serves, plus the exported route
type that gives `apps/web` a typed client.

## Purpose

Owns the Hono app instance, its middleware, its route modules, and the
`ApiAppType` contract consumers use for RPC typing. Wheel domain logic does not
go here; it goes in `packages/shared/src/` and is imported. Worker
configuration, bindings, and deploy concerns do not go here either; those belong
to `apps/api`.

## Layout

```
packages/api-handlers/
├── src/
│   ├── client/            # type-only surface: re-exports the route type
│   ├── server/            # Hono app, middleware, route modules
│   │   └── __tests__/     # route-level tests
│   └── utils/             # framework-agnostic helpers used by routes
│       └── __tests__/     # helper tests
└── dist/                  # tsc output; the exports map resolves into here
```

New routes are a module under `packages/api-handlers/src/server/` mounted onto
`honoApp` in `packages/api-handlers/src/server/index.ts`.

## Commands

Run from the repository root.

| Task           | Command                                                       | Notes                                            |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Build          | `npm run build --workspace packages/api-handlers`             | `tsc && tsc-alias`, two stages                   |
| Build + Sentry | `npm run build:with-sentry --workspace packages/api-handlers` | build, then uploads source maps                  |
| Watch          | `npm run dev --workspace packages/api-handlers`               | one `tsc` pass, then `tsc -w` and `tsc-alias -w` |
| Lint           | `npm run lint --workspace packages/api-handlers`              | `oxlint .`                                       |
| Source maps    | `npm run sentry:sourcemaps --workspace packages/api-handlers` | acts on `dist`                                   |

Scripts an agent may expect here and will not find in
`packages/api-handlers/package.json`: `check-types`, `test`, `test:ci`, `types`,
and `deploy`. Tests run from the root; typechecking happens only as part of the
build.

## Module resolution and imports

`moduleResolution` is `nodenext` (`packages/api-handlers/tsconfig.json`), so
intra-package imports carry an explicit `.js` extension in `.ts` source. See the
`@/types.js` and `@/utils/encoding.js` imports in
`packages/api-handlers/src/server/encoding.ts`.

The `@/*` alias resolves to files under `packages/api-handlers/src/` and is
package-local. It is declared three times and all three must agree: `paths` in
`packages/api-handlers/tsconfig.json`, `resolve.alias` in
`packages/api-handlers/vitest.config.ts`, and `tsc-alias`, which rewrites it to
relative paths in the emitted output.

Other workspaces import `@repo/api-handlers/server` or
`@repo/api-handlers/client`. There is no root export. Import ordering is owned
by the Prettier sort-imports plugin.

## Build output and consumption

`tsc` emits declarations and JavaScript; `tsc-alias` then rewrites the `@/*`
specifiers left in that output, which is why the build is two commands rather
than one. Because `include` is `["src"]` and `outDir` is `dist`, output lands at
`dist/src/...`, which is exactly what the `exports` map in
`packages/api-handlers/package.json` points at. Test files compile into `dist`
along with everything else.

Consumers resolve built output, not source. A stale `dist` means `apps/api` and
`apps/web` typecheck against old declarations and still pass. Rebuild this
workspace, or leave the watch script running, before trusting a consumer's
typecheck.

## Testing

`packages/api-handlers/vitest.config.ts` uses `defineProject`, enables
`globals`, and excludes `dist`, `coverage`, and `node_modules`. There is no
setup file.

The workspace is listed in the `projects` array of the root
`vitest.config.ts`, so root `npm run test` and `npm run test:ci` do run it,
despite there being no local `test` script. It is not in the root coverage
`exclude` list, so its source counts toward coverage.

Tests live in `__tests__/` directories beside the code they cover:
`packages/api-handlers/src/server/__tests__/` and
`packages/api-handlers/src/utils/__tests__/`.

## Lint and format

`packages/api-handlers/oxlint.config.ts` extends the `base` preset from
`@repo/oxlint` and ignores `worker-configuration.d.ts`. That same file is listed
in `packages/api-handlers/.prettierignore`.

## Gotchas

1. `packages/api-handlers/worker-configuration.d.ts` is generated elsewhere and
   copied in: `apps/api`'s `types` script runs `wrangler types` and copies the
   result over it. Edits here are overwritten, and the `Env` type behind
   `AppEnv` in `packages/api-handlers/src/types.ts` comes from that copy.
2. The `exports` map hardcodes `dist/src/server/index.js` and
   `dist/src/client/index.js`. Moving or renaming either source file changes the
   built path and silently breaks consumers at resolve time; update
   `packages/api-handlers/package.json` in the same change.
3. There is no `check-types` script here, so the root `npm run check-types` and
   the husky pre-commit hook skip this workspace entirely. Type errors surface
   only when someone builds it.
4. `@repo/shared` also ships from its own `dist`, so it must be built before
   this workspace. The root `npm run build` handles the order through turbo's
   `dependsOn: ["^build"]`; a bare `tsc` in this directory does not.
5. `packages/api-handlers/src/utils/assets.ts` is not reachable through the
   `exports` map and has no references anywhere in the repository.
6. CORS origin checking in `packages/api-handlers/src/server/index.ts` is a
   hardcoded hostname suffix plus an `APP_ENV === 'local'` escape hatch. A new
   deploy hostname needs that predicate edited.

## Boundaries

Depends on: `@repo/shared`, plus `hono`, `zod`, and `@sentry/cloudflare` at
runtime.

Depended on by: `apps/api`, which imports `app` from `@repo/api-handlers/server`
in `apps/api/src/index.ts`; and `apps/web`, which imports the `ApiAppType` type
from `@repo/api-handlers/client` in `apps/web/src/utils/api.ts`.

The dependency arrow only points outward. Nothing under `src/` imports from
`apps/`, and domain behavior is pulled from `@repo/shared` rather than
reimplemented here.
