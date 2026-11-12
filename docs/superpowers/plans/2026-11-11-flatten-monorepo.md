# Flatten the monorepo implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Turborepo and npm-workspaces monorepo with a single Vite app at the repository root, with `packages/shared` merged into `src/` and one self-contained root config per tool.

**Architecture:** Three commits on `chore/flatten-monorepo`. Task 1 merges `packages/shared` into `apps/web/src` while the monorepo still exists. Task 2 hoists `apps/web` to the root, inlines the tool configs, and deletes `packages/`, Turborepo, and sherif in one step, because the tool packages cannot resolve once workspaces are gone. Task 3 rewrites the docs. Each commit leaves the build, typecheck, and tests passing.

**Tech Stack:** npm 11, Node 24, Vite 7, Vitest 4, TypeScript 7, oxlint 1.92, Prettier 3.9, lint-staged 16, husky 9, wrangler 4, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-11-flatten-monorepo-design.md`

## Global constraints

- Use `git mv` for every moved file so that `git log --follow` keeps history.
- Do not change dependency versions. Copy versions verbatim from the existing manifests.
- Do not change application behavior. Source edits are limited to import specifiers and the `CHANGELOG.md?raw` relative path.
- Filenames stay kebab-case.
- Do not edit plans or specs under `docs/superpowers/` other than this plan's checkboxes.
- Baseline, recorded on November 11, 2026, from the root `npx vitest run`: **29 test files, 313 tests, all passing.** Every task must end with exactly these counts.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| Path after Task 2                                          | Source                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/**`                                                   | `apps/web/src/**` and `packages/shared/src/**`                       |
| `public/**`, `index.html`, `vitest-setup.ts`               | `apps/web/`                                                          |
| `vite.config.ts`                                           | `apps/web/vite.config.ts` plus coverage from root `vitest.config.ts` |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | `apps/web/`                                                          |
| `wrangler.jsonc`                                           | `apps/web/wrangler.jsonc`, `$schema` path changed                    |
| `oxlint.config.ts`                                         | new, replaces `@repo/oxlint`                                         |
| `prettier.config.js`                                       | new, replaces `@repo/prettier`                                       |
| `lint-staged.config.js`                                    | new, replaces `@repo/lint-staged`                                    |
| `package.json`                                             | root manifest merged with `apps/web/package.json`                    |
| `.env.local` (untracked)                                   | `apps/web/.env.local`                                                |

Deleted: `apps/`, `packages/`, `turbo.json`, root `vitest.config.ts`.

---

### Task 1: Merge `packages/shared` into `apps/web/src`

**Files:**

- Move: `packages/shared/src/**` to `apps/web/src/**` (same relative paths)
- Modify: every file under `apps/web/src/` that imports `@repo/shared/...`
- Modify: every moved shared file (strip `.js` from `@/` imports)
- Modify: `apps/web/package.json` (add `zod`, remove `@repo/shared`)
- Modify: `vitest.config.ts` (root, `projects` list)
- Modify: `.github/workflows/reusable-setup-build-test.yaml`, `.github/workflows/reusable-deploy-worker.yaml` (remove `shared-dist` cache steps)
- Delete: `packages/shared/`

**Interfaces:**

- Consumes: nothing.
- Produces: every domain module is importable as `@/<dir>/<file>` from `apps/web/src`, for example `@/classes/config`, `@/utils/encoding`, `@/validators/config`. No `@repo/shared` specifier remains anywhere.

- [ ] **Step 1: Confirm the baseline**

Run: `npx vitest run 2>&1 | grep -E "Test Files|Tests  "`
Expected:

```
 Test Files  29 passed (29)
      Tests  313 passed (313)
```

- [ ] **Step 2: Move the shared source files**

```bash
cd packages/shared/src
for f in $(git ls-files); do
  mkdir -p "../../../apps/web/src/$(dirname "$f")"
  git mv "$f" "../../../apps/web/src/$f"
done
cd ../../..
```

Expected: `git status` shows 30 renames into `apps/web/src/` and no "destination exists" errors. `apps/web/src/types/css.d.ts` exists.

- [ ] **Step 3: Rewrite `@repo/shared/` specifiers in web code**

```bash
grep -rl "@repo/shared/" apps/web/src | xargs perl -pi -e 's#\@repo/shared/#\@/#g'
```

This also rewrites the `vi.mock('@repo/shared/utils/encoding', ...)` call in `apps/web/src/hooks/__tests__/config.test.tsx`.

Run: `grep -rn "@repo/" apps/web/src`
Expected: no output.

- [ ] **Step 4: Strip `.js` suffixes from `@/` imports in the moved files**

```bash
git diff --cached --name-only --diff-filter=R -M | grep '^apps/web/src/' \
  | xargs perl -pi -e "s#(['\"]\@/[^'\"]+)\.js(['\"])#\$1\$2#g"
```

Run: `grep -rnE "['\"]@/[^'\"]+\.js['\"]" apps/web/src`
Expected: no output.

- [ ] **Step 5: Update `apps/web/package.json` dependencies**

In `dependencies`, delete the line `"@repo/shared": "*",` and add `"zod": "4.6.7",` in alphabetical position (after `"tailwindcss": "4.3.5"`). `@ctrl/tinycolor`, `nanoid`, and `react` are already present at the same versions.

- [ ] **Step 6: Point the root Vitest projects at the web app only**

In the root `vitest.config.ts`, change:

```ts
        projects: ['apps/*', 'packages/shared'],
```

to:

```ts
        projects: ['apps/*'],
```

- [ ] **Step 7: Remove the `shared-dist` cache steps from CI**

In `.github/workflows/reusable-setup-build-test.yaml`, delete the "Cache shared build directory" step in the `build` job and the "Restore shared build directory" step in the `unit-tests` job, including each step's preceding comment line. In `.github/workflows/reusable-deploy-worker.yaml`, delete the "Restore shared build directory" step and its comment. These steps use `fail-on-cache-miss: true`, so they fail once `packages/shared/dist` no longer exists.

Run: `grep -n "shared" .github/workflows/*.y*ml`
Expected: no output.

- [ ] **Step 8: Delete the rest of `packages/shared` and reinstall**

```bash
git rm -r packages/shared
rm -rf packages/shared
npm install
```

Expected: `npm install` exits 0, and `node_modules/@repo/shared` no longer exists.

- [ ] **Step 9: Format, then verify**

```bash
npx prettier --write apps/web/src
npm run check-types
npm run lint
npx vitest run 2>&1 | grep -E "Test Files|Tests  "
npm run build
```

Expected: typecheck and lint exit 0. Test output reads `29 passed (29)` and `313 passed (313)`. Build exits 0 and writes `apps/web/dist/index.html`.

If any former shared test fails only under the web app's `jsdom` environment, add `// @vitest-environment node` as the first line of that test file, re-run, and record the change in the commit message. Do not change test assertions.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: merge @repo/shared into the web app

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: the pre-commit hook (sherif, check-types, lint-staged) passes.

---

### Task 2: Hoist the web app to the root and inline the tool configs

**Files:**

- Move: `apps/web/{src,public,index.html,vite.config.ts,vitest-setup.ts,wrangler.jsonc,tsconfig.json,tsconfig.app.json,tsconfig.node.json}` to the root
- Move (untracked): `apps/web/.env.local` to `.env.local`
- Create: `oxlint.config.ts`, `prettier.config.js`, `lint-staged.config.js` at the root
- Modify: `package.json`, `vite.config.ts`, `wrangler.jsonc`, `.gitignore`, `.husky/pre-commit`, `src/pages/about-page.tsx:18`, `.github/workflows/reusable-setup-build-test.yaml`, `.github/workflows/reusable-deploy-worker.yaml`
- Delete: `apps/`, `packages/`, `turbo.json`, `vitest.config.ts`

**Interfaces:**

- Consumes: the Task 1 layout, with all domain code under `apps/web/src`.
- Produces: root scripts `dev`, `build`, `build:with-sentry`, `check-types`, `lint`, `test`, `test:ci`, `preview`, `deploy`, `format`, `prepare`, `ncu`. Build output in `./dist`.

- [ ] **Step 1: Move the app files to the root**

```bash
for f in src public index.html vite.config.ts vitest-setup.ts wrangler.jsonc tsconfig.json tsconfig.app.json tsconfig.node.json; do
  git mv "apps/web/$f" "$f"
done
mv apps/web/.env.local .env.local
```

Expected: no "destination exists" errors. `ls src/main.tsx .env.local` succeeds.

- [ ] **Step 2: Fix the `CHANGELOG.md` raw import**

In `src/pages/about-page.tsx`, change line 18 from:

```ts
import changelog from '../../../../CHANGELOG.md?raw';
```

to:

```ts
import changelog from '../../CHANGELOG.md?raw';
```

- [ ] **Step 3: Fix the wrangler schema path**

In `wrangler.jsonc`, change `"$schema": "../../node_modules/wrangler/config-schema.json"` to `"$schema": "./node_modules/wrangler/config-schema.json"`.

- [ ] **Step 4: Write the merged `package.json`**

Replace the root `package.json` with:

```json
{
  "name": "wheel-in-the-sky-3",
  "version": "3.0.0-SNAPSHOT",
  "private": true,
  "license": "AGPL-3.0-only",
  "type": "module",
  "scripts": {
    "build": "tsc -b && vite build",
    "build:with-sentry": "cross-env WITH_SENTRY=true npm run build",
    "check-types": "tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json",
    "deploy": "wrangler deploy",
    "dev": "vite --host",
    "format": "prettier --write \"**/*.{ts,tsx,md,css}\"",
    "lint": "oxlint .",
    "ncu": "npx ncu --interactive --install=never",
    "prepare": "husky",
    "preview": "vite preview",
    "test": "vitest",
    "test:ci": "vitest run --coverage"
  },
  "dependencies": {
    "@ctrl/tinycolor": "4.3.0",
    "@heroui/react": "3.2.7",
    "@heroui/styles": "3.2.7",
    "@hookform/resolvers": "5.9.2",
    "@internationalized/date": "3.12.4",
    "@react-aria/ssr": "3.10.1",
    "@react-aria/utils": "3.34.1",
    "@sentry/react": "10.70.0",
    "@uidotdev/usehooks": "2.4.1",
    "canvas-confetti": "1.9.4",
    "es-toolkit": "1.53.2",
    "framer-motion": "14.10.1",
    "nanoid": "5.1.16",
    "react": "19.3.1",
    "react-aria": "3.53.1",
    "react-aria-components": "1.22.1",
    "react-colorful": "5.8.1",
    "react-dom": "19.3.1",
    "react-hook-form": "7.91.0",
    "react-icons": "5.7.0",
    "react-markdown": "10.1.0",
    "react-router": "7.18.5",
    "seedrandom": "3.0.5",
    "tailwindcss": "4.3.5",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "@fontsource-variable/quicksand": "5.3.0",
    "@sentry/cli": "3.8.2",
    "@sentry/vite-plugin": "5.4.0",
    "@tailwindcss/vite": "4.3.5",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.3",
    "@trivago/prettier-plugin-sort-imports": "6.0.2",
    "@types/canvas-confetti": "1.9.0",
    "@types/node": "24.10.13",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@types/seedrandom": "3.0.8",
    "@vitejs/plugin-react": "5.1.4",
    "@vitest/coverage-v8": "4.1.12",
    "babel-plugin-react-compiler": "1.0.0",
    "cross-env": "10.1.0",
    "husky": "9.1.7",
    "jsdom": "31.0.0",
    "lint-staged": "16.2.7",
    "oxlint": "1.92.0",
    "postcss": "8.5.32",
    "prettier": "3.9.10",
    "prettier-plugin-packagejson": "3.1.0",
    "prettier-plugin-tailwindcss": "0.8.1",
    "typescript": "7.0.2",
    "vite": "7.3.8",
    "vitest": "4.1.12",
    "wrangler": "4.160.0"
  },
  "packageManager": "npm@11.10.1",
  "engines": {
    "node": "24.x"
  },
  "allowScripts": {
    "@sentry/cli@2.58.6": true,
    "@sentry/cli@3.6.2": true,
    "fsevents@2.3.3": true,
    "esbuild@0.28.2": true,
    "workerd@1.20261110.1": true
  }
}
```

Before saving, diff the dependency lists against `apps/web/package.json` and the deleted manifests (`git show HEAD:apps/web/package.json`, `git show HEAD:packages/prettier/package.json`, `git show HEAD:packages/lint-staged/package.json`). Every version must match. If Dependabot changed a version after November 11, 2026, use the version in `HEAD`.

- [ ] **Step 5: Write `oxlint.config.ts`**

```ts
import { defineConfig } from 'oxlint';

/**
 * @see https://oxc.rs/docs/guide/usage/linter/config.html
 */
export default defineConfig({
  plugins: ['typescript', 'unicorn', 'react'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
  env: {
    builtin: true,
    browser: true,
  },
  settings: {
    react: {
      version: '19',
    },
  },
  overrides: [
    {
      files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
      plugins: ['typescript', 'unicorn', 'react', 'vitest'],
    },
  ],
  ignorePatterns: ['dist/**', 'coverage/**'],
});
```

- [ ] **Step 6: Write `prettier.config.js`**

```js
/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
  // prettier-plugin-tailwindcss must be last.
  plugins: ['prettier-plugin-packagejson', '@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/globals.css',
  tabWidth: 4,
  printWidth: 120,
  trailingComma: 'es5',
  singleQuote: true,
  quoteProps: 'consistent',
  overrides: [
    {
      files: '*.{css,scss,md}',
      options: {
        tabWidth: 2,
      },
    },
    {
      files: '*.{json,jsonc}',
      options: {
        tabWidth: 2,
        trailingComma: 'none',
      },
    },
  ],
  importOrder: ['<BUILTIN_MODULES>', '<THIRD_PARTY_MODULES>', '<TYPE>^@/(.*)$', '^@/(.*)$', '<TYPE>^[./]', '^[./]'],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
};
```

- [ ] **Step 7: Write `lint-staged.config.js`**

```js
/**
 * @see https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
 */
export default {
  '*.{js,jsx,ts,tsx}': ['oxlint --fix', 'prettier --write', 'vitest related --run'],
  '*.{css,scss,json,md,yaml,yml}': 'prettier --write',
};
```

- [ ] **Step 8: Move coverage settings into `vite.config.ts`**

In `vite.config.ts`, change the import line:

```ts
import { configDefaults } from 'vitest/config';
```

to:

```ts
import { configDefaults, coverageConfigDefaults } from 'vitest/config';
```

and replace the `test` block with:

```ts
    test: {
        ...configDefaults,
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest-setup.ts'],
        exclude: [...configDefaults.exclude, '**/node_modules/**', '**/coverage/**', '**/dist/**'],
        coverage: {
            provider: 'v8',
            exclude: [
                ...coverageConfigDefaults.exclude,
                '**/dist/**',
                '**/public/**',
                '**/__tests__/**',
                '**/*.config.{js,ts,mjs,mts}',
                '**/*.d.ts',
                '**/vitest*.{js,ts,mjs,mts}',
                './src/components/**',
                './src/pages/**',
            ],
        },
    },
```

- [ ] **Step 9: Merge the `.gitignore` files**

In the root `.gitignore`, delete the `# Turbo` heading and the `.turbo` line. Append the entries from `apps/web/.gitignore` that the root file lacks:

```gitignore

# Logs
logs
*.log
pnpm-debug.log*
lerna-debug.log*
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Sentry Config File
.env.sentry-build-plugin

# Wrangler
.wrangler
```

`!.vscode/settings.json` is added because the root `.vscode/settings.json` is tracked. Without that line, the hoisted `.vscode/*` rule would ignore it.

Run: `git check-ignore -v .vscode/settings.json .env.local dist`
Expected: `.vscode/settings.json` prints nothing (not ignored). `.env.local` and `dist` are both reported as ignored.

- [ ] **Step 10: Delete the monorepo leftovers**

```bash
git rm -r apps packages turbo.json vitest.config.ts
rm -rf apps packages .turbo
```

`apps/web/.nvmrc` is deleted with `apps/` because the root `.nvmrc` already exists.

- [ ] **Step 11: Update the pre-commit hook**

Replace `.husky/pre-commit` with:

```
npm run check-types
npx lint-staged
```

- [ ] **Step 12: Update CI paths**

In `.github/workflows/reusable-setup-build-test.yaml`:

- Delete the "Check Dependency Consistency" step (`run: npm run sherif`).
- Change every `path: '**/node_modules'` to `path: node_modules`.
- Change every `path: apps/web/dist` to `path: dist`.

In `.github/workflows/reusable-deploy-worker.yaml`:

- Change `path: '**/node_modules'` to `path: node_modules`.
- Change `path: apps/web/dist` to `path: dist`.
- Delete the line `workingDirectory: 'apps/web'`.

Then read all seven workflow files under `.github/workflows/` in full.

Run: `grep -nE "apps/|packages/|sherif|turbo|\*\*/node_modules" .github/workflows/*.y*ml`
Expected: no output.

- [ ] **Step 13: Reinstall and update the lockfile in place**

```bash
rm -rf node_modules
npm install
```

Do not delete `package-lock.json`. Running `npm install` against the existing lockfile removes the workspace entries and keeps every other resolved version.

Expected: exits 0, and `node_modules/@repo` does not exist. Then run `npm ci` and expect exit 0.

Run: `git diff package-lock.json | grep -E '^[-+]\s+"version"' | head`
Expected: the only removed or added `version` lines belong to the deleted workspaces and to `turbo`, `sherif`, `tsc-alias`, and `concurrently` and their dependencies. If any other package changed version, stop and report it.

- [ ] **Step 14: Format and verify**

```bash
npx prettier --write package.json oxlint.config.ts prettier.config.js lint-staged.config.js vite.config.ts src
npm run check-types
npm run lint
npx vitest run 2>&1 | grep -E "Test Files|Tests  "
npm run test:ci
npm run build
ls dist/index.html
npx wrangler deploy --dry-run
```

Expected: every command exits 0. Test output reads `29 passed (29)` and `313 passed (313)`. `npm run test:ci` prints a coverage table that lists `src/classes`, `src/utils`, and `src/validators` and does not list `src/components` or `src/pages`. `wrangler deploy --dry-run` reports that it read the assets directory `./dist`.

Then run `npm run dev`, open `http://localhost:5173/about`, confirm the changelog renders, and stop the server.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "chore!: replace the monorepo with a single root app

Hoist apps/web to the repository root, inline the oxlint, Prettier,
and lint-staged configs, and remove Turborepo and sherif.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: the new pre-commit hook (check-types, lint-staged) passes. Lint-staged now runs on root files, which it did not do before, so Prettier might reformat staged `.github/` or `CHANGELOG.md` files. If it changes a file outside this task's file list, stop and report it.

---

### Task 3: Rewrite the documentation for a single app

**Files:**

- Modify: `CLAUDE.md`, `docs/architecture.md`, `README.md`, `.github/copilot-instructions.md`, `.vscode/settings.json`, `CHANGELOG.md`

**Interfaces:**

- Consumes: the Task 2 layout and script names.
- Produces: docs that reference only root paths.

Use the `writing-prose` skill for every prose edit in this task. Source material for the removed workspace docs is available through `git show HEAD~1:apps/web/CLAUDE.md` and `git show HEAD~1:packages/shared/CLAUDE.md`.

- [ ] **Step 1: Rewrite `CLAUDE.md`**

Make these changes to the root `CLAUDE.md`:

- Opening paragraph: "TypeScript React SPA, built with Vite and deployed as static assets on Cloudflare Workers. There is no backend: wheel configs are encoded and decoded in the browser." Delete the paragraph about per-workspace `CLAUDE.md` files.
- Delete the "Package context" section.
- Delete core rule 3, "Respect workspace boundaries", and renumber rules 4 and 5 to 3 and 4.
- In "Patterns", change the forms line to "Shared schemas live in `src/validators/`."
- Change the dependency install block to `npm install --save-exact <package>` and the sentence before it to "Install pinned to an exact version."
- In "Workflow", delete hook step 1 (sherif) and renumber.
- Add these sections, taken from the two removed workspace `CLAUDE.md` files and rewritten for root paths: **Layout** (one `src/` tree that lists every top-level directory, including `classes/`, `enums/`, `types/`, and `validators/`), **Key entry points** (the table, minus the `apps/web/` prefix), **Commands** (the root scripts from Task 2 Step 4), **Share-link pipeline** (the table from `packages/shared/CLAUDE.md`), **Module resolution and imports** (bundler resolution, no `.js` suffix, `@/*` declared in both `tsconfig.app.json` and `vite.config.ts`), **Testing**, and **Gotchas**.
- Keep only the gotchas that still apply: web gotchas 2 through 8, and shared gotcha 4 (`types/wheel-colors.ts` exports a runtime value). Drop every gotcha about `dist`, the `exports` map, `tsc-alias`, Turbo, and the domain boundary.

- [ ] **Step 2: Rewrite `docs/architecture.md`**

Replace the "Monorepo structure" section with a `src/` directory map. Replace "Where code belongs" with a table keyed by directory and no domain/UI split. Delete the "Shared core" and "Framework separation" patterns. In "Technology stack", delete the "Shared" line, remove Turborepo and sherif from "Tooling", and change "each workspace's `package.json`" to "`package.json`". In "Deployment model", change `apps/web/dist` to `dist`, `run from apps/web` to `run from the repository root`, and `apps/web/wrangler.jsonc` to `wrangler.jsonc`. Change `packages/shared/src/utils/encoding.ts` to `src/utils/encoding.ts`.

- [ ] **Step 3: Update `README.md`**

- Replace the "Apps and Packages" section with a short "Stack" paragraph that names React, Vite, Cloudflare static assets, Zod, and TypeScript, with the existing links.
- Delete the "Turborepo is able to watch each package" sentence.
- Change `apps/web/.env.local` to `.env.local`.
- Change "This will build relevant packages and start the web app" to "This starts the web app".
- Change "sequentially over each repo" to "over the project".
- Delete the Sherif bullet under "Pull Requests", and change "Build every package and app" to "Build the app".

- [ ] **Step 4: Update `.github/copilot-instructions.md`**

Replace its body with:

```markdown
# GitHub Copilot Instructions

This project keeps its coding standards in `CLAUDE.md` at the repository root.
Read that file for conventions, patterns, layout, and gotchas.

See `docs/architecture.md` for the `src/` map and for deciding where new code
belongs.
```

- [ ] **Step 5: Update `.vscode/settings.json`**

Delete the `json.schemaDownload.trustedDomains` entry for `https://turborepo.com/schema.json`, along with the comma that precedes it.

- [ ] **Step 6: Add a `CHANGELOG.md` entry**

Under `## [3.0.0](#3.0.0) - Unreleased`, add the following bullet at the end of `### Changed`:

```markdown
- The project is a single Vite app instead of a Turborepo monorepo. Wheel logic lives in the app's `src/` directory.
```

- [ ] **Step 7: Verify the reference sweep**

```bash
git grep -nE "@repo/|turbo|sherif|apps/web|packages/|workspace" -- . \
  ':!docs/superpowers/' ':!CHANGELOG.md' ':!package-lock.json'
```

Expected: no output. If a match is a legitimate use of the word "workspace" with no relation to npm workspaces, keep it and list it in the task report.

- [ ] **Step 8: Verify formatting of changed files**

```bash
npx prettier --check $(git diff --name-only main...HEAD --diff-filter=d) $(git diff --name-only --diff-filter=d)
```

Expected: "All matched files use Prettier code style!"

This narrows the spec's `prettier --check .` to the files this branch touches. A repository-wide check also flags `.github/workflows/claude.yml`, `.github/workflows/claude-code-review.yml`, and `.serena/project.yml`, which were unformatted before this branch and are out of scope.

- [ ] **Step 9: Run the full verification once more**

```bash
npm ci
npm run check-types
npm run lint
npm run test:ci
npm run build
npx wrangler deploy --dry-run
```

Expected: every command exits 0, and the tests report `313 passed (313)`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "docs: describe the single-app layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: the pre-commit hook passes.
