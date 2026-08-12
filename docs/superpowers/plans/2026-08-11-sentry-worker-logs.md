# Sentry Worker Structured Logs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn on Sentry structured logs for the Cloudflare Worker and emit an
error log from the two encode/decode failure paths that currently vanish into a
400 response.

**Architecture:** Two properties are added to the existing `sentry()` middleware
options in the Worker's Hono app, which opens the log transport and tags the
environment. The two `catch` blocks in the encoding routes then call
`logger.error` before returning their existing 400 response. Response bodies do
not change, so the typed client contract consumed by `apps/web` is untouched.

**Tech Stack:** TypeScript (strict, `nodenext`), Hono, `@sentry/cloudflare`
10.70.0, `@sentry/hono` 10.70.0, Vitest, Wrangler, npm workspaces, Turborepo.

**Spec:** `docs/superpowers/specs/2026-08-11-sentry-worker-logs-design.md`

**Branch:** `feat/sentry-worker-logs` (already created; the spec is committed on it)

## Global Constraints

- All work happens inside `packages/api-handlers`. No new files, no new
  dependencies. `@sentry/cloudflare@10.70.0` is already a direct dependency.
- **`packages/api-handlers` has no `check-types` script.** The root
  `npm run check-types` and the husky pre-commit hook therefore skip this
  workspace entirely. Type errors surface only on build. Every task that
  changes TypeScript here must run
  `npm run build --workspace packages/api-handlers` as its typecheck gate.
- TypeScript is strict. No `any`. The existing `(error as Error)?.` casts in
  these catch blocks are the established pattern; match them.
- Do not hand-order imports. `@trivago/prettier-plugin-sort-imports` owns
  ordering, with all third-party modules in one alphabetical group. A new
  `@sentry/cloudflare` import sorts after `@repo/shared/...` and before `hono`
  (source) or `vitest` (test).
- `moduleResolution` is `nodenext`. Intra-package imports need an explicit
  `.js` extension; bare package specifiers like `@sentry/cloudflare` do not.
- No `CHANGELOG.md` entry. This is observability, not a user-facing change.
- Never commit `apps/api/.dev.vars`. It is gitignored
  (`apps/api/.gitignore:22`) and must be reverted to `APP_ENV=local` after
  Task 4.
- The working tree has unrelated uncommitted changes to `.claude/settings.json`
  and `apps/api/wrangler.jsonc`. Leave them alone. Stage files by name only.
- Commit trailer: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `packages/api-handlers/src/server/index.ts` | Hono app assembly and Sentry middleware registration | Modify: add `enableLogs` and `environment` to the `sentry()` options callback (lines 11-15) |
| `packages/api-handlers/src/server/encoding.ts` | `/encode` and `/decode` routes | Modify: add `logger` import; add a `logger.error` call to each of the two catch blocks (lines 82-84 and 99-101) |
| `packages/api-handlers/src/server/__tests__/encoding.test.ts` | Route-level tests for the above | Modify: mock `@sentry/cloudflare`; assert `logger.error` in the two existing error-path tests (lines 82-98 and 123-141) |

No files are created. No test file is created; both failure paths already have
tests that force the rejection, and those tests gain assertions.

---

### Task 1: Enable logs and tag the environment

Opens the Sentry log transport on the Worker and stops every event from being
reported as `production`. Nothing emits a log yet, so this task's deliverable is
verified by "still builds, still green", not by a new assertion. The live proof
comes in Task 4.

**Files:**
- Modify: `packages/api-handlers/src/server/index.ts:11-15`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: an initialized Sentry client with `enableLogs: true`, which is the
  precondition for the `logger.error` calls in Tasks 2 and 3 producing anything
  at runtime. No exported symbols change.

- [ ] **Step 1: Add the two options**

In `packages/api-handlers/src/server/index.ts`, replace the options callback so
it reads exactly:

```typescript
honoApp.use(
    sentry(honoApp, (sentryEnv) => ({
        dsn: 'https://895c486a1e653f07201b20658156b954@o4508580787781632.ingest.us.sentry.io/4509040320970752',
        tracesSampleRate: 1.0,
        enableLogs: true,
        environment: sentryEnv.APP_ENV,
        enabled: sentryEnv.APP_ENV !== 'local',
    }))
);
```

Do not change the `dsn`, `tracesSampleRate`, or `enabled` lines. `enableLogs`
defaults to `false`, which is the entire reason the Sentry Logs tab is empty.

Non-blocking follow-up, not a code change: `APP_ENV` is not set anywhere in
`.github/`, so its production value comes from the Cloudflare dashboard or is
unset. Confirm the dashboard value so the production log filter is known. If it
is unset, `environment: undefined` makes the SDK fall back to its own
`production` default, which is exactly the current behavior, so this task is
safe to land either way. Every span in the project today reports
`environment: production`, which is consistent with both possibilities.

- [ ] **Step 2: Typecheck**

Run: `npm run build --workspace packages/api-handlers`
Expected: exits 0 with no output beyond the `tsc && tsc-alias` banner. This is
the only typecheck that covers this workspace, and it compiles the test files
too, so it also catches type errors in the assertions added by Tasks 2 and 3.

- [ ] **Step 3: Confirm no regression**

Run: `npx vitest run packages/api-handlers/src/server/__tests__/index.test.ts`
Expected: PASS. This test only asserts that `app` and `routes` are defined; it
is a smoke check that the middleware still registers.

- [ ] **Step 4: Commit**

```bash
git add packages/api-handlers/src/server/index.ts
git commit -m "$(cat <<'EOF'
feat: enable Sentry structured logs on the Worker

enableLogs defaults to false, so the Sentry Logs product has never
received anything from this Worker. Also sets environment from APP_ENV,
which previously fell through to the SDK default of production for every
event including local runs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Log encode failures

`POST /api/config/encode` catches every error and returns a 400. Because the
handler returns normally, the Sentry Hono middleware never sees an exception, so
the failure produces no issue, no log, and no trace error. This task makes it
emit a log.

**Files:**
- Modify: `packages/api-handlers/src/server/encoding.ts` (import block, and the catch at lines 82-84)
- Test: `packages/api-handlers/src/server/__tests__/encoding.test.ts` (import block, module mocks, and the test at lines 82-98)

**Interfaces:**
- Consumes: `enableLogs: true` from Task 1.
- Produces: the `vi.mock('@sentry/cloudflare', ...)` block and the `logger`
  import in the test file, both of which Task 3 reuses as-is. The runtime
  signature relied on is `logger.error(message: string, attributes?: Record<string, unknown>): void`.

- [ ] **Step 1: Mock the Sentry module in the test file**

In `packages/api-handlers/src/server/__tests__/encoding.test.ts`, add the
`logger` import to the existing import block. Prettier will place it after
`@repo/shared/validators/config` and before `vitest`:

```typescript
import { logger } from '@sentry/cloudflare';
```

Then add this mock alongside the two `vi.mock` calls that already exist near the
top of the file (after the `@/utils/encoding` mock and the
`@repo/shared/utils/colors` mock):

```typescript
vi.mock('@sentry/cloudflare', () => ({
    logger: {
        error: vi.fn(),
    },
}));
```

This mock is safe to scope to the whole module: this test imports `encodingApi`
from `@/server/encoding.js` directly rather than the assembled server, so it
does not disturb the `@sentry/hono/cloudflare` import in
`packages/api-handlers/src/server/index.ts`. The existing
`vi.resetAllMocks()` in `beforeEach` clears the call record between tests, which
is what these assertions depend on.

- [ ] **Step 2: Add the failing assertion**

In the existing `should handle errors during encoding` test, add one assertion
at the end. The test already builds `mockError` as `new Error('Encoding failed')`
and rejects `encodeConfig` with it; leave all of that alone. The test becomes:

```typescript
        it('should handle errors during encoding', async () => {
            const mockError = new Error('Encoding failed');
            vi.mocked(encodeConfig).mockRejectedValue(mockError);

            const response = await encodingApi.request('/encode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockFormData),
            });
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData).toEqual({ error: mockError.message });
            expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to encode config', {
                error: 'Encoding failed',
            });
        });
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run packages/api-handlers/src/server/__tests__/encoding.test.ts -t "should handle errors during encoding"`
Expected: FAIL, reporting that the `logger.error` mock received 0 calls.

- [ ] **Step 4: Implement**

In `packages/api-handlers/src/server/encoding.ts`, add the import. Prettier will
place it after `@repo/shared/validators/config` and before `hono`:

```typescript
import { logger } from '@sentry/cloudflare';
```

Then replace the encode catch block. It is the one whose fallback string is
`'Error encoding config'`:

```typescript
        } catch (error) {
            logger.error('Failed to encode config', {
                error: (error as Error)?.message,
            });
            return c.json({ error: (error as Error)?.message ?? 'Error encoding config' }, 400);
        }
```

Leave the `return c.json(...)` line byte-identical. The response body is part of
the typed client contract.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run packages/api-handlers/src/server/__tests__/encoding.test.ts`
Expected: PASS, all 6 tests in the file.

- [ ] **Step 6: Typecheck**

Run: `npm run build --workspace packages/api-handlers`
Expected: exits 0. Remember the pre-commit hook does not typecheck this
workspace, so this step is the gate.

- [ ] **Step 7: Commit**

```bash
git add packages/api-handlers/src/server/encoding.ts packages/api-handlers/src/server/__tests__/encoding.test.ts
git commit -m "$(cat <<'EOF'
feat: log encode failures to Sentry

The encode route converts every thrown error into a 400 response, so the
Sentry Hono middleware never observes an exception and the failure is
invisible. Emit an error log before returning.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Log decode failures, including the wrapped cause

Same gap on `POST /api/config/decode`, with one extra wrinkle.
`decodeConfig` (`packages/api-handlers/src/utils/encoding.ts:33`) rethrows every
internal failure as `new Error('Invalid config', { cause: error })`, so
`(error as Error).message` is the constant string `"Invalid config"` no matter
what actually went wrong. A log carrying only that message says nothing useful.
The real failure lives on `cause`.

**Files:**
- Modify: `packages/api-handlers/src/server/encoding.ts` (the catch at lines 99-101)
- Test: `packages/api-handlers/src/server/__tests__/encoding.test.ts` (the test at lines 123-141)

**Interfaces:**
- Consumes: the `vi.mock('@sentry/cloudflare', ...)` block and the `logger`
  import added to the test file in Task 2, and the `logger` import added to
  `encoding.ts` in Task 2. Do not add either a second time.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Give the mock error a cause and add the failing assertion**

In the existing `should handle errors during decoding` test, change `mockError`
so it carries the cause `decodeConfig` really attaches, and add one assertion.
The test becomes:

```typescript
        it('should handle errors during decoding', async () => {
            const mockRequestData = {
                encodedConfig: 'invalid-encoded-config',
            };
            const mockError = new Error('Invalid config', {
                cause: new Error('Unsupported config encoding version'),
            });
            vi.mocked(decodeConfig).mockRejectedValue(mockError);

            const response = await encodingApi.request('/decode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockRequestData),
            });
            const responseData = await response.json();

            expect(response.status).toBe(400);
            expect(responseData).toEqual({ error: mockError.message });
            expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Failed to decode config', {
                error: 'Invalid config',
                cause: 'Unsupported config encoding version',
            });
        });
```

Adding the cause is what exercises the new attribute. The existing
`expect(responseData).toEqual({ error: mockError.message })` assertion still
holds, because `message` is still `'Invalid config'`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run packages/api-handlers/src/server/__tests__/encoding.test.ts -t "should handle errors during decoding"`
Expected: FAIL, reporting that the `logger.error` mock received 0 calls.

- [ ] **Step 3: Implement**

In `packages/api-handlers/src/server/encoding.ts`, replace the decode catch
block. It is the one whose fallback string is `'Error decoding config'`:

```typescript
        } catch (error) {
            const cause = (error as Error)?.cause;
            logger.error('Failed to decode config', {
                error: (error as Error)?.message,
                ...(cause instanceof Error ? { cause: cause.message } : {}),
            });
            return c.json({ error: (error as Error)?.message ?? 'Error decoding config' }, 400);
        }
```

The conditional spread is deliberate and must not be simplified to
`cause: String(cause)`. `String(undefined)` produces the literal string
`"undefined"`, which would ship a meaningless attribute to Sentry whenever an
error carries no cause. Omitting the key is unambiguous and does not depend on
how the SDK treats `undefined` attribute values. In practice `decodeConfig`
always attaches an `Error` cause; the guard covers something other than
`decodeConfig` throwing inside the `try`.

Do not add the `logger` import again. Task 2 already added it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run packages/api-handlers/src/server/__tests__/encoding.test.ts`
Expected: PASS, all 6 tests in the file.

- [ ] **Step 5: Typecheck**

Run: `npm run build --workspace packages/api-handlers`
Expected: exits 0.

- [ ] **Step 6: Run the full suite**

Run: `npm run test:ci`
Expected: PASS with exactly 200 tests across 18 files. That is the verified
baseline measured on this branch before implementation began, and this plan adds
assertions to existing tests rather than new test cases, so the count must not
move. A different count means something was added or lost by accident.

- [ ] **Step 7: Commit**

```bash
git add packages/api-handlers/src/server/encoding.ts packages/api-handlers/src/server/__tests__/encoding.test.ts
git commit -m "$(cat <<'EOF'
feat: log decode failures to Sentry

decodeConfig rethrows everything as Error('Invalid config', { cause }),
so the message alone identifies nothing. Log the cause message alongside
it, omitting the attribute when there is no Error cause.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Live local verification

The unit tests prove `logger.error` is called. They do not prove Sentry ingests
anything, which is the exact thing that was broken. This task is the only
end-to-end proof, and it is required before merging.

It matters because production will not demonstrate this for you. A 90 day span
query over these two routes returned 12 completed `http.server` spans, every one
HTTP 200. Neither catch block has fired in production in that window, so after
merge the Logs tab stays empty until something genuinely breaks.

Nothing in this task is committed.

**Files:**
- Modify temporarily, never commit: `apps/api/.dev.vars`

**Interfaces:**
- Consumes: all three preceding tasks, merged into the working tree.
- Produces: nothing. This is a verification gate.

- [ ] **Step 1: Lift the local kill switch**

The SDK is disabled locally by `enabled: sentryEnv.APP_ENV !== 'local'`, and
`apps/api/.dev.vars` contains exactly `APP_ENV=local`. Edit that file to read:

```
APP_ENV=development
```

The file is gitignored, so this cannot be committed by accident. It still must
be reverted in Step 5.

- [ ] **Step 2: Start the Worker**

Run: `npm run dev --workspace apps/api`
Expected: wrangler starts and serves on `http://localhost:8787`.

- [ ] **Step 3: Trigger the decode catch block**

From a second shell:

```bash
curl -X POST localhost:8787/api/config/decode \
  -H 'Content-Type: application/json' \
  -d '{"encodedConfig":"garbage"}'
```

Expected: HTTP 400 with body `{"error":"Invalid config"}`. The payload fails the
`v4.` version prefix check inside `decodeConfig`, which is what routes it into
the catch block.

Use `curl`, not the SPA. Moving `APP_ENV` off `local` also changes the CORS
origin predicate at `packages/api-handlers/src/server/index.ts:23`, which admits
any origin only when `APP_ENV === 'local'`. A browser request from the Vite dev
server would be rejected. `curl` sends no `Origin` header, so the check does not
apply.

- [ ] **Step 4: Confirm the log reached Sentry**

Open the Logs view for the `wits-api` project in the `brian-sokol` org and
filter on `environment:development`:

https://brian-sokol.sentry.io/explore/logs/?logsQuery=&project=4509040320970752&statsPeriod=24h

Expected: a `Failed to decode config` entry at error severity, with an `error`
attribute of `Invalid config` and a `cause` attribute naming the real underlying
failure.

If nothing arrives, add `debug: true` to the `sentry()` options in
`packages/api-handlers/src/server/index.ts` temporarily and re-run. A Worker
flushes Sentry envelopes through `waitUntil`, and a silent drop during flush is
the usual failure mode. Remove `debug: true` before committing anything.

- [ ] **Step 5: Revert the kill switch**

Edit `apps/api/.dev.vars` back to:

```
APP_ENV=local
```

Run: `git status --short`
Expected: `apps/api/.dev.vars` does not appear (it is gitignored). The only
entries should be the pre-existing unrelated changes to `.claude/settings.json`
and `apps/api/wrangler.jsonc`. If any file under `packages/api-handlers` is
still dirty, a debug edit was left behind; revert it.

---

## Done when

- `enableLogs: true` and `environment` are set on the Worker Sentry init.
- Both encode and decode catch blocks call `logger.error` before returning 400.
- Both existing error-path tests assert the call; `npm run test:ci` is green.
- `npm run build --workspace packages/api-handlers` exits 0.
- A `Failed to decode config` log has been observed in Sentry under
  `environment:development` from a local run.
- `apps/api/.dev.vars` reads `APP_ENV=local`, and no debug edits remain.
