# Sentry Upgrade to 10.70.0 and `@sentry/hono` Adoption

Date: 2026-08-11
Branch: `chore/sentry-upgrade-10.70`

## Context

The repository runs Sentry JavaScript SDK 10.39.0 in both the browser
(`@sentry/react`) and the Cloudflare Worker (`@sentry/cloudflare`). The request
that prompted this work cited the Sentry Cloudflare migration guide, whose
newest entry is v9 to v10. That migration has already been applied, so no
breaking migration guide is outstanding.

Latest stable across the Sentry packages is 10.70.0. An `11.0.0-alpha.0` exists
but has no published migration guide, and `docs.sentry.io` returns 404 for a
v10-to-v11 page. v11 is therefore out of scope.

Research against the published 10.70.0 tarballs and the `sentry-javascript`
source at tag `10.70.0` established that the 10.39.0 to 10.70.0 bump requires
no code changes: every `init` option in use, and the `withSentry` signature,
are unchanged and undeprecated across the intervening 31 minor releases.

The optional improvement available is `@sentry/hono`, stable since 10.55.0,
which supersedes the now-deprecated `honoIntegration` that `@sentry/cloudflare`
currently enables by default.

## Goals

1. Move every Sentry package to its latest stable version.
2. Replace the deprecated `honoIntegration` code path with `@sentry/hono`,
   gaining route-parametrized transaction names and middleware spans.
3. Keep the change verifiable locally and revertible in isolated pieces.

## Non-goals

- Upgrading to v11 or any prerelease.
- Flipping `compatibility_flags` from `nodejs_als` to `nodejs_compat`. See
  "Deferred work" for why this was considered and rejected.
- Adopting the `@sentry/cloudflare/nodejs_compat` entrypoint. It adds only
  Prisma and Vercel AI integrations, neither of which this project uses.
- The `apps/web/src/components/error-boundary.tsx:43` TODO about wiring the
  React error boundary into Sentry.
- Moving `@sentry/cli` from `dependencies` to `devDependencies` in
  `packages/api-handlers` and `packages/shared`. It is arguably misplaced for a
  build-time tool, but that is pre-existing and unrelated.

## Current integration surface

| Location                                       | What it does                                                  |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `apps/web/src/main.tsx:9`                      | `sentryInit` with browser tracing and replay integrations     |
| `packages/api-handlers/src/server/index.ts:31` | `withSentry<Env>(optionsCallback, honoApp)`                   |
| `apps/web/vite.config.ts:18`                   | `sentryVitePlugin`, gated behind the `WITH_SENTRY` env var    |
| `packages/api-handlers/package.json`           | `sentry:sourcemaps` script calling `sentry-cli`               |
| `packages/shared/package.json`                 | `sentry:sourcemaps` script calling `sentry-cli`               |
| `.github/workflows/reusable-sentry-operations.yaml` | `sentry-cli releases new` and `releases finalize`        |
| `package.json` `allowScripts`                  | pins exact `@sentry/cli` versions permitted to run installs   |

## Design

The work lands as two commits on one branch. The two halves have different risk
profiles: the version bump is mechanical and needs no source changes, while the
middleware adoption changes evaluation order relative to `cors()`. Splitting
them means a failure during local verification identifies its own cause, and
the middleware change can be reverted without giving up the version bump.

### Commit 1: dependency bump

Five installs, run from the repository root, pinned exact per the monorepo
convention:

```bash
npm install --save-exact --workspace apps/web @sentry/react@10.70.0
npm install --save-exact --workspace apps/web --save-dev @sentry/vite-plugin@5.4.0
npm install --save-exact --workspace packages/api-handlers @sentry/cloudflare@10.70.0
npm install --save-exact --workspace packages/api-handlers @sentry/cli@3.6.2
npm install --save-exact --workspace packages/shared @sentry/cli@3.6.2
```

Both `@sentry/cli` copies must move together or `npm run sherif`, which runs in
the pre-commit hook, fails on version inconsistency across workspaces.

Then one hand edit to the root `package.json` `allowScripts` block:

```diff
-    "@sentry/cli@2.58.5": true,
-    "@sentry/cli@3.2.2": true,
+    "@sentry/cli@2.58.6": true,
+    "@sentry/cli@3.6.2": true,
```

The `2.58.6` value above is illustrative, not authoritative. That key is
transitive: `@sentry/vite-plugin@5.4.0` restructured its internals from
`@sentry/bundler-plugin-core` to `@sentry/bundler-plugins@10.70.0`, which
depends on `@sentry/cli@^2.58.6`. Because that is a caret range, the exact key
must be read out of `package-lock.json` after install and whatever is actually
resolved must be used. A stale key does not error loudly; it silently stops the
package's install scripts from running.

No TypeScript source files change in this commit. The only edits are workspace
`package.json` version fields, the root `allowScripts` block, and the lockfile.

### Commit 2: `@sentry/hono` adoption

One install:

```bash
npm install --save-exact --workspace packages/api-handlers @sentry/hono@10.70.0
```

`@sentry/cloudflare` remains a dependency. It is an optional peer of
`@sentry/hono` pinned to the exact version `10.70.0`, and
`@sentry/hono/cloudflare` re-exports it wholesale. This is why both packages
must sit at the same version, which Commit 1 establishes.

`packages/api-handlers/src/server/index.ts` becomes:

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

honoApp.use('*', cors({ /* unchanged */ }));

honoApp.notFound((c) => {
    const { ASSETS } = env(c);
    return ASSETS.fetch(c.req.url);
});

export const routes = honoApp.route('/config', encodingApi);

export const app = honoApp;
```

Four properties of this shape were verified rather than assumed:

**Middleware ordering is load-bearing.** `sentry()` must be the first `.use()`,
ahead of `cors()`. Its returned middleware runs a request handler before
`await next()` and a response handler after, so it must be outermost to observe
`context.error` and to own root span naming. It must also be registered before
`.route()`: `applyPatches` wraps handlers at registration time, so anything
mounted earlier gets no middleware span, and the SDK logs a warning about
sub-apps mounted before `sentry()`.

**`sentry()` returns a middleware, not a wrapped app.** It calls `withSentry`
internally and discards the return value, relying on in-place mutation of the
Hono instance. `export const app = honoApp` is therefore correct, and
`export default app` in `apps/api/src/index.ts` needs no change because
`HonoBase` satisfies `ExportedHandler<Env>`.

**The typed RPC contract does not move.** Emitting declarations for the old and
new shapes produces a byte-identical `typeof routes`, so `hc<ApiAppType>` in
`apps/web/src/utils/api.ts` is unaffected. The explicit `withSentry<Env>`
generic disappears because `sentryEnv` infers as `Env` from `AppEnv['Bindings']`.

**Capture behavior is near-neutral.** `@sentry/cloudflare` already ships
`honoIntegration()` as a default integration, and its `defaultShouldHandleError`
already ignores 3xx and 4xx. `@sentry/hono` applies an equivalent default and
strips the Cloudflare `Hono` integration to prevent double capture. No
`shouldHandleError` override is configured, because the default already matches
current effective behavior and an explicit override would be unrequested
configuration.

`app` and `routes` become the same object reference under two names with
different static types, where today `app` is a distinct wrapper value. Both
exports are retained because both are consumed by name: `app` by
`apps/api/src/index.ts`, `routes` by the client contract.

## Verification

Local only. Run this sequence for each commit:

```bash
npm install
npm run sherif
npm run build
npm run check-types
npm run lint
npm run test
```

Build must precede test, for two reasons documented in the workspace guides.
`packages/api-handlers` and `apps/api` define no `check-types` script, so root
`check-types` skips them and their type errors surface only at build time. And
the test suites resolve `@repo/api-handlers/server` to built output while Vitest
runs outside Turbo, so a stale `dist` makes a passing run meaningless.

For Commit 2, additionally run `npm run dev` and probe the Worker:

| Probe                                                        | Establishes                                             |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| `POST /api/config/decode` with `{"encodedConfig":"garbage"}` | route resolution and handler execution survive          |
| `POST /api/config/decode` with `{}`                          | `zValidator` still runs beneath `sentry()`              |
| `OPTIONS /api/config/decode` with an `Origin` header         | `cors()` still functions now that `sentry()` precedes it |
| `GET /api/nope`                                              | `notFound` and the `ASSETS` fallback are intact          |

The CORS probe is the important one, since middleware reordering is the riskiest
part of the change.

The dev console must not contain `[hono] N sub-app(s) were mounted before
sentry()`. That warning would indicate the registration order is wrong.

Existing tests continue to pass unmodified. `apps/api/src/__tests__/index.test.ts`
asserts `app.routes` is a non-empty array, which holds more directly once `app`
is the Hono instance itself.

### Known verification gaps

`enabled: sentryEnv.APP_ENV !== 'local'` disables Sentry under `wrangler dev`.
The probes above establish that the application still works with the middleware
installed. They do not establish that events reach Sentry, that transaction
names are now route-parametrized, or that `@sentry/cli` 3.6.2 still uploads
source maps. Those surface only on deploy.

Exercising the enabled path locally would require setting `APP_ENV` to a
non-local value, which sends real events to the production Sentry project. That
is not part of this plan.

`@sentry/vite-plugin` is gated behind `WITH_SENTRY`, so its internal
restructure is the change least covered by local verification.

## Expected behavior changes

These follow from the version bump and are not defects:

- Session and crash-free-user metrics shift. 10.40.0 fixed session accounting so
  user id is consistently attached and the first soft navigation after pageload
  is no longer skipped. Alerts keyed to those metrics may fire.
- Bot traffic stops producing transactions. 10.44.0 skips
  `browserTracingIntegration` setup for bot user agents.
- Worker bundle grows by roughly 7 KB minified, 2.7 KB gzipped, from
  `@sentry/hono`.
- React routing spans gain `url.template`, `url.path`, and `url.full`
  attributes as of 10.65.0.

## Rollback

One `git revert` per commit. Reverting Commit 2 restores `withSentry` and leaves
the version bump in place. Reverting both returns to 10.39.0.

## Deferred work

**`nodejs_compat`.** `apps/api/wrangler.jsonc` sets
`compatibility_flags: ["nodejs_als"]`. Sentry v11 will require `nodejs_compat`
instead. It is not required at 10.70.0: `@sentry/hono` has no `node:` imports
and `@sentry/cloudflare` uses only `node:async_hooks`, which `nodejs_als`
supplies.

Flipping it now was considered and rejected. With `compatibility_date` at
`2025-02-04`, `nodejs_compat` auto-activates `nodejs_compat_v2`, which injects
`process` and `Buffer` globals into the Worker. Any transitive dependency that
branches on `typeof process !== 'undefined'` would change behavior, and
local-only verification cannot rule that out. The flag flip belongs with the v11
upgrade, where it is mandatory and can be verified against a deploy.
`no_nodejs_compat_v2` exists as an escape hatch if the injection proves to be
the problem.

**v11 upgrade.** Beyond the flag, the alpha migration notes list three items
touching this integration: `browserTracingIntegration` stops capturing user
timing spans by default, `replayIntegration` flips its session lifecycle default
from `route` to `page`, and `sendDefaultPii` is replaced by `dataCollection`
with a more permissive default. v11 also raises minimums to Node 20.19.0 and
TypeScript 5.0.4. Revisit once a stable release and a published migration guide
exist.

## Working tree note

`apps/api/wrangler.jsonc` (observability configuration) and the root
`package.json` `allowScripts` block carried uncommitted changes from `main` onto
this branch and will land alongside the Sentry work. The `allowScripts` edits in
Commit 1 build on that uncommitted block.
