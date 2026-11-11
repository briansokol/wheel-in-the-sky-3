# Remove the Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encode and decode wheel configs in the browser, carry them in a `#c=`
fragment using a slimmer link format, and deploy the app as static assets with
no Worker code.

**Architecture:** The codec, the link format, and the form-to-config mapping
move into `@repo/shared` and are validated with Zod on every decode. `apps/web`
reads the config from `location.hash`, decodes it locally, and owns the wrangler
config for an assets-only deployment. `apps/api` and `packages/api-handlers`
are deleted.

**Tech Stack:** TypeScript, Zod 4, `CompressionStream` (`deflate-raw`), React
19, React Router 7, React Hook Form with `@hookform/resolvers`, Vite, Vitest,
Cloudflare Workers static assets.

**Spec:** `docs/production-readiness-review.md`, sections "Decision
(2026-11-10)" and "Link encoding", plus blockers 1 and 2.

## Global Constraints

- Phase 0 ships as its own branch and pull request and must be merged before
  Phase 1 starts. Phase 1 is one feature branch.
- Install dependencies from the repo root, targeting a workspace, pinned
  exactly: `npm install --save-exact --workspace <path> <package>@<version>`.
  Never `cd` into a workspace to install.
- Filenames are kebab-case. Tests live in a `__tests__/` directory beside the
  code, named `<subject>.test.ts(x)`.
- TypeScript is strict. No `any`. Explicit parameter and return types. JSDoc on
  exported functions.
- Inside `packages/shared`, imports use the `@/` alias and carry a `.js`
  extension (`moduleResolution` is `nodenext`). Inside `apps/web`, imports use
  `@/` with no extension.
- Do not hand-order imports; Prettier sorts them.
- `apps/web` resolves `@repo/shared` from its `dist`. After changing shared
  code, run `npm run build --workspace packages/shared` before running web
  tests or typechecks.
- There are no users of the current `v4.` format or of `?c=` links. Neither
  gets a fallback decoder or a migration. Only v2 links (`/:oldId`) must keep
  working.
- Removed winners stay in memory only. Do not add persistence.
- Every commit must pass the husky hook (sherif, typecheck, lint-staged). End
  commit messages with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Out of Scope

Tracked in the spec, not done here: the functional bugs in blocker 4, security
headers, the Sentry SDK major upgrade and CI source map variables, folding the
three config packages into the root, consuming `@repo/shared` as source, and
the front-end state cleanup. Sentry Session Replay may still record the
fragment; Task 8 scrubs events, transactions, and breadcrumbs only, and Replay
needs a separate check.

## Review Focus

1. **A truncated or corrupted link** (a `#c=` value cut off when pasted from
   chat): the wheel page shows its "Unable to load wheel" card. Tests: Task 3
   step 1 (`rejects a truncated string`), Task 5 step 1 (`reports an error`).
2. **Unicode and emoji in names**: they survive a round trip unchanged. Test:
   Task 3 step 1.
3. **A maximum-size wheel** (500 names of 200 characters): encodes and decodes
   without a `RangeError`. Test: Task 3 step 1.
4. **Extra content in the fragment** (`#c=abc&utm=1`, or no `c` at all): only
   the `c` value is read; a missing `c` means "no config". Test: Task 5 step 1.
5. **A v2 link whose colors are not hex** (`rgb(...)`, named colors): it
   converts to hex instead of failing validation and landing on the 404 page.
   Test: Task 6 step 1.

## File Structure

Created:

| File                                            | Responsibility                                         |
| ----------------------------------------------- | ------------------------------------------------------ |
| `.github/dependabot.yml`                        | Weekly grouped dependency updates                      |
| `packages/shared/src/constants/limits.ts`       | Size limits shared by the form and the link format     |
| `packages/shared/src/validators/hex-color.ts`   | The one hex color schema                               |
| `packages/shared/src/validators/wire-config.ts` | Zod schema for the serialized link payload             |
| `packages/shared/src/utils/wire-config.ts`      | `Config` to and from the link payload                  |
| `packages/shared/src/utils/encoding.ts`         | Compress, base64url, version prefix, size caps         |
| `packages/shared/src/utils/form-config.ts`      | Form inputs to `Config` (was the `/encode` route body) |
| `apps/web/src/hooks/encoded-config.ts`          | Reads the `c` value from the URL fragment              |
| `apps/web/src/utils/sentry-scrub.ts`            | Redacts the `c` value from URLs sent to Sentry         |
| `apps/web/wrangler.jsonc`                       | Assets-only deployment config (moved from `apps/api`)  |

Deleted: `apps/api/` (all), `packages/api-handlers/` (all),
`apps/web/src/utils/api.ts`, `apps/web/src/hooks/changelog.ts` and its test.

---

## Phase 0: Dependency upgrades (prerequisite, separate PR)

### Task 1: Upgrade vulnerable dependencies

**Files:**

- Modify: `package.json`, `apps/web/package.json`, `apps/api/package.json`,
  `packages/shared/package.json`, `packages/api-handlers/package.json`,
  `package-lock.json`, `apps/web/turbo.json`, `apps/api/turbo.json`
- Create: `.github/dependabot.yml`

All upgrades stay inside the current major version. Versions are the fixes
reported by `npm audit` on 2026-11-10.

- [ ] **Step 1: Branch and record the baseline**

```bash
git switch -c chore/dependency-upgrades
npm audit 2>&1 | tail -3
```

Expected: `33 vulnerabilities (2 low, 9 moderate, 18 high, 4 critical)`.

- [ ] **Step 2: Upgrade runtime dependencies**

```bash
npm install --save-exact --workspace apps/api --workspace packages/api-handlers hono@4.13.17
npm install --save-exact --workspace packages/shared --workspace packages/api-handlers zod@4.6.7
npm install --save-exact --workspace packages/shared --workspace apps/web nanoid@5.1.16
npm install --save-exact --workspace apps/web react-router@7.18.5
```

- [ ] **Step 3: Upgrade dev dependencies**

```bash
npm install --save-exact --save-dev --workspace apps/web vite@7.3.8 postcss@8.5.32
npm install --save-exact --save-dev --workspace apps/api wrangler@4.160.0
npm install --save-exact --save-dev --workspace packages/shared --workspace packages/api-handlers concurrently@9.2.5
npm install --save-exact --save-dev --workspace apps/web --workspace packages/shared --workspace packages/api-handlers vitest@4.1.12 @vitest/coverage-v8@4.1.12
npm install --save-exact --save-dev turbo@2.11.10 vitest@4.1.12 @vitest/coverage-v8@4.1.12
```

In `apps/web/turbo.json` and `apps/api/turbo.json`, change the `$schema` host
from `v2-8-10.turborepo.dev` to `v2-11-10.turborepo.dev`.

- [ ] **Step 4: Fix transitive advisories**

Run: `npm audit fix` (never `--force`).

- [ ] **Step 5: Add `.github/dependabot.yml`**

Two update entries, both `interval: weekly`: `package-ecosystem: npm` at
`directory: /` with one group named `minor-and-patch` covering
`update-types: [minor, patch]`, and `package-ecosystem: github-actions` at
`directory: /`.

- [ ] **Step 6: Verify**

```bash
npm run sherif && npm run check-types && npm run lint && npm run build && npx vitest run
npm audit 2>&1 | tail -3
```

Expected: every command passes with 252 tests, and `npm audit` reports no
critical or high advisories. The `@sentry/vite-plugin` chain (moderate, needs a
major upgrade) is the known remainder; list anything else that remains in the
pull request description.

- [ ] **Step 7: Commit and open the pull request**

```bash
git add -A
git commit -m "chore: upgrade vulnerable dependencies and add dependabot"
```

No `CHANGELOG.md` entry: nothing user-facing changes.

---

## Phase 1: Remove the server

Start from `main` after Phase 0 is merged: `git switch -c feat/remove-server`.

### Task 2: Link payload schema and mapping

**Files:**

- Create: `packages/shared/src/constants/limits.ts`,
  `packages/shared/src/validators/hex-color.ts`,
  `packages/shared/src/validators/wire-config.ts`,
  `packages/shared/src/utils/wire-config.ts`
- Modify: `packages/shared/src/classes/config.ts` (`generateId`)
- Test: `packages/shared/src/utils/__tests__/wire-config.test.ts`

**Interfaces:**

- Consumes: `Config`, `buildWheelColorConfig`, `buildPageColorConfig`
  (`@/utils/configs.js`), `DEFAULT_BASE_COLOR`, `DEFAULT_BACKGROUND_COLOR`,
  `DEFAULT_FOREGROUND_COLOR`, `INVERSE_FOREGROUND_COLOR`.
- Produces:
  - `limits.ts`: `MAX_NAMES = 500`, `MAX_NAME_LENGTH = 200`,
    `MAX_TITLE_LENGTH = 100`, `MAX_DESCRIPTION_LENGTH = 300`,
    `MAX_CUSTOM_COLORS = 50`, `MAX_ENCODED_LENGTH = 200_000`,
    `MAX_DECODED_BYTES = 262_144`, `CONFIG_ID_LENGTH = 10`
  - `hexColorSchema` (Zod string schema)
  - `wireConfigSchema`, `type WireConfig`
  - `toWireConfig(config: Config): WireConfig`
  - `fromWireConfig(wire: WireConfig): Config`

- [ ] **Step 1: Write the failing tests**

```ts
describe('toWireConfig', () => {
  it('omits everything that equals a default', () => {
    const config = new Config().setId('abc').setNames('A\nB');
    expect(toWireConfig(config)).toEqual({ i: 'abc', n: ['A', 'B'] });
  });

  it('stores only the type for gradient page themes', () => {
    const config = new Config().setId('abc').setNames('A');
    config.pageColorConfig = buildPageColorConfig(PageColorType.GradientDawn, '', '');
    expect(toWireConfig(config).p).toEqual({ t: PageColorType.GradientDawn });
  });

  it('stores the background but not the foreground for a single-color page', () => {
    const config = new Config().setId('abc').setNames('A');
    config.pageColorConfig = buildPageColorConfig(PageColorType.Single, '#ffffff', '#111111');
    expect(toWireConfig(config).p).toEqual({ t: PageColorType.Single, b: '#ffffff' });
  });
});

describe('fromWireConfig', () => {
  it('derives the foreground from a single-color background', () => {
    const config = fromWireConfig({ i: 'abc', n: ['A'], p: { t: PageColorType.Single, b: '#ffffff' } });
    expect(config.pageColorConfig.foregroundColor).toBe(INVERSE_FOREGROUND_COLOR);
  });

  it.each([
    buildWheelColorConfig(WheelColorType.Random, '', [], false),
    buildWheelColorConfig(WheelColorType.Monochromatic, '#4062bf', [], true),
    buildWheelColorConfig(WheelColorType.Analogous, '#4062bf', [], false),
    buildWheelColorConfig(WheelColorType.Triad, '#4062bf', [], false),
    buildWheelColorConfig(WheelColorType.Tetrad, '#4062bf', [], false),
    buildWheelColorConfig(WheelColorType.Custom, '', ['#ff0000', '#00ff00'], false),
  ])('round-trips wheel color config %#', (wheelColorConfig) => {
    const config = new Config().setTitle('T').setDescription('D').setNames('A\nB');
    config.setRandomizeOrder(false).setShowNames(false);
    config.wheelColorConfig = wheelColorConfig;
    expect(fromWireConfig(toWireConfig(config)).serialize()).toEqual(config.serialize());
  });
});

describe('wireConfigSchema', () => {
  it.each([
    ['no names', { i: 'abc', n: [] }],
    ['a non-color background', { i: 'abc', n: ['A'], p: { t: 4, b: 'url(https://example.com/x.png)' } }],
    ['an unknown wheel color type', { i: 'abc', n: ['A'], w: { t: 99 } }],
    ['too many names', { i: 'abc', n: Array.from({ length: MAX_NAMES + 1 }, () => 'A') }],
    ['an over-long name', { i: 'abc', n: ['A'.repeat(MAX_NAME_LENGTH + 1)] }],
  ])('rejects %s', (_label, input) => {
    expect(wireConfigSchema.safeParse(input).success).toBe(false);
  });
});

it('generates ids of CONFIG_ID_LENGTH characters', () => {
  expect(Config.generateId()).toHaveLength(CONFIG_ID_LENGTH);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run packages/shared/src/utils/__tests__/wire-config.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Add `limits.ts` and `hex-color.ts`**

`hexColorSchema` is
`z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, 'Enter a hex color like #4062bf')`.

- [ ] **Step 4: Add `validators/wire-config.ts`**

```ts
export const wireConfigSchema = z.object({
  i: z.string().min(1).max(21),
  t: z.string().max(MAX_TITLE_LENGTH).optional(),
  d: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
  n: z.array(z.string().min(1).max(MAX_NAME_LENGTH)).min(1).max(MAX_NAMES),
  r: z.literal(false).optional(), // randomizeOrder; absent means true
  s: z.literal(false).optional(), // showNames; absent means true
  w: z
    .object({
      t: z.enum(WheelColorType),
      b: hexColorSchema.optional(),
      r: z.literal(true).optional(), // randomizeColor; absent means false
      c: z.array(hexColorSchema).max(MAX_CUSTOM_COLORS).optional(),
    })
    .optional(), // absent means Random
  p: z.object({ t: z.enum(PageColorType), b: hexColorSchema.optional() }).optional(), // absent means GradientNight
});

export type WireConfig = z.infer<typeof wireConfigSchema>;
```

- [ ] **Step 5: Implement `toWireConfig` and `fromWireConfig` in `utils/wire-config.ts`**

`toWireConfig` writes `t`/`d` only when non-empty, `r`/`s` only when `false`,
`w` only when the type is not `Random` (`b` for the four base-color types, `r`
only when `true`, `c` only for `Custom`), and `p` only when the type is not
`GradientNight` (`b` only for `Single`). `fromWireConfig` rebuilds the color
configs with `buildWheelColorConfig` and `buildPageColorConfig`, falling back
to `DEFAULT_BASE_COLOR` and `DEFAULT_BACKGROUND_COLOR`, and derives the
single-color foreground with `new TinyColor(background).isDark()` exactly as
`apps/web/src/components/wheel-preview.tsx` does today.

- [ ] **Step 6: Change `Config.generateId` to return `nanoid(CONFIG_ID_LENGTH)`**

- [ ] **Step 7: Run to verify pass**

Run: `npx vitest run packages/shared`
Expected: PASS, including the existing `config.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add slim link payload schema and mapping"
```

### Task 3: Client-side codec

**Files:**

- Create: `packages/shared/src/utils/encoding.ts`
- Test: `packages/shared/src/utils/__tests__/encoding.test.ts`

**Interfaces:**

- Consumes: `toWireConfig`, `fromWireConfig`, `wireConfigSchema`,
  `MAX_ENCODED_LENGTH`, `MAX_DECODED_BYTES` (Task 2).
- Produces:
  - `CONFIG_ENCODING_VERSION = 'v5.'`
  - `encodeConfig(config: Config): Promise<string>`
  - `decodeConfig(encodedConfig: string): Promise<Config>`; every failure
    rejects with `new Error('Invalid config', { cause })`.

- [ ] **Step 1: Write the failing tests**

```ts
import { deflateRawSync } from 'node:zlib';

function makeConfig(names: string): Config {
  return new Config().setTitle('Standup').setNames(names);
}

/** Builds a syntactically valid link around an arbitrary payload. */
function wrap(payload: string | Buffer): string {
  return `${CONFIG_ENCODING_VERSION}${deflateRawSync(payload).toString('base64url')}`;
}

describe('encodeConfig', () => {
  it('produces a versioned base64url string', async () => {
    expect(await encodeConfig(makeConfig('A\nB'))).toMatch(/^v5\.[A-Za-z0-9_-]+$/);
  });
});

describe('decodeConfig', () => {
  it('round-trips a config', async () => {
    const config = makeConfig('A\nB\nC');
    expect((await decodeConfig(await encodeConfig(config))).serialize()).toEqual(config.serialize());
  });

  it('round-trips unicode and emoji names', async () => {
    const config = makeConfig('Zoë\n田中\n🎉 Party');
    expect((await decodeConfig(await encodeConfig(config))).names).toEqual(['Zoë', '田中', '🎉 Party']);
  });

  it('round-trips a maximum-size wheel', async () => {
    const names = Array.from({ length: MAX_NAMES }, (_, i) => `${i}`.padEnd(MAX_NAME_LENGTH, 'x'));
    const config = makeConfig(names.join('\n'));
    expect((await decodeConfig(await encodeConfig(config))).names).toHaveLength(MAX_NAMES);
  });

  it.each([
    ['the old v4 prefix', 'v4.H4sIAAAAAAAAA6tWKkktLlGyUlAqS8wpTgUAEq0RXhQAAAA'],
    ['a string with no prefix', 'abc'],
    ['invalid base64', 'v5.!!!!'],
    ['valid JSON that fails the schema', wrap(JSON.stringify({ i: 'abc', n: [] }))],
    ['a non-JSON payload', wrap('not json')],
    ['an over-long input', `v5.${'A'.repeat(MAX_ENCODED_LENGTH)}`],
    ['a payload that inflates past the cap', wrap(Buffer.alloc(MAX_DECODED_BYTES + 1, 0x20))],
  ])('rejects %s', async (_label, input) => {
    await expect(decodeConfig(input)).rejects.toThrow('Invalid config');
  });

  it('rejects a truncated string', async () => {
    const encoded = await encodeConfig(makeConfig('A\nB\nC'));
    await expect(decodeConfig(encoded.slice(0, -8))).rejects.toThrow('Invalid config');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run packages/shared/src/utils/__tests__/encoding.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `encodeConfig` and `decodeConfig`**

Encode: `JSON.stringify(toWireConfig(config))`, through
`new CompressionStream('deflate-raw')`, to unpadded base64url, prefixed with
`CONFIG_ENCODING_VERSION`. Convert bytes to a binary string in chunks of
`0x8000` before `btoa`; do not spread the whole array into
`String.fromCharCode` (that is the `RangeError` in the old implementation).

Decode, in this order, each failure wrapped as `Invalid config`: reject input
longer than `MAX_ENCODED_LENGTH`; require the prefix; base64url-decode; inflate
with `new DecompressionStream('deflate-raw')`, reading chunk by chunk and
cancelling the reader as soon as the running total exceeds `MAX_DECODED_BYTES`;
`JSON.parse`; `wireConfigSchema.parse`; `fromWireConfig`.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run packages/shared`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add validated client-side config codec"
```

### Task 4: Form inputs to Config

**Files:**

- Create: `packages/shared/src/utils/form-config.ts`
- Modify: `packages/shared/src/validators/config.ts` (`configFormInputsSchema`)
- Test: `packages/shared/src/utils/__tests__/form-config.test.ts`

**Interfaces:**

- Consumes: limits and `hexColorSchema` (Task 2); `buildWheelColorConfig`,
  `buildPageColorConfig`.
- Produces: `configFromFormInputs(formData: ConfigFormInputs): Config`. It
  calls `configFormInputsSchema.parse(formData)` first and so throws a
  `ZodError` on invalid input. `ConfigFormInputs` keeps every field's current
  TypeScript type (`colorSchemeType` and `backgroundColorType` stay `string`).

- [ ] **Step 1: Write the failing tests**

Port every `/encode` case from
`packages/api-handlers/src/server/__tests__/encoding.test.ts`, calling
`configFromFormInputs` and asserting on the returned `Config` instead of the
HTTP response. Add:

```ts
const valid: ConfigFormInputs = {
  id: 'abc',
  title: 'T',
  description: 'D',
  names: 'A\nB',
  randomizeOrder: true,
  showNames: true,
  colorSchemeType: `${WheelColorType.Random}`,
  baseColor: '#4062bf',
  customColors: '[]',
  randomizeColor: false,
  backgroundColorType: `${PageColorType.GradientNight}`,
  backgroundColor: '#0a0a0a',
};

it('generates an id when the form id is empty', () => {
  expect(configFromFormInputs({ ...valid, id: '' }).id).toHaveLength(CONFIG_ID_LENGTH);
});

it('uses the theme colors for gradient backgrounds, ignoring the form color', () => {
  const config = configFromFormInputs({ ...valid, backgroundColorType: `${PageColorType.GradientDay}` });
  expect(config.pageColorConfig).toEqual(pageThemeDay);
});

it.each([
  ['a non-numeric color scheme', { colorSchemeType: 'abc' }],
  ['an out-of-range color scheme', { colorSchemeType: '99' }],
  ['an out-of-range background type', { backgroundColorType: '5' }],
  ['a non-hex base color', { baseColor: 'url(https://example.com/x.png)' }],
  ['a non-hex background color', { backgroundColor: 'red' }],
  ['customColors that is not JSON', { customColors: 'nope' }],
  ['customColors that is not an array of hex strings', { customColors: '["red"]' }],
  ['blank names', { names: ' \n ' }],
  ['too many names', { names: Array.from({ length: MAX_NAMES + 1 }, () => 'A').join('\n') }],
  ['an over-long title', { title: 'T'.repeat(MAX_TITLE_LENGTH + 1) }],
])('rejects %s', (_label, override) => {
  expect(() => configFromFormInputs({ ...valid, ...override })).toThrow();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run packages/shared/src/utils/__tests__/form-config.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Tighten `configFormInputsSchema`**

Keep each field a `z.string()` or `z.boolean()` and add checks with `.max()`,
`.refine()`, or the hex schema: `id` max 21; `title` max `MAX_TITLE_LENGTH`;
`description` max `MAX_DESCRIPTION_LENGTH`; `names` must contain at least one
non-blank line, at most `MAX_NAMES` non-blank lines, each at most
`MAX_NAME_LENGTH` after trimming (message:
`Use at most 500 segments of up to 200 characters each`);
`colorSchemeType` must be one of `'0'` to `'5'`; `backgroundColorType` one of
`'0'` to `'4'`; `baseColor` and `backgroundColor` use `hexColorSchema`;
`customColors` must `JSON.parse` to an array of at most `MAX_CUSTOM_COLORS`
values that each pass `hexColorSchema`.

- [ ] **Step 4: Implement `configFromFormInputs`**

Same behavior as the handler body in
`packages/api-handlers/src/server/encoding.ts:31-77`, expressed with
`buildWheelColorConfig` and `buildPageColorConfig`.

- [ ] **Step 5: Run to verify pass, then build**

Run: `npx vitest run packages/shared && npm run build --workspace packages/shared`
Expected: PASS, and the build succeeds.

- [ ] **Step 6: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): validate and map config form inputs without the API"
```

### Task 5: Read the config from the fragment and decode locally

**Files:**

- Create: `apps/web/src/hooks/encoded-config.ts`
- Modify: `apps/web/src/utils/routes.ts`, `apps/web/src/hooks/config.ts`
- Test: `apps/web/src/utils/__tests__/routes.test.ts`,
  `apps/web/src/hooks/__tests__/config.test.tsx` (rewrite)

**Interfaces:**

- Consumes: `decodeConfig` from `@repo/shared/utils/encoding` (Task 3).
- Produces:
  - `getEncodedConfigFromHash(hash: string): string | undefined`
  - `buildConfigHash(encodedConfig: string): string`, returning
    `` `#c=${encodedConfig}` ``
  - `useEncodedConfig(): string | undefined`, reading `useLocation().hash`
  - `useDecodedConfig(encodedConfig?: string): DecodedConfigResult` where
    `interface DecodedConfigResult { data: Config | undefined; isError: boolean; isPending: boolean }`.
    Same contract as today: `undefined` stays pending and never decodes;
    `'new'` (any case) yields `new Config()`.

`useEncodeConfigMutation` stays in `hooks/config.ts` until Task 6.

- [ ] **Step 1: Write the failing tests**

In `routes.test.ts`:

```ts
describe('getEncodedConfigFromHash', () => {
  it.each([
    ['#c=v5.abc', 'v5.abc'],
    ['#c=v5.abc&utm=1', 'v5.abc'],
    ['#utm=1&c=v5.abc', 'v5.abc'],
    ['', undefined],
    ['#', undefined],
    ['#utm=1', undefined],
    ['#c=', undefined],
  ])('reads %s as %s', (hash, expected) => {
    expect(getEncodedConfigFromHash(hash)).toBe(expected);
  });
});

it('builds a config hash', () => {
  expect(buildConfigHash('v5.abc')).toBe('#c=v5.abc');
});
```

Replace `hooks/__tests__/config.test.tsx`. Mock
`@repo/shared/utils/encoding` with `vi.mock` so `decodeConfig` is a `vi.fn()`;
no `QueryClientProvider` wrapper. Cases, each with `renderHook` and `waitFor`:

- `returns a new config for "new" without decoding`: `data` is a `Config`,
  `isPending` is `false`, `decodeConfig` not called.
- `stays pending for undefined`: `isPending` is `true`, `decodeConfig` not
  called.
- `returns the decoded config`: `decodeConfig` resolves a `Config`; `data` is
  that instance and `isError` is `false`.
- `reports an error`: `decodeConfig` rejects; `isError` is `true`, `data` is
  `undefined`, `isPending` is `false`.
- `ignores a stale result when the input changes`: render with `'a'` (a
  promise you resolve manually), rerender with `'b'` (resolves config B), then
  resolve A; `data` is config B.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run apps/web/src/utils/__tests__/routes.test.ts apps/web/src/hooks/__tests__/config.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the two route helpers and `useEncodedConfig`**

Parse with `new URLSearchParams(hash.slice(1)).get('c')`; return `undefined`
for `null` or an empty string.

- [ ] **Step 4: Rewrite `useDecodedConfig` without TanStack Query**

One `useState` holding `{ input, data, isError }` and one `useEffect` keyed on
`encodedConfig` with a cancelled flag in its cleanup. `isPending` is
`state.input !== encodedConfig`.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run apps/web`
Expected: PASS. Existing page tests still mock `@/hooks/config` and are
unaffected.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): decode wheel configs in the browser"
```

### Task 6: Switch pages and links to `#c=` and local encoding

**Files:**

- Modify: `apps/web/package.json`, `apps/web/src/pages/wheel-page.tsx`,
  `apps/web/src/pages/config-page.tsx`, `apps/web/src/pages/legacy-page.tsx`,
  `apps/web/src/components/navbar.tsx`,
  `apps/web/src/components/saved-wheels-list.tsx`,
  `apps/web/src/components/color-picker.tsx`,
  `apps/web/src/compatibility/v2/utils.ts`, `apps/web/src/hooks/config.ts`
- Test: the existing tests beside each file, plus new
  `apps/web/src/compatibility/v2/__tests__/utils.test.ts`

**Interfaces:**

- Consumes: `useEncodedConfig`, `buildConfigHash` (Task 5); `encodeConfig`
  (Task 3); `configFromFormInputs`, `configFormInputsSchema` (Task 4).
- Produces: every in-app link to a wheel has the form
  `` `${PageBaseRoute.Wheel}${buildConfigHash(encoded)}` `` (or
  `PageBaseRoute.Config`). Nothing reads or writes `?c=`.

- [ ] **Step 1: Write the failing tests**

In every web test, change `MemoryRouter` entries from `?c=` to `#c=`
(`/wheel#c=encoded`, `/config#c=abc`), and in `routes.test.ts` drop the two
`?c=v4.abc` `isPage` cases. Where a test mocks `useEncodeConfigMutation`,
instead mock `@repo/shared/utils/encoding` so `encodeConfig` resolves
`'v5.encoded'`. Then add:

- `config-page.test.tsx`, `navigates to the wheel fragment on submit`: submit
  the loaded form; the router location is `/wheel` with hash `#c=v5.encoded`.
- `config-page.test.tsx`, `blocks submit and explains an invalid color`: load
  a Monochromatic config (the color input is hidden for Random), set the
  "Chosen Color" input to `nope`, submit; `encodeConfig` is not called and
  `Enter a hex color like #4062bf` is on screen.
- `navbar.test.tsx`, `carries the config fragment on the Wheel and Change Wheel links`:
  rendered at `/config#c=abc`, both links' `href` end with `#c=abc`.
- `saved-wheels-list.test.tsx`, `loads a saved wheel through the fragment`:
  pressing "Load this Wheel" navigates to `/wheel` with hash
  `#c=<wheel.encodedConfig>`.
- `legacy-page.test.tsx`, `sends an unconvertible legacy config to the 404 page`:
  a decodable v2 payload with empty `names` navigates to `/404`.
- `compatibility/v2/__tests__/utils.test.ts`:

```ts
const v2 = {
  title: 'T',
  description: '',
  names: 'A\nB',
  randomizeOrder: true,
  showNames: true,
  colorSchemeConfig: JSON.stringify({ colorSchemeType: 5, colors: ['rgb(255, 0, 0)', 'blue', 'not-a-color'] }),
  backgroundColorConfig: JSON.stringify({ backgroundColorType: 1, color: 'rgb(255, 255, 255)' }),
};

it('normalizes non-hex v2 colors and drops invalid ones', () => {
  const converted = convertConfigV2ToConfigV3(v2);
  expect(JSON.parse(converted.customColors)).toEqual(['#ff0000', '#0000ff']);
  expect(converted.backgroundColor).toBe('#ffffff');
});

it('falls back to the default base color when the v2 base color is invalid', () => {
  const converted = convertConfigV2ToConfigV3({
    ...v2,
    colorSchemeConfig: JSON.stringify({ colorSchemeType: 1, baseColor: 'not-a-color', randomizeColor: false }),
  });
  expect(converted.baseColor).toBe(DEFAULT_BASE_COLOR);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run apps/web`
Expected: the new and edited cases FAIL.

- [ ] **Step 3: Install the resolver**

```bash
npm view @hookform/resolvers version
npm install --save-exact --workspace apps/web @hookform/resolvers@<that version>
```

Use the `standardSchemaResolver` or `zodResolver` export, whichever that
version documents for Zod 4.

- [ ] **Step 4: Update the pages and components**

- `wheel-page.tsx`: `encodedConfig` comes from `useEncodedConfig()`.
- `config-page.tsx`: `requestedConfig` is `useEncodedConfig() ?? 'new'`; pass
  the resolver for `configFormInputsSchema` to `useForm`; `onSubmit` awaits
  `encodeConfig(configFromFormInputs(data))` and navigates to the wheel
  fragment. Remove the `useEncodeConfigMutation` import.
- `color-picker.tsx`: below the text input, when
  `formState.errors[singleColorName]` is set, render its `message` in a
  `<p role="alert">`.
- `navbar.tsx`: build the fragment from `useEncodedConfig()` with
  `buildConfigHash`; keep the close-menu effect keyed on the same value.
- `saved-wheels-list.tsx`: navigate with `buildConfigHash`.
- `compatibility/v2/utils.ts`: pass every v2 color through
  `new TinyColor(value)`; use `toHexString()` when `isValid`, otherwise drop a
  custom color or fall back to `DEFAULT_BASE_COLOR` /
  `DEFAULT_BACKGROUND_COLOR`.
- `legacy-page.tsx`: wrap decode, conversion, `configFromFormInputs`, and
  `encodeConfig` in one async function whose failure navigates to `/404`;
  the button navigates to the wheel fragment.
- `hooks/config.ts`: delete `useEncodeConfigMutation` and the `api` import.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run apps/web && npm run check-types`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web package-lock.json
git commit -m "feat(web): carry wheel configs in the URL fragment"
```

### Task 7: Bundle the changelog and remove TanStack Query

**Files:**

- Modify: `apps/web/src/pages/about-page.tsx`, `apps/web/src/providers.tsx`,
  `apps/web/package.json`, `package.json`
- Delete: `apps/web/src/hooks/changelog.ts`,
  `apps/web/src/hooks/__tests__/changelog.test.tsx`,
  `apps/web/src/utils/api.ts`
- Test: `apps/web/src/pages/__tests__/about-page.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

```tsx
it('renders the bundled changelog without fetching', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: 'Changelog' })).toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});

it('does not list Hono', () => {
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>
  );
  expect(screen.queryByText('Hono')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run apps/web/src/pages/__tests__/about-page.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Import the changelog at build time**

In `about-page.tsx`:
`import changelog from '../../../../CHANGELOG.md?raw';`. Render `<Markdown>`
unconditionally; delete the `isError` branch, the
`startsWith('<!doctype html>')` check, and the Hono list item with its
`SiHono` import.

- [ ] **Step 4: Remove the query client and the API client**

Delete the three files listed above. In `providers.tsx` remove
`QueryClientProvider` and the `queryClient` import. Then:

```bash
npm uninstall --workspace apps/web @tanstack/react-query
```

In the root `package.json` delete the `postbuild` and `postbuild:with-sentry`
scripts.

- [ ] **Step 5: Verify**

Run: `npx vitest run apps/web && npm run check-types && npm run lint`
Expected: PASS. Then confirm nothing imports the removed packages:
`grep -rn "react-query\|hono\|api-handlers" apps/web/src` prints nothing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(web): bundle the changelog and drop the API client"
```

### Task 8: Keep wheel contents out of Sentry

**Files:**

- Create: `apps/web/src/utils/sentry-scrub.ts`
- Modify: `apps/web/src/main.tsx`
- Test: `apps/web/src/utils/__tests__/sentry-scrub.test.ts`

**Interfaces:**

- Produces: `scrubEncodedConfig(url: string): string`

- [ ] **Step 1: Write the failing test**

```ts
it.each([
  ['https://x.app/wheel#c=v5.abc', 'https://x.app/wheel#c=[redacted]'],
  ['https://x.app/wheel#utm=1&c=v5.abc', 'https://x.app/wheel#utm=1&c=[redacted]'],
  ['/config#c=v5.abc&utm=1', '/config#c=[redacted]&utm=1'],
  ['https://x.app/wheel?c=v5.abc', 'https://x.app/wheel?c=[redacted]'],
  ['https://x.app/about', 'https://x.app/about'],
  ['https://x.app/?topic=1', 'https://x.app/?topic=1'],
])('scrubs %s', (input, expected) => {
  expect(scrubEncodedConfig(input)).toBe(expected);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run apps/web/src/utils/__tests__/sentry-scrub.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scrubEncodedConfig`**

`url.replace(/([#&?]c=)[^&#]*/, '$1[redacted]')`.

- [ ] **Step 4: Apply it in `sentryInit`**

In `main.tsx`: remove `tracePropagationTargets`; add `beforeSend` and
`beforeSendTransaction` that scrub `event.request.url` when present; add
`beforeBreadcrumb` that scrubs `data.from`, `data.to`, and `data.url` when
they are strings. Each returns the event or breadcrumb.

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run apps/web && npm run check-types`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): redact wheel configs from Sentry URLs"
```

### Task 9: Deploy as static assets and delete the server workspaces

**Files:**

- Create: `apps/web/wrangler.jsonc`
- Modify: `apps/web/package.json`, `turbo.json`, `package.json`, `vitest.config.ts`, `packages/shared/package.json`,
  `.github/workflows/reusable-setup-build-test.yaml`,
  `.github/workflows/reusable-deploy-worker.yaml`,
  `.github/workflows/reusable-sentry-operations.yaml`,
  `.github/workflows/deploy-main.yaml`
- Delete: `apps/api/`, `packages/api-handlers/`

- [ ] **Step 1: Create `apps/web/wrangler.jsonc`**

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "wheel-in-the-sky",
  "compatibility_date": "2026-11-01",
  "assets": {
    "directory": "./dist",
    "html_handling": "drop-trailing-slash",
    "not_found_handling": "single-page-application",
  },
}
```

There is no `main`, no `binding`, no `compatibility_flags`, and no
`observability` block: with no Worker script there is nothing to log. If
wrangler rejects the date as too new, use the latest date it accepts.

- [ ] **Step 2: Point the web build at its own `dist`**

In `apps/web/package.json`: `build` becomes `tsc -b && vite build`; add
`"deploy": "wrangler deploy"`; remove the `@repo/api-handlers` dependency.

```bash
npm install --save-exact --save-dev --workspace apps/web wrangler@4.160.0
```

- [ ] **Step 3: Delete the server workspaces**

```bash
git rm -r apps/api packages/api-handlers
rm -rf apps/api packages/api-handlers
```

The second command removes the ignored leftovers (`node_modules`, `dist`, and
the generated `apps/api/public`).

- [ ] **Step 4: Update root and shared config**

- `package.json`: delete the `types` script and the `cp` dev dependency.
- `turbo.json`: delete the `types` task; `deploy` becomes
  `{ "dependsOn": ["build"] }`; remove `.dev.vars` from `globalEnv` and from
  the `dev` task's `inputs`.
- `vitest.config.ts`: `projects` becomes `['apps/*', 'packages/shared']`.
- `packages/shared/package.json`: delete `sentry:sourcemaps`;
  `build:with-sentry` becomes `npm run build`; remove `@sentry/cli` from
  `dependencies`.
- The release workflows call `npx sentry-cli`, so keep it installed at the
  root:

```bash
npm install --save-exact --save-dev @sentry/cli@3.6.2
npm install
```

- [ ] **Step 5: Update the workflows**

- `reusable-setup-build-test.yaml` and `reusable-deploy-worker.yaml`: in every
  cache step, change `path: apps/api/public` to `path: apps/web/dist` and the
  key prefix `api-public` to `web-dist`; delete the three "API handlers build
  directory" cache and restore steps.
- `reusable-deploy-worker.yaml`: `workingDirectory` becomes `'apps/web'`.
- `reusable-sentry-operations.yaml`: delete the `SENTRY_API_PROJECT` secret
  declaration and the two `sentry-cli` lines that use it.
- `deploy-main.yaml`: delete both `SENTRY_API_PROJECT:` lines.

- [ ] **Step 6: Verify the full toolchain**

```bash
npm run sherif && npm run check-types && npm run lint && npm run build && npx vitest run
git status --short
```

Expected: all pass; `git status` shows no `dist` files. Then confirm no stale
references remain:
`grep -rn "api-handlers\|apps/api\|8787\|dev.vars" --include='*.json' --include='*.ts' --include='*.yaml' --include='*.yml' . --exclude-dir=node_modules --exclude-dir=dist`
prints nothing.

- [ ] **Step 7: Verify the deployment locally**

```bash
npm exec --workspace apps/web -- wrangler deploy --dry-run
npm exec --workspace apps/web -- wrangler dev
```

Expected: the dry run lists the assets and reports no Worker script. With
`wrangler dev` running, in a browser: create a wheel, confirm the address bar
shows `/wheel#c=v5.…`, reload the page, and confirm the same wheel loads;
open `/about` directly and confirm the changelog renders; open
`/does/not/exist` and confirm the 404 page renders. In the network panel,
confirm no request URL contains the `c` value.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat!: deploy as static assets and remove the API"
```

### Task 10: Documentation and changelog

**Files:**

- Modify: `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `docs/architecture.md`,
  `apps/web/CLAUDE.md`, `packages/shared/CLAUDE.md`

- [ ] **Step 1: Update `CHANGELOG.md` under 3.0.0**

- Intro line: replace "with a Hono backend API" with "that runs entirely in
  the browser".
- Replace the `?c=` bullet under Changed with: "Wheel configuration share
  links carry the wheel in the URL fragment (`#c=`), so its contents are never
  sent to the server. Links are about half as long as before."
- Add under Changed: "Wheels are encoded and decoded in your browser. The app
  no longer has a backend API."

- [ ] **Step 2: Update the developer docs to match the code**

Each of these statements must become true in the named file:

- `CLAUDE.md`: the workspace table has no `apps/api` or
  `packages/api-handlers` rows; core rule 3 names only `@repo/shared` and
  `apps/web`; the State list has two options (no TanStack Query); the Forms
  line no longer mentions `@hono/zod-validator`.
- `docs/architecture.md`: two app/package entries removed; the "where code
  belongs" list has no API step; "URL-based configuration sharing" describes
  the `#c=` fragment and the client-side codec in
  `packages/shared/src/utils/encoding.ts`; the stack lists HeroUI v3 and no
  backend; the deployment model is `vite build` to `apps/web/dist` then
  `wrangler deploy` of static assets.
- `README.md`: the package list has no `api` or `@repo/api-handlers`; the
  environment setup has no `apps/api/.dev.vars` and no port 8787; the
  first-run build caveat is removed if `npm run dev` now starts cleanly from a
  fresh clone (check it).
- `apps/web/CLAUDE.md`: build output is `apps/web/dist`; gotchas 1, 6, and 7
  are removed or rewritten; the boundaries list no longer names
  `@repo/api-handlers`; the wrangler config and `deploy` script are
  documented.
- `packages/shared/CLAUDE.md`: lists the new `utils/encoding.ts`,
  `utils/wire-config.ts`, `utils/form-config.ts`, the two new validators, and
  `constants/limits.ts`; "depended on by" names only `apps/web`.

- [ ] **Step 3: Verify and commit**

Run: `npx prettier --check "**/*.md"`
Expected: PASS.

```bash
git add -A
git commit -m "docs: describe the serverless architecture and new link format"
```

---

## After the Plan

Before merging Phase 1: the first deploy replaces the existing
`wheel-in-the-sky` Worker with an assets-only one of the same name. Wheels
saved in a developer's browser under the old `v4.` format will show the
"Unable to load wheel" card and can be deleted from the Actions drawer. The
Sentry API project (`wits-api`) and the `SENTRY_API_PROJECT` repository secret
can be removed once the deploy is confirmed.
