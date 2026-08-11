# @repo/prettier (`packages/prettier`)

Shared Prettier configuration consumed by every other workspace in the monorepo.

## Purpose

Owns the single source of formatting truth: the `base` config object, the
Tailwind plugin factory, and a helper that merges config objects. Every
`prettier.config.js` in the repo is a thin re-export of what this workspace
provides.

Formatting values are changed here and nowhere else. Do not add per-workspace
overrides in a consumer's `prettier.config.js`; extend `base` in
`packages/prettier/configs.js` instead. This is plain ESM JavaScript with
hand-written type declarations, so no TypeScript source, no build step, and no
runtime code beyond config objects belong here.

## Layout

Config-only package with no `src/`. All files sit at the workspace root:

```
packages/prettier/
├── configs.js             # base config + makeTailwindConfig factory
├── configs.d.ts           # hand-written types for configs.js
├── utils.js               # combineConfigs merge helper
├── utils.d.ts             # hand-written types for utils.js
├── prettier.config.js     # this workspace formatting itself
└── lint-staged.config.js  # this workspace's staged-file hook
```

## Commands

This workspace's `package.json` has no `scripts` key at all.

| Task          | Command                      | Notes                                                             |
| ------------- | ---------------------------- | ----------------------------------------------------------------- |
| Format repo   | `npm run format` (repo root) | Root script, runs `prettier --write` across the repo              |
| Format staged | via `.husky/pre-commit`      | `npx lint-staged` applies this workspace's config to staged files |

Absent by design: there is no `build`, `check-types`, `lint`, `test`, or `dev`
script here. The root turbo tasks fan out to workspace scripts, so every
`turbo run` task skips this workspace entirely.

## Module resolution and imports

There is no `tsconfig.json` in this workspace, so no `moduleResolution` setting
governs it. Resolution is plain Node ESM: `package.json` sets `"type": "module"`,
and relative imports need an explicit `.js` extension, as in
`packages/prettier/prettier.config.js`.

The `exports` map defines exactly two subpaths, `./configs` and `./utils`.
Consumers import them by subpath with no file extension:

```js
import { base, makeTailwindConfig } from '@repo/prettier/configs';
import { combineConfigs } from '@repo/prettier/utils';
```

Anything not listed in that map is unreachable from other workspaces. Import
ordering inside the repo is applied by the sort-imports plugin that `base`
registers.

## Testing

Not applicable: this workspace has no test config and no test files. It is
absent from the `projects` array in the root `vitest.config.ts`, so the root
`npm run test` never picks it up, and `./packages/prettier/**` is listed in that
file's coverage `exclude` array deliberately.

## Lint and format

There is no oxlint config in this workspace, so oxlint's shared presets do not
apply here. `packages/prettier/lint-staged.config.js` re-exports only the
`prettier` group from `packages/lint-staged/configs.js`, which means staged
files here get `prettier --write` but not `oxlint --fix` or `vitest related`,
unlike most other workspaces.

`packages/prettier/prettier.config.js` re-exports `base`, so this workspace
formats itself with the config it publishes.

## Gotchas

1. `packages/prettier/configs.d.ts` declares `makeReactConfig`, but
   `packages/prettier/configs.js` exports `makeTailwindConfig`. The declared name
   does not exist at runtime, and the real export has no type. Fix the
   declaration rather than renaming the runtime export, since
   `apps/web/prettier.config.js` imports the runtime name.
2. `packages/prettier/utils.d.ts` types `combineConfigs` as taking a single
   `Config[]` argument, while `packages/prettier/utils.js` implements it as
   variadic. Callers pass positional arguments, matching the implementation and
   not the declaration.
3. That same declaration has no `export` keyword, and the file's top-level
   `import` makes it a module, so `combineConfigs` is not actually exported as a
   type at all.
4. No workspace declares `@repo/prettier` in its `package.json` dependencies,
   yet every workspace imports it. Resolution works only through the npm
   workspace symlink in the root `node_modules`. Adding the dependency where it
   is used is the correct fix.
5. `apps/web/prettier.config.js` calls `makeTailwindConfig` with one argument,
   so the `tailwindConfig` key in the returned object is `undefined`. Only the
   `apps/web/src/globals.css` stylesheet path is actually passed.
6. `combineConfigs` concatenates `plugins` but shallow-overwrites every other
   key, so a later config's `overrides` array would replace the earlier one
   wholesale rather than merging.
7. `packages/prettier/lint-staged.config.js` imports from `@repo/lint-staged`
   while `packages/lint-staged/prettier.config.js` imports from `@repo/prettier`.
   The two config packages depend on each other, so a breaking change to either
   export map affects both.

## Boundaries

Depends on: `@repo/lint-staged`, for its own staged-file config only.

Depended on by: every other workspace, `apps/api`, `apps/web`,
`packages/api-handlers`, `packages/lint-staged`, `packages/oxlint`,
`packages/shared`, plus the repo-root `prettier.config.js`.

This workspace sits at the bottom of the dependency graph and must never import
application or domain code. See `docs/architecture.md` for the full monorepo map.
