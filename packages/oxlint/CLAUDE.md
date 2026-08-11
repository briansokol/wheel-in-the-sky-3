# @repo/oxlint (`packages/oxlint`)

Publishes the shared oxlint presets that every linted workspace in the monorepo
extends.

## Purpose

This workspace owns repo-wide lint rule selection: the plugin list, the category
severities, and the rule overrides that make up the `base` and `react` presets.
A rule changed here reaches every consuming workspace.

Only oxlint presets belong here. Prettier config lives in `packages/prettier`
and lint-staged config in `packages/lint-staged`; this workspace re-exports both
for its own use and adds nothing to them. A pattern that only one workspace
needs to ignore goes in that workspace's own `oxlint.config.ts`, the way
`apps/api/oxlint.config.ts` does, not into `base`.

## Layout

There is no `src/`. Every file sits at the workspace root.

```
packages/oxlint/
├── index.js               # the presets: `base` and `react`
├── index.d.ts             # hand-written declarations for index.js
├── oxlint.config.ts       # lints this workspace, extends `base`
├── prettier.config.js     # re-export of @repo/prettier
└── lint-staged.config.js  # re-export of @repo/lint-staged
```

A new preset is a new named export in `packages/oxlint/index.js` plus a matching
line in `packages/oxlint/index.d.ts`. It is not a new file.

## Commands

| Task                 | Command                                    | Notes                                                     |
| -------------------- | ------------------------------------------ | --------------------------------------------------------- |
| Lint this workspace  | `npm run lint --workspace packages/oxlint` | Runs `oxlint .`                                           |
| Lint every workspace | `npm run lint` from the repo root          | `turbo run lint`, which skips workspaces lacking the task |

`lint` is the only key in the `scripts` object of
`packages/oxlint/package.json`. There is no `build`, `check-types`, `types`,
`dev`, or `test:ci` script here, so the root turbo tasks of those names pass
this workspace over entirely. There is no `test` script either; see Testing.

## Module resolution and imports

This workspace has no `tsconfig.json`, so no `moduleResolution` setting governs
it. `packages/oxlint/package.json` sets `"type": "module"`, which makes
`index.js` native ESM, and relative imports carry an explicit extension:
`packages/oxlint/oxlint.config.ts` imports `./index.js`.

The `exports` map exposes exactly one subpath, `.`, resolving types to
`index.d.ts` and runtime to `index.js`. Consumers therefore write:

```ts
import { base, react } from '@repo/oxlint';
```

Import ordering is owned by the Prettier sort-imports plugin.

## Testing

Not applicable: `packages/oxlint/package.json` declares no `test` script, the
workspace holds no `__tests__` directory, and the `projects` array in the root
`vitest.config.ts` lists only the `apps` workspaces plus `packages/shared` and
`packages/api-handlers`, so the root `npm run test` never reaches it. That same
file names this workspace in its coverage `exclude` array deliberately.

## Lint and format

`packages/oxlint/oxlint.config.ts` extends `base` alone, so this workspace lints
itself with the preset it publishes. `base` carries the only ignore pattern,
`dist/**`. Prettier and lint-staged re-export the shared configs unchanged, so
neither is a local override.

## Gotchas

1. Nothing declares `@repo/oxlint` as a dependency, in either direction. Every
   consumer imports it from its `oxlint.config.ts` while listing it in no
   `package.json`, and `packages/oxlint/prettier.config.js` and
   `packages/oxlint/lint-staged.config.js` likewise import `@repo/prettier` and
   `@repo/lint-staged` without `packages/oxlint/package.json` declaring either.
   Resolution works only through the npm workspaces root symlink.
2. The export map shape differs from its siblings. `@repo/oxlint` exposes only
   `.`, while `packages/prettier/package.json` and
   `packages/lint-staged/package.json` both expose `./configs`. Writing
   `@repo/oxlint/configs` fails to resolve.
3. `packages/oxlint/index.d.ts` is hand-written and nothing checks it against
   `packages/oxlint/index.js`. With no `tsconfig.json` and no `check-types`
   script here, a preset added to the runtime file but missed in the declaration
   file surfaces only when some other workspace typechecks.
4. `base` does not enable the React plugin and `react` sets no category
   severities, so a React workspace needs both, in that order, as in
   `apps/web/oxlint.config.ts`. Extending `react` alone silently drops the
   correctness and suspicious categories.
5. The `react` preset pins a React major in `settings.react` inside
   `packages/oxlint/index.js`. Upgrading React in `apps/web` without editing
   that field leaves the react rules resolving against the old major.
6. `turbo run lint` does not cover every workspace holding an oxlint config.
   `packages/lint-staged/oxlint.config.ts` exists, yet
   `packages/lint-staged/package.json` declares no `lint` script, and
   `packages/prettier` has neither. A rule added here never runs against them.
7. The `lint` script passes no `-c`, so oxlint discovers `oxlint.config.ts`
   relative to the current directory. Invoking oxlint from the repo root against
   a workspace path applies the defaults, not that workspace's preset.

## Boundaries

Depends on: `oxlint` only, as declared. It also imports `@repo/prettier` and
`@repo/lint-staged` at config load time without declaring them, per gotcha 1.

Depended on by: `apps/web`, `apps/api`, `packages/shared`,
`packages/api-handlers`, and `packages/lint-staged`, each through its own
`oxlint.config.ts`.

`packages/oxlint/index.js` imports from `oxlint` and nothing else. It must not
reach into application or domain code, because every workspace's lint task
resolves this module and would otherwise gain a build dependency on that code.
