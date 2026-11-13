# Switch from npm to pnpm

## Intent

Replace npm with pnpm as the project's package manager, mainly for supply-chain
security and secondarily for disk usage. The switch should change what installs
and how, not which versions run.

## Goals

- pnpm is the only package manager the repo, CI, hooks, and docs assume.
- Security hardening that pnpm enables:
  - Dependency install scripts are blocked unless allowlisted.
  - Versions published less than 7 days ago are refused.
  - The isolated (strict) `node_modules` layout stays on, so undeclared imports
    fail.
  - The exact pnpm binary is pinned by version and integrity hash.
- Disk savings come from pnpm's content-addressable store; no configuration
  needed.

## Non-goals

- Moving from exact pins to tilde ranges. Agreed as a separate follow-up PR.
- Upgrading any dependency. Resolved versions, including transitive ones,
  should match today's `package-lock.json`.
- Restructuring CI (for example, extracting the repeated setup steps into a
  composite action).

## Anti-goals

- Loosening strictness to make something work (`shamefully-hoist`,
  `node-linker=hoisted`, or public-hoist patterns). If a tool breaks under the
  isolated layout, stop and raise it.
- A lockfile regenerated from scratch, which would silently become a mass
  upgrade.

## Approaches

| Approach                                              | Trade-off                                                           | Verdict    |
| ----------------------------------------------------- | ------------------------------------------------------------------- | ---------- |
| Direct conversion: `pnpm import`, `pnpm/action-setup` | Keeps resolved versions; pnpm reads the `packageManager` pin itself | **Chosen** |
| Corepack to provision pnpm                            | Corepack is being removed from Node (not bundled from Node 25)      | Rejected   |
| Fresh `pnpm install` without importing the lockfile   | Re-resolves every transitive dependency: an unreviewed upgrade      | Rejected   |
| Convert and also consolidate CI setup into one action | Cleaner CI, but an unrequested refactor that enlarges the diff      | Rejected   |

## Decided

- **Release-age delay: 7 days** (`minimumReleaseAge: 10080`, in minutes). An
  urgent patch can be exempted per package through `minimumReleaseAgeExclude`.
- **Temporary exact-version exemptions.** On 2026-11-13, 96 locked packages
  were under 7 days old, and pnpm 12 rejects them both in `pnpm import` and
  in `pnpm install --frozen-lockfile`. Each one is listed by exact version
  (`name@version`) in `minimumReleaseAgeExclude`, so only the builds already
  in use pass and newer versions are still delayed. A follow-up commit on or
  after 2026-11-19 removes the list.
- **Dependabot cooldown matches**: 7 days on the `npm` ecosystem entry, so it
  doesn't open PRs that pnpm would reject. The ecosystem stays `npm`, which
  covers pnpm lockfiles.
- **Install-script allowlist** moves from npm's `allowScripts` in
  `package.json` to pnpm's allowlist in `pnpm-workspace.yaml`, covering the
  same four packages: `@sentry/cli`, `esbuild`, `fsevents`, `workerd`.
- Keep `--save-exact` behavior for now (pnpm `saveExact: true`), until the
  tilde-range follow-up.

## Changes

- `package.json`: `packageManager` becomes `pnpm@<version>+sha512.<hash>`.
  Remove `allowScripts`. `build:with-sentry` calls `pnpm run build`. `ncu` uses
  `pnpm exec ncu`, or `pnpm dlx` if `npm-check-updates` isn't a declared
  dependency.
- `pnpm-workspace.yaml` (new): allowlist, `minimumReleaseAge`, `saveExact`.
  No `packages:` list; the repo is a single app.
- Lockfile: `pnpm import` from `package-lock.json`, then delete
  `package-lock.json`.
- `.husky/pre-commit`: `pnpm run check-types`, `pnpm exec lint-staged`.
- CI (five workflows): add `pnpm/action-setup` before `actions/setup-node`;
  `cache: 'pnpm'`; `node_modules` cache keys hash `pnpm-lock.yaml`;
  `pnpm install --frozen-lockfile`; `npm run` becomes `pnpm run`; `npx
sentry-cli` becomes `pnpm exec sentry-cli`. The deploy job keeps pnpm on the
  PATH, since `cloudflare/wrangler-action` detects the lockfile.
- `.github/dependabot.yml`: add `cooldown` to the `npm` entry.
- Docs: CLAUDE.md (commands table, install rule, hook description),
  README.md, CONTRIBUTING.md.

## Success criteria

- `pnpm install --frozen-lockfile` succeeds on a clean clone, and the four
  allowlisted packages run their install scripts.
- `pnpm run check-types`, `lint`, `build`, and `test:ci` all pass.
- The pre-commit hook runs under pnpm.
- Resolved versions in `pnpm-lock.yaml` match the old `package-lock.json`.
- CI is green on the feature branch.

## Left to the builder

- Pinning the exact pnpm version: the latest 12.x, currently 12.18.0.
- Exact config key names for the pnpm version chosen (the allowlist key has
  been renamed across pnpm majors).
- Whether `node_modules` caching in CI is still worth keeping alongside
  `cache: 'pnpm'`. Keep it unless it breaks; removing it is out of scope.
- CHANGELOG: no entry. It records user-facing changes, and this is
  contributor tooling. _(Claude's call.)_
