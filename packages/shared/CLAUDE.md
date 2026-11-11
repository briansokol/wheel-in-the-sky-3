# @repo/shared (`packages/shared`)

Framework-agnostic wheel domain logic consumed by the web app.

## Purpose

Holds the wheel model and everything a future backend would need to agree on:
the `Config` and `WheelManager` classes, color math, Zod schemas, enums, shared
types, and the share-link codec. The browser bundle imports this package today,
and it must stay importable by a server later, so code here must not touch the
DOM, `window`, or Node built-ins (its tsconfig has no Node types, which applies
to tests too). React components do not go here; they go in
`apps/web/src/components/`.

## Layout

```
packages/shared/
├── src/
│   ├── classes/      # Config, Segment, WheelManager; tests in __tests__/
│   ├── constants/    # default colors, select options, and size limits (limits.ts)
│   ├── enums/        # PageColorType, WheelColorType
│   ├── types/        # type declarations, plus some runtime defaults
│   ├── utils/        # color and config helpers, plus the share-link pipeline; tests in __tests__/
│   └── validators/   # Zod schemas, including hex-color.ts and wire-config.ts
└── (root)            # package.json, tsconfig.json, and the tool configs
```

Each directory under `src/` is a subpath in the `exports` map of
`packages/shared/package.json`. Adding a new top-level directory requires adding
a matching `exports` entry, or consumers cannot import from it.

## Commands

| Task        | Command                                     | Notes                                                              |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------ |
| Build       | `npm run build --workspace packages/shared` | `tsc && tsc-alias`; also runs first under the root `npm run build` |
| Watch build | `npm run dev --workspace packages/shared`   | One `tsc` pass, then `tsc -w` and `tsc-alias -w` concurrently      |
| Lint        | `npm run lint --workspace packages/shared`  | `oxlint .`                                                         |
| Test        | `npm run test` from the repo root           | No `test` script exists here; see Testing                          |

`packages/shared/package.json` defines only `build`, `build:with-sentry` (an
alias for `build`), `dev`, and `lint`. Notably absent: `check-types`, `test`,
`test:ci`, and `types`. The root `npm run check-types` runs
`turbo run check-types`, which therefore skips this workspace; its types are
checked only as a side effect of `build`.

## Share-link pipeline

| File                        | Role                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `utils/encoding.ts`         | `encodeConfig` and `decodeConfig`: `v5.` prefix, `deflate-raw`, base64url, size caps |
| `utils/wire-config.ts`      | `toWireConfig` and `fromWireConfig`: `Config` to and from the compact payload        |
| `utils/form-config.ts`      | `configFromFormInputs`: validates config-form values and builds a `Config`           |
| `validators/wire-config.ts` | `wireConfigSchema`, applied to every decoded link                                    |
| `validators/hex-color.ts`   | `hexColorSchema`, the one hex color rule                                             |
| `constants/limits.ts`       | Size limits shared by the form schema, the payload schema, and the codec             |

Every decode goes through `wireConfigSchema`; never `JSON.parse` a link payload
and trust it. Changing the payload shape means a new version prefix.

## Module resolution and imports

`moduleResolution` is `nodenext` (`packages/shared/tsconfig.json`), so every
relative and aliased import inside `src/` needs an explicit `.js` extension even
though the source is `.ts`. See `packages/shared/src/classes/config.ts`.

The `@/*` alias maps into `packages/shared/src/` and is internal to this
workspace only. `tsc` does not rewrite it, which is why `tsc-alias` is the second
build stage; `packages/shared/vitest.config.ts` re-declares the same alias so
tests resolve it.

Consumers import through the `exports` map and write **no** extension, for
example `@repo/shared/classes/config`. The map appends `.js` itself, so adding
one produces a doubled extension that fails to resolve.

Import ordering is owned by the Prettier sort-imports plugin.

## Build output and consumption

`tsc && tsc-alias`: the first stage emits JavaScript, declarations, declaration
maps, and source maps; the second rewrites `@/` aliases in that output into
relative paths. Because `include` is `./src/**/*` and `outDir` is `dist`, the
output lands under `packages/shared/dist/src/`, mirroring the source tree, which
is exactly what each `exports` subpath points at.

`apps/web` resolves built output, not source. A stale or missing `dist` makes
its typecheck meaningless, so build this workspace before typechecking or
building it. `npm run dev --workspace packages/shared`
keeps `dist` current while working across workspaces.

`build:with-sentry` only runs `build`; it exists so the root
`turbo run build:with-sentry` reaches this workspace. Nothing here uploads
source maps.

## Testing

`packages/shared/vitest.config.ts` uses `defineConfig`, sets `globals: true`, and
declares the `@` alias. There is no setup file. The workspace is registered in
the `projects` array of the root `vitest.config.ts`, so the root `npm run test`
and `npm run test:ci` do run these tests; there is no local `test` script to run
them from inside the workspace.

Tests live in `__tests__/` directories beside the code they cover, named
`<subject>.test.ts`: `packages/shared/src/classes/__tests__/` and
`packages/shared/src/utils/__tests__/`. The `classes/` and `utils/` directories
have tests; `constants/`, `enums/`, `types/`, and `validators/` do not.

This workspace is not in the root coverage `exclude` array, so it is measured.

## Lint and format

`packages/shared/oxlint.config.ts` extends the `base` and `react` presets from
`@repo/oxlint` and declares no ignore patterns. `packages/shared/prettier.config.js`
re-exports the shared `base` config unchanged.

## Gotchas

1. `dist` is never cleaned: `build` is `tsc && tsc-alias` with no clean step, so
   files deleted from `src/` linger in output and stay resolvable through the
   `exports` map. `packages/shared/dist/src/types/index.js` exists even though
   no `index.ts` remains in `packages/shared/src/types/`.
2. The ambient module augmentation in `packages/shared/src/types/css.d.ts`, which
   widens React's `CSSProperties` to accept `--custom` properties, is not emitted
   to `dist`; `tsc` does not copy declaration inputs to `outDir`. Consumers do not
   inherit it through the package and must declare it themselves.
3. Test files compile into the published output because `include` covers all of
   `src/`, producing directories such as `packages/shared/dist/src/classes/__tests__/`.
4. `types/` is not purely types. `packages/shared/src/types/wheel-colors.ts`
   exports the runtime constant `defaultWheelColorConfig`, so a
   `import type` on that subpath drops a value some code depends on.
5. The `exports` map is wildcard-based per directory, so a new file is importable
   immediately but a new directory is not until `packages/shared/package.json`
   gains an entry for it.
6. `react` is a runtime dependency here purely for the `css.d.ts` augmentation.
   Do not read that as license to add React code to this workspace.

## Boundaries

Depends on: no other `@repo/*` workspace. This is a leaf, and it must stay one.

Depended on by: `apps/web`, which declares `@repo/shared` in its
`package.json`.

Dependency direction is one-way. Nothing here may import from `apps/` or from
another package, which is what keeps the same domain logic loadable in a
browser bundle today and in a backend later.
