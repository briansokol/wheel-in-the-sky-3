# Sentry Structured Logs for the Cloudflare Worker

Date: 2026-08-11
Branch: `feat/sentry-worker-logs`

## Context

The Logs tab of the Sentry project is empty. Errors and traces arrive normally.
This followed the 10.39.0 to 10.70.0 upgrade in #33, which made the upgrade look
like the cause. It is not.

`enableLogs` is a top level `init` option that defaults to `false`. In the
installed SDK this is declared at
`node_modules/@sentry/core/build/types/types/options.d.ts:530`:

```typescript
/**
 * If logs support should be enabled.
 *
 * @default false
 */
enableLogs?: boolean;
```

The older `_experiments.enableLogs` form still exists at line 421 of the same
file, marked `@deprecated Use the top level enableLogs option instead`.

Neither `init` call in this repository has ever set either form:

- `apps/web/src/main.tsx:9`, the browser init
- `packages/api-handlers/src/server/index.ts:11`, the Worker init

Sentry's Logs product has therefore received nothing since it shipped. The
upgrade changed no behavior here.

Enabling the option is necessary but not sufficient. It opens the transport; it
does not produce logs. Logs come from explicit `logger.*` calls or from
`consoleLoggingIntegration()`, which forwards `console.*` output. The Worker
source tree (`packages/api-handlers/src`, excluding `__tests__`) contains zero
`console.*` calls, so flipping the flag alone would leave the Logs tab exactly
as empty as it is now.

## Goals

1. Enable Sentry structured logs on the Cloudflare Worker.
2. Emit logs from the two failure paths that are currently invisible to Sentry.
3. Make the change verifiable locally, against the real Sentry project, without
   polluting production data.

## Non-goals

- The browser side (`apps/web/src/main.tsx`). Worker only, by decision.
- `consoleLoggingIntegration()`. See "Considered and rejected".
- The uncommitted `apps/api/wrangler.jsonc` observability edit in the working
  tree. That is Cloudflare Workers Logs, a separate system from Sentry.
- A `CHANGELOG.md` entry. This is observability, not a user facing change.
- The `apps/web/src/components/error-boundary.tsx:43` TODO about wiring the
  React error boundary into Sentry. Still open, still out of scope.

## Current integration surface

| Location                                              | State                                               |
| ----------------------------------------------------- | --------------------------------------------------- |
| `packages/api-handlers/src/server/index.ts:11`        | `sentry()` middleware, no `enableLogs`, no `environment` |
| `packages/api-handlers/src/server/encoding.ts:82`     | encode failure swallowed into a 400 response        |
| `packages/api-handlers/src/server/encoding.ts:99`     | decode failure swallowed into a 400 response        |
| `apps/api/.dev.vars`                                  | `APP_ENV=local`, gitignored via `apps/api/.gitignore:22` |
| `packages/api-handlers/package.json`                  | `@sentry/cloudflare@10.70.0` is already a direct dependency |

### Why the two catch blocks matter

Both routes convert a thrown error into a normal `400` JSON response:

```typescript
} catch (error) {
    return c.json({ error: (error as Error)?.message ?? 'Error decoding config' }, 400);
}
```

Because the handler returns normally, the Sentry Hono middleware never observes
an exception. These failures produce no issue, no log, and no trace error today.
They are entirely invisible.

## Design

Three file edits, all inside `packages/api-handlers`: the server init, the
encoding routes, and their existing test. No new files, no new dependencies.

### Change 1: enable logs and tag the environment

`packages/api-handlers/src/server/index.ts`, two properties added to the
existing options callback:

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

`environment` exists to make local verification safe. Without it, every event
the SDK sends defaults to `production`, so a log emitted from a laptop is
indistinguishable in the Sentry UI from a log emitted by real traffic. With it,
the live test in the verification section below is filterable and disposable.

`APP_ENV` is not set anywhere in `.github/`, so its production value comes from
the Cloudflare dashboard or is unset. If unset, `environment: undefined` makes
the SDK fall back to its own `production` default, which is the current
behavior. The change is safe either way. Confirm the dashboard value so the
production filter is known.

### Change 2: emit from the swallowed catch blocks

`packages/api-handlers/src/server/encoding.ts` gains one import:

```typescript
import { logger } from '@sentry/cloudflare';
```

`@sentry/cloudflare@10.70.0` is already a direct dependency of this workspace.
`logger` is re-exported from `@sentry/core`; its runtime shape is an object
carrying `fmt`, `debug`, `error`, `fatal`, `info`, `trace`, and `warn`. The
signature is `logger.error(message, attributes?)`. Import placement is left to
`@trivago/prettier-plugin-sort-imports`.

The encode catch block:

```typescript
} catch (error) {
    logger.error('Failed to encode config', {
        error: (error as Error)?.message,
    });
    return c.json({ error: (error as Error)?.message ?? 'Error encoding config' }, 400);
}
```

The decode catch block additionally records `cause`:

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

The asymmetry is deliberate. `decodeConfig`
(`packages/api-handlers/src/utils/encoding.ts:33`) rethrows every internal
failure as `new Error('Invalid config', { cause: error })`, so
`(error as Error).message` is the constant string `"Invalid config"` regardless
of what actually went wrong. A log carrying only that message conveys no
information beyond the fact that a decode failed. The real failure lives on
`cause`. `encodeConfig` performs no such wrapping, so its message is already
the original one and no `cause` line is warranted.

The conditional spread, rather than a plain `String(cause)`, exists because
`String(undefined)` produces the literal string `"undefined"`, which would ship
a meaningless attribute to Sentry on any error that carries no cause. Omitting
the key is unambiguous and does not depend on how the SDK happens to treat
`undefined` attribute values. In practice `decodeConfig` always attaches an
`Error` cause, so the attribute is present on every log this block emits; the
guard covers the case where something other than `decodeConfig` throws inside
the `try`.

Response bodies are unchanged in both blocks, so the `hc<ApiAppType>` client
contract consumed by `apps/web` is unaffected.

### Change 3: assert the calls in the existing tests

`packages/api-handlers/src/server/__tests__/encoding.test.ts` already covers
both failure paths and already forces the rejection:

- `should handle errors during encoding` at line 82
- `should handle errors during decoding` at line 123

No new test file. Both gain an explicit assertion, backed by a module mock at
the top of the file alongside the existing `vi.mock` calls:

```typescript
vi.mock('@sentry/cloudflare', () => ({
    logger: {
        error: vi.fn(),
    },
}));
```

The test file imports `logger` from `@sentry/cloudflare` alongside its existing
imports in order to assert against it.

In the encoding test, whose `mockError` is `new Error('Encoding failed')`:

```typescript
expect(logger.error).toHaveBeenCalledWith('Failed to encode config', {
    error: 'Encoding failed',
});
```

In the decoding test, whose `mockError` changes from `new Error('Invalid config')`
to carry the cause that `decodeConfig` really attaches:

```typescript
const mockError = new Error('Invalid config', {
    cause: new Error('Unsupported config encoding version'),
});

expect(logger.error).toHaveBeenCalledWith('Failed to decode config', {
    error: 'Invalid config',
    cause: 'Unsupported config encoding version',
});
```

Adding the cause to that mock makes it faithful to what `decodeConfig` throws
and is what exercises the `cause` attribute. The test's existing
`expect(responseData).toEqual({ error: mockError.message })` assertion is
unaffected, since `message` is still `'Invalid config'`.

The mock is contained: this test imports `encodingApi` from
`@/server/encoding.js` directly rather than the assembled server, so mocking
`@sentry/cloudflare` here does not disturb the `@sentry/hono/cloudflare` import
in `packages/api-handlers/src/server/index.ts` or its own test file. The
existing `vi.resetAllMocks()` in `beforeEach` is compatible, since these
assertions check call records rather than implementations.

## Local verification

Run once, by hand, before merging. Nothing here is committed.

The SDK is disabled locally by `enabled: sentryEnv.APP_ENV !== 'local'`, and
`apps/api/.dev.vars` contains exactly `APP_ENV=local`. That file is gitignored
(`apps/api/.gitignore:22`), so editing it carries no risk of being committed.

1. Edit `apps/api/.dev.vars`, changing `APP_ENV=local` to `APP_ENV=development`.
2. Start the Worker: `npm run dev --workspace apps/api`.
3. Trigger the decode catch block with a payload that fails the `v4.` version
   check:

   ```bash
   curl -X POST localhost:8787/api/config/decode \
     -H 'Content-Type: application/json' \
     -d '{"encodedConfig":"garbage"}'
   ```

   Expect a `400` with `{"error":"Invalid config"}`.

4. In Sentry, open the Logs tab and filter on `environment:development`. Expect
   a `Failed to decode config` entry whose `cause` attribute names the real
   underlying failure.
5. Revert `apps/api/.dev.vars` to `APP_ENV=local`.

Two constraints on this procedure:

- Use `curl`, not the SPA. Moving `APP_ENV` off `local` also changes the CORS
  origin check at `packages/api-handlers/src/server/index.ts:23`, which admits
  any origin only when `APP_ENV === 'local'`. A browser request from the Vite
  dev server would be rejected. `curl` sends no `Origin` header, so the check
  does not apply.
- If nothing arrives, add `debug: true` to the init temporarily to surface SDK
  output in the wrangler console. A Worker flushes Sentry envelopes through
  `waitUntil`, and a silent drop during flush is the usual failure mode.

Automated verification is the existing suite: `npm run test` for the full run,
plus the `check-types`, `sherif`, and `lint-staged` steps the pre-commit hook
already enforces.

## Considered and rejected

**`consoleLoggingIntegration()`.** Forwards `console.*` calls to Sentry as
structured logs with no call site changes. Rejected because the Worker source
emits no `console.*` calls at all, so it would forward nothing and the Logs tab
would stay empty. It remains a reasonable future addition once console calls
exist.

**`captureException` instead of `logger.error`.** Would surface these failures
as Sentry issues rather than logs. Defensible, and arguably right for the encode
path, where a failure is genuinely unexpected. Rejected for now because the
stated goal is populating the Logs product, and a deliberately handled 400 is
log shaped rather than issue shaped. Revisit if these turn out to fire often
enough to warrant alerting.

**A separate Sentry project for local development.** The cleanest isolation for
the live test, but it requires new infrastructure to solve a problem that the
`environment` tag already solves adequately.
