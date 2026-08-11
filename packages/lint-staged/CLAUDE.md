# @repo/lint-staged (`packages/lint-staged`)

Shared lint-staged command groups that every workspace's `lint-staged.config.js`
composes into its own pre-commit behavior.

## Purpose

Owns the mapping from staged-file glob to shell command: which extensions get
`oxlint --fix`, which get `prettier --write`, and which get
`vitest related --run`. It also owns `combineConfigs`, the helper consumers call
to merge the groups they want.

Rule selection belongs in `packages/oxlint` and formatting values belong in
`packages/prettier`; only the glob-to-command wiring and the merge helper belong
here. A workspace that needs a different set of groups composes them in its own
`lint-staged.config.js` rather than adding a group to this package.

## Layout

Config-only package with no `src/`. Every file sits at the workspace root.

```
packages/lint-staged/
├── configs.js             # the groups: oxlint, prettier, vitest
├── configs.d.ts           # hand-written declarations for configs.js
├── utils.js               # combineConfigs merge helper
├── utils.d.ts             # hand-written declaration for utils.js
├── oxlint.config.ts       # lints this workspace, re-export of @repo/oxlint
├── prettier.config.js     # re-export of @repo/prettier
└── lint-staged.config.js  # this workspace's own staged-file hook
```

A new group is a new named export in `packages/lint-staged/configs.js` plus a
matching line in `packages/lint-staged/configs.d.ts`. It is not a new file.

## Commands

`packages/lint-staged/package.json` has no `scripts` key at all, so there is
nothing to run inside this workspace.

| Task                | Command                         | Notes                                                                    |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| Run the staged hook | `npx lint-staged` from the root | What `.husky/pre-commit` invokes; discovers the nearest workspace config |

Absent here: `build`, `check-types`, `types`, `lint`, `dev`, `test`, and
`test:ci`. The root turbo tasks fan out to workspace scripts, so every
`turbo run` task in `turbo.json` passes this workspace over entirely.

## Module resolution and imports

This workspace has no `tsconfig.json`, so no `moduleResolution` setting governs
it. Resolution is plain Node ESM: `package.json` sets `"type": "module"`, and
relative imports carry an explicit `.js` extension, as in
`packages/lint-staged/lint-staged.config.js`, which imports `./configs.js` and
`./utils.js`.

The `exports` map defines two subpaths, `./configs` and `./utils`, with no
`types` condition, so TypeScript consumers get types only from the sibling
`.d.ts` files. Consumers import by subpath with no extension:

```js
import { oxlint, prettier, vitest } from '@repo/lint-staged/configs';
import { combineConfigs } from '@repo/lint-staged/utils';
```

Import ordering is owned by the Prettier sort-imports plugin.

## Testing

Not applicable: there is no test script and no `__tests__` directory here. The
`projects` array in the root `vitest.config.ts` lists only the `apps`
workspaces, `packages/shared`, and `packages/api-handlers`, so `npm run test` never
reaches this workspace, and `./packages/lint-staged/**` sits in that same file's
coverage `exclude` array deliberately.

## Lint and format

`packages/lint-staged/oxlint.config.ts` re-exports `base` from `@repo/oxlint`
and adds no local ignore patterns.
`packages/lint-staged/prettier.config.js` re-exports `base` from
`@repo/prettier/configs`, so neither tool is locally overridden.

This workspace's own `packages/lint-staged/lint-staged.config.js` combines the
`oxlint` and `prettier` groups but not `vitest`, matching the absence of tests
here.

## Gotchas

1. The `oxlint` and `vitest` groups in `packages/lint-staged/configs.js` use the
   identical glob key, so `combineConfigs` merges them into one command array
   and the argument order at the call site decides execution order. The
   `prettier` group's glob differs, so it stays a separate entry and its
   position among the arguments changes nothing.
2. The `prettier` group's glob omits `jsx`, `mjs`, `cjs`, and `jsonc` while the
   `oxlint` and `vitest` globs include `jsx`, so a staged `apps/api/wrangler.jsonc`
   gets no formatting on commit, and a `.jsx` file would be linted and tested but
   never formatted. See `packages/lint-staged/configs.js`.
3. `packages/lint-staged/utils.d.ts` declares `combineConfigs` as taking a single
   array argument and omits the `export` keyword, while
   `packages/lint-staged/utils.js` implements it variadic and exported. The
   declaration is therefore a global ambient script with the wrong signature, and
   every call site passes positional arguments that match the implementation, not
   the declaration.
4. There is no root lint-staged config, so `npx lint-staged` in
   `.husky/pre-commit` relies on per-directory discovery. A staged file that has
   no workspace `lint-staged.config.js` above it, such as the root
   `package.json`, `CHANGELOG.md`, or anything under `docs/`, runs no hook at all.
5. Nothing declares this package as a dependency in either direction. Every
   consumer's `lint-staged.config.js` imports `@repo/lint-staged/configs` while no
   consumer `package.json` lists it, and `packages/lint-staged/package.json`
   declares neither `@repo/oxlint` nor `@repo/prettier` despite importing both.
   Resolution works only through the npm workspaces root symlink.
6. With no `scripts` key and no `tsconfig.json` here, nothing lints or
   typechecks this workspace outside of a commit that stages its files, even
   though `packages/lint-staged/oxlint.config.ts` exists. A wrong `.d.ts` surfaces
   only when another workspace typechecks.

## Boundaries

Depends on: `lint-staged`, the only declared dependency, plus `@repo/oxlint` and
`@repo/prettier` imported at config load time without being declared.

Depended on by: `apps/web`, `apps/api`, `packages/shared`,
`packages/api-handlers`, `packages/oxlint`, and `packages/prettier`, each through
its own `lint-staged.config.js`.

This workspace must never import application or domain code, because every
workspace's pre-commit hook loads it. Note the cycle the current graph allows:
`packages/prettier/lint-staged.config.js` imports from here while
`packages/lint-staged/prettier.config.js` imports from `@repo/prettier`.
