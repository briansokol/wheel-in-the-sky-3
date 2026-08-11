# Sentry 10.70.0 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every Sentry package from 10.39.0 to 10.70.0 and replace the deprecated `honoIntegration` code path with `@sentry/hono`, without changing observable application behavior.

**Architecture:** Two commits on branch `chore/sentry-upgrade-10.70`. Commit 1 is a pure dependency bump requiring no TypeScript changes. Commit 2 rewrites the Sentry wiring in one file, `packages/api-handlers/src/server/index.ts`, moving from a `withSentry` wrapper around the Hono app to a `sentry()` middleware registered on it. Splitting them keeps a clean revert target, because the two halves carry different risk.

**Tech Stack:** npm workspaces, Turborepo, Hono 4.12.2, Cloudflare Workers via Wrangler 4.68.0, Vitest 4.0.18, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-08-11-sentry-upgrade-design.md`

## A note on TDD for this plan

This plan does not follow a red-green-refactor cycle, and that is deliberate rather than an oversight. There is no new behavior to test-drive: the spec's explicit intent is that observable behavior stays the same, and research against the published 10.70.0 tarballs confirmed that every API this repository calls is unchanged. Writing a test that fails before a version number changes and passes after would be theater.

The discipline is preserved differently. Each task starts by **establishing a green baseline before touching anything**, so that any breakage is unambiguously attributable to the change rather than to pre-existing state. Each task ends with the same verification suite re-run. That baseline-then-reverify gate is the functional equivalent of the red-green cycle for a dependency upgrade.

Existing tests are expected to pass unmodified throughout. If any test needs editing to pass, **stop and report it**, because that means the upgrade changed behavior the spec claimed it would not.

## Global Constraints

- Target version for `@sentry/react`, `@sentry/cloudflare`, and `@sentry/hono` is exactly `10.70.0`. `@sentry/hono` declares `@sentry/cloudflare` as an exact-version peer, so these cannot drift apart.
- Target version for `@sentry/vite-plugin` is exactly `5.4.0`. Target for `@sentry/cli` is exactly `3.6.2`.
- All installs run **from the repository root** targeting a workspace with `--save-exact`. Never `cd` into a workspace to install. This is a documented monorepo rule.
- Both `@sentry/cli` copies (`packages/api-handlers` and `packages/shared`) must move together, or `npm run sherif` fails on cross-workspace version inconsistency. `sherif` runs in the pre-commit hook.
- `@sentry/cli` stays in `dependencies`, not `devDependencies`, in both packages. It is arguably misplaced, but that is pre-existing and out of scope.
- Do **not** change `apps/api/wrangler.jsonc` `compatibility_flags`. It stays `["nodejs_als"]`. The spec explains why.
- Do **not** add a `CHANGELOG.md` entry. An SDK version bump is not a user-facing change under the project's changelog policy.
- Filenames are kebab-case. TypeScript is strict, no `any`.
- Import ordering is applied automatically by `@trivago/prettier-plugin-sort-imports`. Do not hand-order imports.

## Critical execution notes

**`npm run test` is watch mode.** The root `test` script is bare `vitest`, which never exits. For every verification step in this plan use `npm run test:ci` (`vitest run --coverage`). Running `npm run test` in an automated context will hang.

**Build must precede test.** Two documented traps combine here. First, `packages/api-handlers` and `apps/api` define no `check-types` script, so `npm run check-types` skips them entirely and their type errors surface only at build time. Second, the test suites resolve `@repo/api-handlers/server` to built output in `dist`, and Vitest runs outside Turbo, so a stale `dist` makes a passing test run meaningless. Always `npm run build` before `npm run test:ci`.

**The working tree carries pre-existing uncommitted changes.** `apps/api/wrangler.jsonc` (observability config) and the root `package.json` `allowScripts` block were carried onto this branch from `main` and are intentionally uncommitted. Commit 1 builds on top of that `allowScripts` block. Stage files by name; never `git add -A`.

## File structure

| File | Responsibility | Task |
| --- | --- | --- |
| `apps/web/package.json` | `@sentry/react` and `@sentry/vite-plugin` version pins | 1 |
| `packages/api-handlers/package.json` | `@sentry/cloudflare`, `@sentry/cli`, then `@sentry/hono` pins | 1, 2 |
| `packages/shared/package.json` | `@sentry/cli` version pin | 1 |
| `package.json` (root) | `allowScripts` keys permitting `@sentry/cli` install scripts | 1 |
| `package-lock.json` | resolved dependency graph | 1, 2 |
| `packages/api-handlers/src/server/index.ts` | Hono app construction and Sentry wiring | 2 |

Files explicitly **not** modified: `apps/api/src/index.ts` (the `export default app` remains valid because `HonoBase` satisfies `ExportedHandler<Env>`), `apps/web/src/main.tsx`, `apps/web/vite.config.ts`, `packages/api-handlers/src/client/index.ts`, and every existing test file.

---

### Task 1: Dependency bump

**Files:**
- Modify: `apps/web/package.json` (`dependencies["@sentry/react"]`, `devDependencies["@sentry/vite-plugin"]`)
- Modify: `packages/api-handlers/package.json` (`dependencies["@sentry/cloudflare"]`, `dependencies["@sentry/cli"]`)
- Modify: `packages/shared/package.json` (`dependencies["@sentry/cli"]`)
- Modify: `package.json` (root, `allowScripts` block)
- Modify: `package-lock.json`
- Test: no new tests; existing suites must pass unmodified

**Interfaces:**
- Consumes: nothing.
- Produces: `@sentry/cloudflare` at exactly `10.70.0` in `packages/api-handlers`, which Task 2 requires because `@sentry/hono@10.70.0` declares it as an exact-version peer.

- [ ] **Step 1: Confirm branch and establish a green baseline**

Verify you are on the right branch and that everything passes *before* any change. If the baseline is red, stop and report rather than proceeding, because you will not be able to attribute later failures.

```bash
git branch --show-current   # expect: chore/sentry-upgrade-10.70
npm run build
npm run test:ci
```

Expected: build succeeds, all tests pass.

- [ ] **Step 2: Record the current resolved `@sentry/cli` versions**

You need this to know which `allowScripts` keys change. Save the output somewhere you can compare against after the install.

```bash
node -e "const l=require('./package-lock.json'); for(const [k,v] of Object.entries(l.packages)) if(k.includes('@sentry/cli')&&v.version) console.log(k, v.version)"
```

Expected: entries showing `2.58.5` (transitive, under `@sentry/vite-plugin`) and `3.2.2` (direct).

- [ ] **Step 3: Run the five installs**

Each is pinned exact and targets a workspace from the root.

```bash
npm install --save-exact --workspace apps/web @sentry/react@10.70.0
npm install --save-exact --workspace apps/web --save-dev @sentry/vite-plugin@5.4.0
npm install --save-exact --workspace packages/api-handlers @sentry/cloudflare@10.70.0
npm install --save-exact --workspace packages/api-handlers @sentry/cli@3.6.2
npm install --save-exact --workspace packages/shared @sentry/cli@3.6.2
```

- [ ] **Step 4: Read the newly resolved `@sentry/cli` versions**

Run the same command as Step 2. The transitive version is a caret resolution (`@sentry/bundler-plugins@10.70.0` depends on `@sentry/cli@^2.58.6`), so it must be **read, not assumed**.

```bash
node -e "const l=require('./package-lock.json'); for(const [k,v] of Object.entries(l.packages)) if(k.includes('@sentry/cli')&&v.version) console.log(k, v.version)"
```

Expected: a direct `3.6.2`, and a transitive version at or above `2.58.6`. Note the exact transitive value for Step 5.

- [ ] **Step 5: Update the root `allowScripts` block**

Edit `package.json`, replacing the two stale keys with the versions you just read. If Step 4 reported a transitive version other than `2.58.6`, use that instead.

```diff
   "allowScripts": {
     "@heroui/shared-utils@2.1.12": true,
-    "@sentry/cli@2.58.5": true,
-    "@sentry/cli@3.2.2": true,
+    "@sentry/cli@2.58.6": true,
+    "@sentry/cli@3.6.2": true,
     "esbuild@0.27.3": true,
```

A stale key fails silently: it does not error, it just stops the package's install scripts from running, which for `@sentry/cli` means the platform binary is never downloaded.

- [ ] **Step 6: Reinstall and confirm the `sentry-cli` binary actually works**

This is the check that proves Step 5 was correct. `@sentry/cli` fetches a platform binary in a postinstall script; if `allowScripts` does not permit it, the package installs but the binary is missing.

```bash
rm -rf node_modules
npm install
npx --workspace packages/api-handlers sentry-cli --version
```

Expected: prints `sentry-cli 3.6.2`. If it errors about a missing binary, the `allowScripts` key is wrong.

- [ ] **Step 7: Verify dependency consistency**

```bash
npm run sherif
```

Expected: `✓ No issues found`. A failure here almost certainly means the two `@sentry/cli` copies disagree.

- [ ] **Step 8: Build, typecheck, lint**

Build first, for the reasons in "Critical execution notes".

```bash
npm run build
npm run check-types
npm run lint
```

Expected: all succeed with no errors.

- [ ] **Step 9: Run the full test suite**

```bash
npm run test:ci
```

Expected: all tests pass, **unmodified**. If any test requires editing, stop and report: that contradicts the spec's claim that this bump is behavior-neutral.

- [ ] **Step 10: Commit**

Stage by name. The `apps/api/wrangler.jsonc` change is pre-existing and intentionally excluded here.

```bash
git add package.json package-lock.json apps/web/package.json packages/api-handlers/package.json packages/shared/package.json
git commit -m "chore: upgrade Sentry packages to 10.70.0

@sentry/react and @sentry/cloudflare 10.39.0 to 10.70.0,
@sentry/vite-plugin 5.0.0 to 5.4.0, @sentry/cli 3.2.2 to 3.6.2.

No API changes were required. Updates the allowScripts keys, which
pin exact @sentry/cli versions, including the transitive copy that
moved when @sentry/vite-plugin restructured onto @sentry/bundler-plugins."
```

---

### Task 2: Adopt `@sentry/hono`

**Files:**
- Modify: `packages/api-handlers/package.json` (add `dependencies["@sentry/hono"]`)
- Modify: `packages/api-handlers/src/server/index.ts` (full Sentry wiring rewrite, currently lines 1 and 31-38)
- Modify: `package-lock.json`
- Test: no new tests; existing suites must pass unmodified, plus manual Worker probes

**Interfaces:**
- Consumes: `@sentry/cloudflare@10.70.0` from Task 1, required as an exact-version peer.
- Produces: `export const app` changes static type from `ExportedHandler<Env, unknown, unknown>` to `HonoBase<AppEnv, BlankSchema, '/api', '/api'>`. Both satisfy `ExportedHandler<Env>`, so `apps/api/src/index.ts` needs no change. `export const routes` keeps a byte-identical type, so `hc<ApiAppType>` in `apps/web/src/utils/api.ts` is unaffected.

- [ ] **Step 1: Install `@sentry/hono`**

`@sentry/cloudflare` stays a dependency. `@sentry/hono/cloudflare` re-exports it wholesale and pins it as an exact-version peer.

```bash
npm install --save-exact --workspace packages/api-handlers @sentry/hono@10.70.0
```

- [ ] **Step 2: Confirm the peer resolved cleanly**

```bash
npm ls @sentry/hono @sentry/cloudflare --workspace packages/api-handlers
```

Expected: both at `10.70.0`, with no `UNMET PEER DEPENDENCY` warnings.

- [ ] **Step 3: Rewrite the Sentry wiring**

Replace the entire contents of `packages/api-handlers/src/server/index.ts` with the following. Three things change: the import on line 1, the addition of the `sentry()` middleware as the **first** `.use()`, and the `app` export at the bottom. The `cors()` config, `notFound` handler, and `routes` export are byte-for-byte unchanged.

```typescript
import { sentry } from '@sentry/hono/cloudflare';
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { cors } from 'hono/cors';
import { encodingApi } from '@/server/encoding.js';
import { AppEnv } from '@/types.js';

const honoApp = new Hono<AppEnv>().basePath('/api');

honoApp.use(
    sentry(honoApp, (sentryEnv) => ({
        dsn: 'https://895c486a1e653f07201b20658156b954@o4508580787781632.ingest.us.sentry.io/4509040320970752',
        tracesSampleRate: 1.0,
        enabled: sentryEnv.APP_ENV !== 'local',
    }))
);

honoApp.use(
    '*',
    cors({
        origin: (origin, c) => {
            const { APP_ENV } = env(c);
            return APP_ENV === 'local' || origin.endsWith('wheel-in-the-sky.bri-9c5.workers.dev') ? origin : undefined;
        },
        allowMethods: ['POST', 'GET'],
        allowHeaders: ['Content-Type', 'Accept-Encoding', 'sentry-trace', 'baggage'],
        exposeHeaders: ['Content-Length'],
        maxAge: 86400,
    })
);

honoApp.notFound((c) => {
    const { ASSETS } = env(c);
    return ASSETS.fetch(c.req.url);
});

export const routes = honoApp.route('/config', encodingApi);

export const app = honoApp;
```

Three constraints are load-bearing and must not be "tidied":

1. `sentry()` is the **first** `.use()`, ahead of `cors()`. Its middleware runs a request handler before `await next()` and a response handler after, so it must be outermost to observe `context.error` and own root span naming.
2. `sentry()` is registered **before** `.route()`. Handlers are wrapped at registration time, so anything mounted earlier gets no middleware span.
3. `sentry()` receives `honoApp`, the `.basePath('/api')` result, because that is the instance actually exported and served.

The explicit `withSentry<Env>` generic is gone: `sentryEnv` now infers as `Env` from `AppEnv['Bindings']`. Do not add a generic back.

Do not add a `shouldHandleError` option. Its default already matches current effective behavior, since `@sentry/cloudflare` already ships `honoIntegration()` by default and that integration already ignores 3xx and 4xx.

- [ ] **Step 4: Verify dependency consistency, build, typecheck, lint**

The build is the only real typecheck for this package, since it has no `check-types` script.

```bash
npm run sherif
npm run build
npm run check-types
npm run lint
```

Expected: all succeed. A type error on `export default app` in `apps/api/src/index.ts` would mean the `ExportedHandler` assignment assumption is wrong; stop and report.

- [ ] **Step 5: Run the full test suite**

```bash
npm run test:ci
```

Expected: all tests pass unmodified. Note that `apps/api/src/__tests__/index.test.ts` asserts `app.routes` is a non-empty array, which now holds more directly than before, since `app` is the Hono instance itself rather than a wrapper.

- [ ] **Step 6: Start the local Worker**

Run from the repository root so Turbo builds `apps/web` into `apps/api/public` first. Leave this running in a background shell.

```bash
npm run dev
```

Wait until Wrangler reports the Worker is ready on `http://localhost:8787`.

- [ ] **Step 7: Check the console for the ordering warning**

Scan the dev server output. It must **not** contain:

```
[hono] N sub-app(s) were mounted before sentry()
```

If that warning appears, the `sentry()` registration is in the wrong position relative to `.route()`. Fix Step 3 before continuing.

- [ ] **Step 8: Probe route resolution and handler execution**

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8787/api/config/decode \
  -H 'Content-Type: application/json' -d '{"encodedConfig":"garbage"}'
```

Expected: `400`. This proves the request reached the `/decode` handler, `decodeConfig` threw, and the handler's own catch returned JSON. A `404` means routing broke; a `500` means the error escaped the handler.

- [ ] **Step 9: Probe that validation still runs beneath `sentry()`**

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:8787/api/config/decode \
  -H 'Content-Type: application/json' -d '{}'
```

Expected: `400`, this time from `zValidator` rather than the handler body.

- [ ] **Step 10: Probe CORS, the highest-risk check**

This is the probe that matters most, because `sentry()` now precedes `cors()` in the middleware chain. `APP_ENV` is `local` per `apps/api/.dev.vars`, so the origin callback echoes any origin back.

```bash
curl -s -i -X OPTIONS http://localhost:8787/api/config/decode \
  -H 'Origin: https://example.com' \
  -H 'Access-Control-Request-Method: POST' | grep -i 'access-control-allow-origin'
```

Expected: a header line `access-control-allow-origin: https://example.com`. If this header is absent, the middleware reordering broke CORS and the change must not be committed.

- [ ] **Step 11: Probe the notFound and ASSETS fallback**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8787/api/nope
```

Expected: `200`, because `notFound` delegates to `ASSETS.fetch`, which serves the SPA shell. A `404` would mean the fallback broke.

- [ ] **Step 12: Stop the dev server**

Terminate the background `npm run dev` process.

- [ ] **Step 13: Commit**

```bash
git add packages/api-handlers/package.json packages/api-handlers/src/server/index.ts package-lock.json
git commit -m "refactor: replace withSentry with @sentry/hono middleware

@sentry/cloudflare ships honoIntegration() as a default integration,
which is deprecated as of 10.55.0 in favor of the @sentry/hono package.

Registers sentry() as the first middleware, ahead of cors() and before
route mounting, so it wraps handlers at registration time. Gains
route-parametrized transaction names and middleware spans. The typed
RPC contract exported as routes is unchanged."
```

---

## Verification gaps to report at handoff

These are known and accepted per the spec, not defects to fix. Whoever finishes this work should state plainly that they were not verified:

- **Sentry event delivery was not verified.** `apps/api/.dev.vars` sets `APP_ENV=local` and the config is `enabled: sentryEnv.APP_ENV !== 'local'`, so the SDK is switched off under `wrangler dev`. The probes prove the application works with the middleware installed, not that events arrive.
- **Route-parametrized transaction names were not verified.** That is the primary benefit of adopting `@sentry/hono`, and it is only observable in the Sentry UI after a deploy.
- **Source map upload with `@sentry/cli` 3.6.2 was not verified.** It runs only under `build:with-sentry`, which needs `SENTRY_AUTH_TOKEN`.
- **The `@sentry/vite-plugin` 5.4.0 internal restructure was not exercised.** The plugin is gated behind `WITH_SENTRY`, so the default build path never loads it.

## Expected behavior changes, not defects

Do not "fix" these if you notice them. They follow from the version bump and were accepted in the spec:

- Session and crash-free-user metrics will shift. 10.40.0 fixed session accounting so user id is consistently attached and the first soft navigation after pageload is no longer skipped. Alerts keyed to those metrics may fire.
- Bot traffic stops producing transactions. 10.44.0 skips `browserTracingIntegration` setup for bot user agents.
- The Worker bundle grows by roughly 7 KB minified, 2.7 KB gzipped, from `@sentry/hono`.
- React routing spans gain `url.template`, `url.path`, and `url.full` attributes as of 10.65.0.

## Rollback

One `git revert` per commit. Reverting Task 2's commit restores `withSentry` while leaving the version bump in place. Reverting both returns to 10.39.0.
