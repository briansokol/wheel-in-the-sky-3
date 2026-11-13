# pnpm Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace npm with pnpm across the repo, CI, hooks, and docs, with supply-chain hardening, without changing any resolved dependency version.

**Architecture:** Pin pnpm in `package.json`, put pnpm settings in a new `pnpm-workspace.yaml`, convert the existing `package-lock.json` with `pnpm import`, then swap every `npm`/`npx` call site. Too-new locked versions are temporarily exempted by exact version and the exemptions are removed once they age past 7 days.

**Tech Stack:** pnpm 12.18.0, Node 24 (`.nvmrc`), GitHub Actions (`pnpm/action-setup@v6`, `actions/setup-node@v7`), Dependabot, husky.

**Spec:** `docs/superpowers/specs/2026-11-13-pnpm-migration-design.md`

## Global Constraints

- Branch: `chore/pnpm` (already exists; the spec is committed there).
- `packageManager`: `pnpm@12.18.0+sha512.9d7882d5dc82147ecfc4e062aa34834e0ad0296710a1837a1115ae012127d36b7109e321ac1598a1dd0a65597681b1e99917e12ed0d749eae91187943363beb3`
- `minimumReleaseAge: 10080` (7 days, in minutes).
- Install-script allowlist (pnpm 12 key `allowBuilds`): exactly `@sentry/cli`, `esbuild`, `fsevents`, `workerd`.
- `saveExact: true`. No tilde ranges in this work.
- No dependency upgrades: every `name@version` in the old `package-lock.json` must appear in `pnpm-lock.yaml`.
- Never set `shamefullyHoist`, `nodeLinker: hoisted`, or `publicHoistPattern`. If a tool breaks under the isolated layout, stop and report.
- No CI refactor: edit each workflow's steps in place.
- No CHANGELOG entry (contributor tooling, not user-facing).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Let the pre-commit hook run (no `--no-verify`).

## Review Focus

1. **Fresh clone with no `node_modules`.** `pnpm install --frozen-lockfile` must succeed and run the four allowlisted install scripts, with no "ignored build scripts" warning. Covered in Task 1, Step 6.
2. **The pre-commit hook on a machine where only pnpm resolves.** `.husky/pre-commit` must not call `npm`/`npx`. Covered by the Task 1 commit (the hook runs) and the Task 3 leftover grep.
3. **The deploy job.** `cloudflare/wrangler-action` detects `pnpm-lock.yaml` and calls pnpm, so pnpm must be on the PATH in `reusable-deploy-worker.yaml`. Covered in Task 2, Step 2.
4. **Stale CI cache keys.** A `node_modules` cache keyed on `package-lock.json` hashes nothing once that file is gone, which would restore a stale npm tree. Every key must hash `pnpm-lock.yaml`. Covered in Task 2, Step 3.
5. **A Dependabot PR before 2026-11-19.** Its new version is not in the exact-version exemptions, so it must be held by `cooldown` rather than fail CI. Covered in Task 2, Step 4.

---

### Task 1: Switch the package manager locally

**Files:**

- Modify: `package.json` (`packageManager`, remove `allowScripts`, scripts `build:with-sentry` and `ncu`)
- Create: `pnpm-workspace.yaml`
- Create: `pnpm-lock.yaml` (generated)
- Delete: `package-lock.json`
- Modify: `.husky/pre-commit`

**Interfaces:**

- Produces: `pnpm-lock.yaml` (Task 2's cache keys hash it); `pnpm-workspace.yaml` with a `minimumReleaseAgeExclude` list (Task 4 deletes it).

- [ ] **Step 1: Capture the baseline version set**

```bash
node -e 'const p=require("./package-lock.json").packages;console.log([...new Set(Object.entries(p).filter(([k])=>k).map(([k,v])=>k.split("node_modules/").pop()+"@"+v.version))].sort().join("\n"))' > "$SCRATCH/npm-versions.txt"
```

(`$SCRATCH` is the session scratchpad directory.) Expected: about 591 lines.

- [ ] **Step 2: Edit `package.json`**

- Set `packageManager` to the value in Global Constraints.
- Delete the `allowScripts` block.
- `build:with-sentry`: `cross-env WITH_SENTRY=true pnpm run build`
- `ncu`: `pnpm dlx npm-check-updates --interactive --install=never` (`npm-check-updates` is not a dependency, so `pnpm exec` would fail.)

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

Keys: `allowBuilds` (map of the four packages to `true`), `minimumReleaseAge: 10080`, `saveExact: true`, and `minimumReleaseAgeExclude`. Add no `packages:` key. Above `minimumReleaseAgeExclude`, add a comment saying the list is temporary and is removed on or after 2026-11-19.

Generate the exclusion entries by checking every line of `npm-versions.txt` against the registry's `time[version]`, and listing as `"name@version"` each one published after `now - 7 days`. Fetch `https://registry.npmjs.org/<name with / encoded as %2f>` and read `.time[version]`. On 2026-11-13 this gives 96 entries. A different count is fine if the run date differs; the success check is Step 5.

- [ ] **Step 4: Import and remove the npm lockfile**

```bash
pnpm import && git rm -q package-lock.json && rm -rf node_modules
```

Expected: `pnpm-lock.yaml` exists, with no `minimumReleaseAge` error.

- [ ] **Step 5: Verify that no versions changed**

Build the same `name@version` set from `pnpm-lock.yaml` (the keys under its top-level `packages:`, with any peer suffix `(...)` stripped), then `comm -3` it against `npm-versions.txt`.
Expected: no lines that exist only in the npm set. If any appear, stop and report them.

- [ ] **Step 6: Clean install with build scripts**

```bash
pnpm install --frozen-lockfile
```

Expected: success, and no "Ignored build scripts" warning. `node_modules/.pnpm/workerd@*/node_modules/workerd/bin/workerd` exists.

- [ ] **Step 7: Edit `.husky/pre-commit`**

```
pnpm run check-types
pnpm exec lint-staged
```

- [ ] **Step 8: Run the full local check**

```bash
pnpm run check-types && pnpm run lint && pnpm run build && pnpm run test:ci
```

Expected: all pass. A failure under the isolated layout, such as an undeclared import, is a stop-and-report, not a hoisting fix.

- [ ] **Step 9: Commit (the hook runs under pnpm)**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .husky/pre-commit
git commit -m "chore!: switch package manager from npm to pnpm"
```

Expected: the hook prints pnpm output and the commit succeeds.

---

### Task 2: CI and Dependabot

**Files:**

- Modify: `.github/workflows/reusable-setup-build-test.yaml` (4 jobs)
- Modify: `.github/workflows/deploy-main.yaml` (`get-version` job, `build_command`)
- Modify: `.github/workflows/build-feature.yaml` (`build_command`)
- Modify: `.github/workflows/reusable-deploy-worker.yaml`
- Modify: `.github/workflows/reusable-sentry-operations.yaml`
- Modify: `.github/dependabot.yml`

**Interfaces:**

- Consumes: `pnpm-lock.yaml` and the `packageManager` pin from Task 1.

- [ ] **Step 1: Add the pnpm setup step**

In every job that has an `actions/setup-node@v7` step, insert `uses: pnpm/action-setup@v6` (named `Setup pnpm`) immediately before it, with no `version:` input, because it reads `packageManager`. In `reusable-sentry-operations.yaml`, give it the same `if:` as the neighboring steps.

- [ ] **Step 2: Swap setup-node cache and install commands**

- `cache: 'npm'` becomes `cache: 'pnpm'`.
- `run: npm ci` becomes `run: pnpm install --frozen-lockfile`.
- `npm run <x>` becomes `pnpm run <x>`, including both `build_command` values.
- `npx sentry-cli` becomes `pnpm exec sentry-cli`.

The deploy-worker job keeps its pnpm setup step, because wrangler-action calls pnpm.

- [ ] **Step 3: Swap cache keys**

Every `hashFiles('**/package-lock.json')` becomes `hashFiles('**/pnpm-lock.yaml')`, and `-modules-` becomes `-pnpm-modules-` so that no old npm cache can be restored.

- [ ] **Step 4: Add a Dependabot cooldown**

On the `package-ecosystem: npm` entry only:

```yaml
cooldown:
  default-days: 7
```

- [ ] **Step 5: Verify**

```bash
grep -rnE "\bnpm (ci|run|install)\b|\bnpx\b|package-lock|cache: 'npm'" .github/
for f in .github/workflows/*.y*ml .github/dependabot.yml; do pnpm dlx js-yaml "$f" >/dev/null || echo "BAD $f"; done
```

Expected: the grep prints nothing (the Dependabot `package-ecosystem: npm` line doesn't match), and no file prints `BAD`.

- [ ] **Step 6: Commit**

```bash
git add .github
git commit -m "ci: install with pnpm and add Dependabot cooldown"
```

- [ ] **Step 7: Push and check CI (ask the user before pushing)**

```bash
git push -u origin chore/pnpm
gh run watch "$(gh run list --branch chore/pnpm --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```

Expected: "Build and Test Feature Branch" is green. The deploy workflow only runs on `main`, so it is checked by review, not by a run.

---

### Task 3: Docs

**Files:**

- Modify: `CLAUDE.md` (the "Dependencies" install rule, the Commands table, the "In `npm run build`" paragraph, the Workflow/hook list and full-suite line, and the "npm runs it after `npm install`" note)
- Modify: `README.md` (install, dev, test, and ncu blocks)
- Modify: `CONTRIBUTING.md` (`npm run prepare`)

- [ ] **Step 1: Edit**

- `npm install --save-exact <package>` becomes `pnpm add <package>`, plus a line saying `saveExact: true` in `pnpm-workspace.yaml` keeps versions exact.
- Add one CLAUDE.md line under Dependencies: new versions must be at least 7 days old (`minimumReleaseAge`), and a package with an install script must be added to `allowBuilds`.
- Every other `npm run` becomes `pnpm run`, and `npx` becomes `pnpm exec`. `npm install` becomes `pnpm install`.
- Re-run `pnpm run format` so the CLAUDE.md table stays aligned.

- [ ] **Step 2: Grep for leftovers**

```bash
git grep -nE "\bnpm (ci|run|install)\b|\bnpx\b|package-lock" -- ':!docs/superpowers' ':!.serena' ':!pnpm-lock.yaml'
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md CONTRIBUTING.md
git commit -m "docs: switch commands to pnpm"
```

---

### Task 4: Remove the temporary exemptions (on or after 2026-11-19)

**Files:**

- Modify: `pnpm-workspace.yaml`

Do this in a separate follow-up commit or PR, not before 2026-11-19 (the newest exempted package, `glob@14.0.6`, was published on 2026-11-12).

- [ ] **Step 1: Delete `minimumReleaseAgeExclude` and its comment**

- [ ] **Step 2: Verify**

```bash
rm -rf node_modules && pnpm install --frozen-lockfile
```

Expected: success. If a package fails the age check, it came in after this plan was written: check that its release is expected, then wait for it to age or exempt that exact version.

- [ ] **Step 3: Commit**

```bash
git add pnpm-workspace.yaml
git commit -m "chore: drop temporary minimumReleaseAge exemptions"
```
