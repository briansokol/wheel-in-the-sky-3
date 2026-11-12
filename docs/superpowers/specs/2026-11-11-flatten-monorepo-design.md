# Flatten the monorepo into a single app

**Date:** November 11, 2026
**Status:** Approved design, pending implementation plan

## Goal

The server was removed in #39, which leaves `apps/web` as the only deployable
workspace. The Turborepo and npm-workspaces setup no longer pays for itself.
This change moves the web app to the repository root, merges
`packages/shared` into its `src/`, and replaces the three tooling packages
(`@repo/oxlint`, `@repo/prettier`, `@repo/lint-staged`) with one root config
file each, containing only the rules the app uses.

## Decisions

- **Location:** the app lives at the repository root. `apps/` and `packages/`
  are deleted.
- **Domain boundary:** shared code is flattened into the existing `src/`
  folders. The rule that domain code must stay free of React and DOM APIs is
  dropped, because its stated reason was reuse by a backend.
- **Delivery:** one branch and one pull request, built from a few ordered
  commits. Each commit must leave the build working.

## Target layout

```
/
├── src/                  apps/web/src + packages/shared/src, flattened
├── public/               apps/web/public
├── index.html
├── vite.config.ts
├── vitest-setup.ts
├── wrangler.jsonc
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── oxlint.config.ts
├── prettier.config.js
├── lint-staged.config.js
└── package.json          single manifest, no "workspaces" field
```

All moves use `git mv` so that `git log --follow` keeps file history.

## Package manifest

The root `package.json` keeps its `name`, `version`, `license`, `type`,
`engines`, `packageManager`, and `allowScripts` fields. It gains the
following:

- All `dependencies` and `devDependencies` from `apps/web/package.json`,
  except `@repo/shared`.
- `zod` from `packages/shared`. Its `@ctrl/tinycolor`, `nanoid`, and `react`
  dependencies already exist in the web app at the same versions.
- `lint-staged` from `@repo/lint-staged`.
- `@trivago/prettier-plugin-sort-imports`, `prettier-plugin-packagejson`, and
  `prettier-plugin-tailwindcss` from `@repo/prettier`.

It removes `workspaces`, `turbo`, and `sherif`. The shared-only packages
`tsc-alias` and `concurrently` are not carried over.

The scripts are plain commands with no Turborepo indirection:

| Script              | Command                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `dev`               | `vite --host`                                                             |
| `build`             | `tsc -b && vite build`                                                    |
| `build:with-sentry` | `cross-env WITH_SENTRY=true npm run build`                                |
| `check-types`       | `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json` |
| `lint`              | `oxlint .`                                                                |
| `test`              | `vitest`                                                                  |
| `test:ci`           | `vitest run --coverage`                                                   |
| `preview`           | `vite preview`                                                            |
| `deploy`            | `wrangler deploy`                                                         |
| `format`            | `prettier --write "**/*.{ts,tsx,md,css}"`                                 |
| `prepare`           | `husky`                                                                   |
| `ncu`               | `npx ncu --interactive --install=never`                                   |

`package-lock.json` is regenerated with `npm install`.

## Source merge

Every file in `packages/shared/src/` moves to the same relative path under
`src/`. No paths collide. `src/types/css.d.ts` is still covered by the
`include: ["src", "vitest-setup.ts"]` entry in `tsconfig.app.json`.

Two scripted import rewrites follow the move:

1. In former web code, `@repo/shared/<dir>/<file>` becomes `@/<dir>/<file>`.
2. In former shared code, the `.js` suffix is removed from `@/` imports, so
   `@/utils/colors.js` becomes `@/utils/colors`. The suffix existed only for
   NodeNext resolution in the shared `tsc` build.

After the rewrite, `prettier --write` reorders the moved imports into the `@/`
group. A search for `@repo/` and for `@/` imports ending in `.js` must return
no results.

`packages/shared/tsconfig.json`, `packages/shared/vitest.config.ts`, and the
shared `dist/` build are deleted. Vite's `build.sourcemap: true` already
produces the source maps that Sentry uses.

## Tooling configs

Each tool gets one self-contained root file. The `combineConfigs` helpers in
`@repo/prettier/utils` and `@repo/lint-staged/utils` are deleted.

**`oxlint.config.ts`** is one `defineConfig` call that merges the existing
`base` and `react` presets:

- plugins `typescript`, `unicorn`, and `react`
- categories `correctness: 'error'` and `suspicious: 'warn'`
- rule `react/react-in-jsx-scope: 'off'`
- env `builtin` and `browser`
- setting `react.version: '19'`
- an override that adds the `vitest` plugin for `*.test.*` and `*.spec.*` files
- `ignorePatterns` for `dist/**` and `coverage/**`

**`prettier.config.js`** holds the existing `base` options and these plugins,
in this order: `prettier-plugin-packagejson`,
`@trivago/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss`. The
Tailwind plugin must be last. The config sets
`tailwindStylesheet: './src/globals.css'`. The `tailwindConfig` key is
omitted, because the current config always passes `undefined` for it.

**`lint-staged.config.js`** is a literal object:

```js
export default {
  '*.{js,jsx,ts,tsx}': ['oxlint --fix', 'prettier --write', 'vitest related --run'],
  '*.{css,scss,json,md,yaml,yml}': 'prettier --write',
};
```

This object runs the same commands on the same file types as the current
combined config.

**`vite.config.ts`** absorbs the coverage settings from the root
`vitest.config.ts`: the `v8` provider and the exclude list, minus the
`packages/*` entries, with `apps/web/src/...` paths rewritten to `src/...`.
The root `vitest.config.ts` and its `projects` list are deleted.

## Other deleted files

- `turbo.json` and `apps/web/turbo.json`
- `apps/web/.nvmrc`, which duplicates the root `.nvmrc`
- `apps/web/.gitignore`, whose entries merge into the root `.gitignore`
- the per-workspace `oxlint.config.ts`, `prettier.config.js`, and
  `lint-staged.config.js` files in each package
- `packages/prettier/README.md`
- all five workspace `CLAUDE.md` files

## Git hook and CI

`.husky/pre-commit` drops `npm run sherif`. It runs `npm run check-types`, then
`npx lint-staged`.

In `.github/workflows/`, every file is read during implementation. The known
changes are as follows:

- `reusable-setup-build-test.yaml` removes the "Check Dependency Consistency"
  step and both `shared-dist` cache steps. The `apps/web/dist` cache paths
  become `dist`, and the `'**/node_modules'` cache path becomes `node_modules`.
- `reusable-deploy-worker.yaml` replaces `apps/web` paths and working
  directories with the root.

`.github/dependabot.yml` already targets `directory: /` and is unchanged.

## Documentation

- **`CLAUDE.md`** is rewritten for a single app. It removes the "Package
  context" table and the "Respect workspace boundaries" rule. It keeps the
  conventions and patterns, absorbs the still-relevant content of
  `apps/web/CLAUDE.md` and `packages/shared/CLAUDE.md`, and changes the install
  command to `npm install --save-exact <package>`. The forms pattern points to
  `src/validators/`.
- **`docs/architecture.md`** is rewritten as a map of `src/` and a "where code
  belongs" table. The table has no domain and UI split.
- **`README.md`**, **`.github/copilot-instructions.md`**, **`.vscode/settings.json`**,
  and **`.gitignore`** replace their monorepo, Turborepo, and `apps/web`
  references.
- **`CHANGELOG.md`** gets one entry recording the restructure.
- Plans and specs under `docs/superpowers/` are historical records and are not
  edited.

## Verification

Record the current test count for the web and shared projects before starting.
The change is complete when all of the following hold:

1. `npm ci` succeeds from a clean checkout.
2. `npm run check-types` and `npm run lint` pass.
3. `npm run test:ci` passes, and the test count equals the recorded web count
   plus the recorded shared count.
4. `npm run build` produces `dist/index.html`.
5. `npx wrangler deploy --dry-run` succeeds.
6. `npx prettier --check .` passes.
7. A commit triggers the pre-commit hook, and the hook succeeds.
8. A search for `@repo/`, `turbo`, `sherif`, `apps/web`, and `packages/`
   returns no results outside `docs/superpowers/`, `CHANGELOG.md`, and
   `package-lock.json`.

## Out of scope

- Changes to application behavior, components, or tests beyond import paths.
- Dependency version upgrades.
- Lint rules that enforce a domain boundary.
