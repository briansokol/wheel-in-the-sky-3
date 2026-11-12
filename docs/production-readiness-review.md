# Production readiness review

> This review describes the repository layout before November 11, 2026, when the monorepo was flattened into a single root app. Paths under `apps/web/` and `packages/` refer to that earlier layout.

Reviewed 2026-11-10 at commit `bb2d5e3` (`main`). Covers code, patterns,
dependencies, security, delivery, and architecture.

## Summary

The codebase is in better shape than "stale" suggests. Types check, lint is
clean, and all 252 tests pass. The stack is current in its major choices (React
19, Vite, Tailwind 4, HeroUI 3, Hono, Zod 4). What stands between it and
production is a short list:

1. **Dependencies have known vulnerabilities**, all fixable with non-breaking
   upgrades (one exception, dev-only).
2. **The API trusts its input.** Decoded configs are never validated, payloads
   are unbounded, and one malformed field produces a 500.
3. **The v2 link migration path is untested.** It is the code every existing
   bookmark will hit on cutover, and it has 0% coverage.
4. **A handful of functional bugs** in removed winners, saved wheels, and spin
   timing.
5. **Delivery gaps**: no staging or preview, no security headers, no custom
   domain configured, Sentry source map upload is probably misconfigured.

The largest opportunity is architectural. The only thing the backend does is
gzip and base64 a JSON object, which browsers can do natively. Moving that to
the client removes the API, two workspaces, five runtime dependencies, and most
of the security findings below. See [Architecture](#architecture).

## What was checked

| Check                          | Result                                                      |
| ------------------------------ | ----------------------------------------------------------- |
| `npx vitest run`               | 28 files, 252 tests, all pass                               |
| `npm run check-types`          | pass                                                        |
| `npm run lint`                 | 0 warnings, 0 errors                                        |
| `npm audit`                    | 33 advisories: 4 critical, 18 high, 9 moderate, 2 low       |
| `npm outdated`                 | 45 packages behind, 16 by a major version                   |
| Coverage (`vitest --coverage`) | 79% statements, 61% branches; components and pages excluded |
| Manual read                    | every non-test source file, all config and CI workflows     |

Not checked: the app was not run in a browser, and nothing was deployed. Items
marked "verify" below are inferred from reading code and config.

## Blockers before launch

### 1. Upgrade vulnerable dependencies

All of these have a fix within the current major version.

| Package                    | Installed | Fixed in | What applies to this app                                                                                            |
| -------------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `hono`                     | 4.12.2    | 4.13.17  | ReDoS in the CORS middleware via `Access-Control-Request-Headers`. The other ~30 advisories are in unused features. |
| `zod`                      | 4.3.6     | 4.6.7    | Memory exhaustion while validating large collections. Runs on untrusted API input.                                  |
| `react-router`             | 7.13.1    | 7.18.5   | Open redirect via backslash in `<Link>` and `useNavigate`. Most others are SSR or RSC only.                         |
| `nanoid`                   | 5.1.6     | 5.1.16   | Not reachable with default arguments, which is the only usage. Upgrade anyway.                                      |
| `vite`                     | 7.3.1     | 7.3.8    | Dev server file read. Matters because `dev` runs with `--host`, exposing it to the LAN.                             |
| `vitest`                   | 4.0.18    | 4.1.12   | Critical, but only when the Vitest UI server is listening. Dev-only.                                                |
| `wrangler`                 | 4.68.0    | 4.160.0  | Transitive `undici`, `ws`, `miniflare`. Dev and deploy tooling.                                                     |
| `concurrently`             | 9.2.1     | 9.2.5    | Critical via `shell-quote`. Dev-only.                                                                               |
| `postcss`, `turbo`, `yaml` |           |          | Dev-only, patch upgrades.                                                                                           |

`@sentry/vite-plugin` 5.4.0 needs a major bump (to 11.x) to clear its advisory;
do it together with the Sentry SDKs, which are also a major behind (10.70 vs
11.12).

There is no Dependabot or Renovate config, which is how the project drifted.
Add one, grouped by ecosystem, so this does not recur.

### 2. Validate and bound API input

All in `packages/api-handlers`. If you take the architecture recommendation,
this section mostly becomes "validate on the client" instead.

- **Decoded configs are returned unvalidated.** `decodeConfig` returns
  `JSON.parse(...)` directly (`src/utils/encoding.ts:31`), and
  `Config.deserialize` carries a `TODO: Add error handling, add Zod validation`
  (`packages/shared/src/classes/config.ts:130`). `serializedConfigSchema` already
  exists and is never used for parsing. A crafted `?c=` value can put any JSON
  shape into app state.
- **Decompression is unbounded.** `/decode` accepts a string of any length and
  inflates it fully into memory (`src/utils/encoding.ts:97`). A small gzip bomb
  will exhaust the Worker's 128 MB. Cap `encodedConfig` length in the Zod
  schema and stop reading the stream past a fixed size.
- **`/encode` has no size limits either.** `configFormInputsSchema` puts no
  `max()` on `names`, `title`, or `description`. Add limits and Hono's
  `bodyLimit` middleware.
- **Malformed `customColors` returns a 500.** `JSON.parse(formData.customColors)`
  sits outside the `try` (`src/server/encoding.ts:58`) and its result is not
  validated as a string array.
- **Enum fields are unchecked.** `Number.parseInt(formData.colorSchemeType)`
  (`src/server/encoding.ts:45-46`) accepts `"abc"` or `"99"` and stores `NaN` or
  an out-of-range value in the config.
- **Color strings are not validated as colors.** They are written into
  `style` props and the `--page-background` custom property
  (`apps/web/src/hooks/colors.ts:46`). React blocks script injection here, but
  `url(https://...)` is a valid background, so a shared link can make a
  viewer's browser request an arbitrary third-party URL. Validate with a hex
  regex or `TinyColor.isValid`.
- **No rate limiting.** Both endpoints do CPU work for anonymous callers. Add a
  Cloudflare rate limiting rule.
- `btoa(String.fromCharCode.apply(null, [...bytes]))`
  (`src/utils/encoding.ts:87`) throws a `RangeError` once the compressed payload
  reaches roughly 100 KB. Size limits make this unreachable; fix it regardless.

### 3. Test the legacy link migration

`apps/web/src/compatibility/v2/utils.ts` and `classes/encoder.ts` are at 0%
coverage. They convert every existing v2 bookmark when `wheelinthesky.app` cuts
over. Add tests built from real v2 URLs before launch. Related problems in
`apps/web/src/pages/legacy-page.tsx`:

- `convertConfigV2ToConfigV3` can throw (two `JSON.parse` calls and a Zod
  `parse`) and the `encodeConfig` promise has no `catch`, so a bad link leaves
  the upgrade button disabled forever with no message.
- The route is `/:oldId` (`apps/web/src/routes.tsx:21`), so every unknown
  single-segment path is treated as a legacy config before falling through to
  the 404 page.

### 4. Fix functional bugs

- **Removed winners leak between wheels.** The list lives in a global provider
  and nothing clears it when the wheel changes. Remove "Alex" on one wheel,
  load another saved wheel, and "Alex" is missing there too. Key the list by
  config id.
- **Duplicate names are removed together.** Removal filters by name
  (`packages/shared/src/classes/wheel-manager.ts:50`), so a wheel with two
  "Alex" entries loses both when one wins.
- **Spin length depends on display refresh rate.** Speed decays by a fixed
  factor per animation frame (`apps/web/src/utils/wheel-animation-manager.ts:324`),
  so the same spin lasts half as long in wall-clock time on a 120 Hz screen as
  on 60 Hz. Scale by elapsed time.
- **Corrupt `localStorage` blanks the app.** `getSavedWheels` calls
  `JSON.parse` with no guard (`apps/web/src/utils/local-storage.ts:23`), and it
  runs inside the navbar, which sits outside the error boundary
  (`apps/web/src/layout.tsx:17`).
- **Saved-wheel state does not sync within a tab.** Each `useSavedWheels` call
  holds its own `useState` copy, and the `storage` event only fires in other
  tabs. The wheel page and the drawer can disagree until remount.
  `useSyncExternalStore` fixes both this and the previous item.
- **Lazy routes have no `Suspense` boundary** (`apps/web/src/routes.tsx`,
  `layout.tsx`). While a page chunk loads there is no fallback UI.
- **"No segments found" can flash on load.** `segment` is set in an effect
  after the first render (`apps/web/src/pages/wheel-page.tsx:95-99,159`). The
  same card also appears, with misleading advice, after every winner has been
  removed. Verify in a browser.
- **The error boundary does not report.** It still has
  `TODO: Send to error tracking service` (`apps/web/src/components/error-boundary.tsx:43`)
  although Sentry is installed. Its fallback also uses classes that do not
  exist in the built CSS (`bg-card`, `text-muted-foreground`,
  `border-destructive`, `text-destructive`), so it renders partly unstyled, and
  it shows raw error messages to users.
- **"Copy Banner" fails silently.** No error handling or success feedback, and
  a null blob is cast away (`apps/web/src/pages/wheel-page.tsx:31`). Long names
  overflow the canvas, and the canvas draws before the web font is guaranteed
  loaded.
- **The static preview wheel is interactive.** It is focusable and spins on
  Space or Enter, because only the global listeners honor `isStatic`
  (`apps/web/src/components/wheel.tsx`).
- **Unknown `/api/*` paths return `index.html` with a 200** because `notFound`
  delegates everything to the asset binding
  (`packages/api-handlers/src/server/index.ts:34`).

### 5. Close delivery gaps

- **No staging or preview.** Every push to `main` deploys straight to
  production. Use `wrangler versions upload` for pull request previews, or a
  second Worker environment.
- **No security headers.** There is no `_headers` file in `apps/web/public`.
  Add a Content-Security-Policy, `X-Content-Type-Options`,
  `Referrer-Policy`, and `frame-ancestors`.
- **No production domain is configured.** `wrangler.jsonc` has no `routes`,
  the CORS allowlist hardcodes the `workers.dev` hostname, and the banner
  hardcodes `wheelinthesky.app`.
- **Sentry source maps are probably not uploading from CI (verify).**
  `apps/web/vite.config.ts` reads `SENTRY_ORG` and `SENTRY_WEB_PROJECT`, but the
  build step only receives `SENTRY_AUTH_TOKEN`
  (`.github/workflows/reusable-setup-build-test.yaml`). The release name the
  workflow creates (`<version>-<sha>`) is also never passed to the build. The
  two packages' `sentry:sourcemaps` scripts hardcode an org and the API project
  instead of using the secrets, and `@repo/shared` uploads to the API project
  even though it also ships in the web bundle.
- **Source maps are deployed publicly.** `build.sourcemap: true` writes them
  into the Worker's asset directory. Harmless for open source, but set
  `sourcemaps.filesToDeleteAfterUpload` if you would rather not serve them.
- **Sampling is at 100%.** `tracesSampleRate: 1.0` in both the browser and the
  Worker. Lower it before real traffic arrives. The browser SDK also sets no
  `environment`.
- **`compatibility_date` is `2025-02-04`.** Bump it and retest; asset routing
  defaults changed in April 2025.
- **`observability.enabled` is `false` while `logs.enabled` is `true`**
  (`apps/api/wrangler.jsonc`). Confirm which you intend.
- **Local deploys ship stale assets.** Vite does not empty an `outDir` outside
  its root, so `apps/api/public` accumulates old builds: 215 MB and 259 asset
  files on this machine. CI is unaffected because it starts clean, but
  `npm run deploy` from a laptop uploads all of it. Add `--emptyOutDir` to the
  web build script.

## Privacy and content

- **Wheel contents reach the server and Sentry.** The marketing copy says the
  configuration is "stored entirely in the URL", but `?c=` is a query
  parameter. It is sent with every page request, written to persisted Worker
  invocation logs, posted to `/api/config/decode`, and captured in Sentry
  traces and breadcrumbs. Wheels typically hold people's names. Client-side
  decoding plus a `#c=` fragment would keep them in the browser; Sentry would
  then need a `beforeSend` scrub for the fragment.
- **Session Replay is enabled** at 10% of sessions and is not disclosed
  anywhere.
- **The About page is inaccurate** (`apps/web/src/pages/about-page.tsx`): it
  says the app uses cookies (it uses `localStorage`), lists ESLint (the repo
  uses oxlint), says "All rights reserved" (the license is AGPL-3.0), and links
  to the retired `reactjs.org`.
- **Google Fonts is loaded from Google's CDN** (`apps/web/index.html`), a
  third-party request on every visit. `@fontsource-variable/quicksand` is
  already installed and unused; import it and drop the `<link>` tags. This also
  simplifies the CSP.
- `maximum-scale=1.0` in the viewport meta blocks pinch zoom, an accessibility
  failure.
- `manifest.json` exists but `index.html` never links it. There is no meta
  description or Open Graph tags, which matter for an app spread by shared
  links.

## Architecture

### What the backend does today

Two endpoints. `/encode` turns form fields into a `Config`, gzips the JSON, and
base64url-encodes it. `/decode` reverses that. There is no storage, no auth,
and no secret. Supporting it requires:

- `packages/api-handlers` and `apps/api`
- `hono`, `@hono/zod-validator`, `@sentry/cloudflare`, `@sentry/hono`, and
  TanStack Query on the client
- CORS middleware, which exists only because local dev runs on two ports
- two committed copies of an 11,189-line generated `worker-configuration.d.ts`
- a `tsc && tsc-alias` build of both packages into `dist`, with `concurrently`
  watchers, before anything can typecheck or test against them

The per-workspace `CLAUDE.md` files document the cost: three separate gotchas
warn that a stale `dist` makes typechecks and test runs "meaningless".

### Recommendation: move encoding to the client

`CompressionStream` and `DecompressionStream` are available in every current
browser. The encode and decode functions in
`packages/api-handlers/src/utils/encoding.ts` run unmodified there.

What changes:

- The codec and the form-to-config mapping move into `@repo/shared` (or
  `apps/web`), with `serializedConfigSchema.parse` on decode.
- The Worker becomes assets-only: `wrangler.jsonc` with no `main`.
- `packages/api-handlers` is deleted. `apps/api` shrinks to a config file, or
  the wrangler config moves into `apps/web`.
- TanStack Query can go. Its one other use, fetching `CHANGELOG.md`, becomes a
  build-time `import changelog from '../../../CHANGELOG.md?raw'`, which also
  removes the `postbuild` copy step and the `startsWith('<!doctype html>')`
  workaround in the About page.

What you gain:

- Blockers 2 (gzip bomb, 500s, rate limiting) and most of the privacy section
  disappear, because untrusted input never reaches a server you run.
- Wheels load instantly and work offline. Loading spinners and decode error
  states for network failure go away.
- The Hono advisory stream stops being your problem.

What you give up:

- Server-side logs of decode failures. Client Sentry still reports them.
- A ready-made place to add server features. See the next section.

### Why the backend exists, and what that means now

Two pieces of context from the author shape this decision.

**The backend was originally there to render the winner image.** In v2 it
generated a downloadable JPG. In v3 that job has already moved to the browser:
`apps/web/src/components/banner.tsx` draws the banner on a canvas and
`wheel-page.tsx` copies it to the clipboard as a PNG. The original reason for
the backend is gone, and the codec is what was left behind. Two follow-ups:

- The changelog says "Downloadable banner", but the UI only offers "Copy
  Banner". A download button is a few lines on the existing canvas
  (`toBlob`, then an `<a download>`), with no server involved.
- The one image job a server could still do better is link previews: an Open
  Graph image and title that show the wheel when a link is pasted into chat.
  That requires the server to read the config, which conflicts with moving it
  to a `#c=` fragment for privacy. Decide which you value more before choosing
  the URL format.

**User accounts are under consideration.** Saving wheels to an account is a
real reason for a Worker. It does not change the codec recommendation: an
account would store the config (or its encoded string) and would never need
the server to do the encoding. Move the codec to the client either way.

What accounts do change:

- **Keep `@repo/shared` as its own package.** The config schema becomes the
  contract between the browser and a future API, so do not fold it into
  `apps/web` (step 3 under Monorepo shape).
- **Config validation moves from important to essential.** A stored config is
  read back by other sessions and devices, so it must pass
  `serializedConfigSchema` on write and on read, with size limits.
- **The saved-wheels code is the seam.** `useSavedWheels` in
  `apps/web/src/utils/local-storage.ts` is the interface an account-backed
  store would sit behind. Fixing its state handling now (see blocker 4) makes
  that swap straightforward, and gives you the local-to-account import path.
- **It is a much larger commitment than the current API.** Accounts bring an
  auth provider, sessions, a database (D1), CSRF protection, a privacy policy,
  data export and deletion, and abuse handling. Today's two stateless
  endpoints share almost nothing with that.

### Decision (2026-11-10)

Accounts are only a possibility and link previews are not needed now, so:
**remove the server.** Encoding moves to the client, the deployment becomes
static assets only, and a Worker comes back as a separate project if a backend
is ever needed. Consequences:

- `packages/api-handlers` is deleted, along with `hono`,
  `@hono/zod-validator`, `@sentry/cloudflare`, `@sentry/hono`, TanStack Query,
  both copies of `worker-configuration.d.ts`, and the Sentry API project.
- Hosting stays on Cloudflare with `not_found_handling:
single-page-application`, so client routes and legacy `/:oldId` links keep
  working.
- The config moves to a `#c=` fragment (decided). Nobody is using v3 links
  yet, so `?c=` is dropped outright rather than read as a fallback.
- Blocker 2 reduces to: validate decoded configs with
  `serializedConfigSchema`, cap input and decompressed size, and validate
  color strings, all in the browser.
- `@repo/shared` stays a separate package for now (monorepo step 2, not 3), so
  the config schema is ready to share with a future backend.

### Link encoding

The pipeline (JSON, compress, base64url, version prefix) is the right one. The
gain is in what goes into it. Measured with a sample wheel, in characters after
`c=`:

| Names | Today (`v4.`, gzip) | Slim payload, `deflate-raw` |
| ----- | ------------------- | --------------------------- |
| 5     | 411                 | 169                         |
| 10    | 475                 | 227                         |
| 20    | 586                 | 339                         |

Proposed format, introduced together with the move to `#c=`:

- **Stop serializing derived values.** Gradient themes store a full CSS
  string and a foreground color that the theme type already implies; a
  single-color page stores a foreground color computed from the background.
  Store the type (and the one chosen color) and derive the rest on read.
- **Omit defaults**, and drop the `version` field, which the prefix already
  carries.
- **Shorten the id.** The 21-character nanoid is random, so it does not
  compress. It only distinguishes wheels in one browser's saved list; 8 to 10
  characters is plenty.
- **Use short keys** in the serialized form, mapped to the readable type by
  the Zod schema.
- **Use `deflate-raw` instead of `gzip`.** Same algorithm without the 18-byte
  header and trailer, about 24 characters per link. Supported by
  `CompressionStream` in current browsers.

Not worth doing: a binary format (MessagePack, CBOR) saves little once the
payload is mostly names and adds a dependency; a denser alphabet than
base64url is not URL-safe.

The current `v4.` format has no users, so it is replaced, not kept alongside:
no fallback decoder and no migration. Keep a version prefix on the new format
so the next change can be detected. The only old links that must keep working
are v2 links from `wheelinthesky.app`, handled by the legacy route (blocker 3).

The reasoning behind the two options, for the record:

- **If accounts are not scheduled, remove it.** The scaffolding is about 40
  lines of Hono setup plus the typed client, it is preserved in git history,
  and the auth and storage choices will reshape it anyway. An API with no
  routes still costs the `dist` build, the generated types, the CORS
  middleware, and the Hono advisories.
- **If accounts are the next feature after launch, keep the shell** and apply
  the smaller cleanup: add a Vite `server.proxy` for `/api` in dev, then delete
  the CORS middleware and the `VITE_APP_ENV` port-rewriting in
  `apps/web/src/utils/api.ts`. Production is same-origin and never needed CORS.
  Also make unknown `/api/*` paths return a JSON 404 rather than `index.html`.

### Monorepo shape

Seven workspaces, Turborepo, and sherif coordinate about 4,900 lines of
application source. Three of the workspaces (`oxlint`, `prettier`,
`lint-staged`) are 20 to 60 lines of config each, and each carries a
~120-line `CLAUDE.md`. In order of increasing ambition:

1. **Fold the three config packages into root config files.** Nothing outside
   this repo consumes them.
2. **Consume `@repo/shared` as source** rather than as a `dist` build. Point
   its `exports` at `src/*.ts` and let Vite and Vitest compile it. This removes
   `tsc-alias`, `concurrently`, the watch scripts, and the stale-`dist` class
   of problem.
3. **Collapse to a single package, only if accounts are off the table.** With
   the API gone, `shared` has one consumer left and could become
   `apps/web/src/domain/`, leaving Turborepo and sherif nothing to do. If
   accounts are likely, stop at step 2 and keep `shared` separate.

Smaller Turborepo issues if you keep it:

- `build` has `cache: false`, which forfeits the main reason to use Turbo.
- `globalEnv` in `turbo.json` lists `.env*` and `.dev.vars`, which are file
  globs and belong in `globalDependencies`. Likewise `inputs` lists
  `WITH_SENTRY` and `SENTRY_AUTH_TOKEN`, which are env vars, not files.
- The README still documents a first-run `npm run dev` failure.

### Front-end state and data model

- **`ConfigContext` duplicates the URL.** The wheel page decodes `?c=` and then
  copies the result into context through an effect so the navbar can read it. A
  single `useCurrentConfig()` hook that reads the search param would replace
  the context, the provider, and the sync effect.
- **`segment` is derived state stored in context.** It is a pure function of
  `rotation` and `wheelManager` and can be computed during render, which also
  fixes the "No segments found" flash.
- **Four contexts are eight files of boilerplate** around one `useState` each.
  After the two changes above, only rotation/winner and removed winners remain.
- **The form schema is shaped by its widgets.** `ConfigFormInputs` carries
  enums as strings and the color list as a JSON string, and that shape is also
  the API contract. Use real types in the form and convert at the `Select`
  boundary.
- **The form does not use a Zod resolver**, though the project conventions
  require one and `@hookform/resolvers` is not installed. Validation is a
  single `required` rule.
- **`Config` is a class with 14 setters around a plain object.** A type
  inferred from `serializedConfigSchema` plus a few functions would be shorter
  and would make validation the only way to construct one.
- **Gradient themes are baked into every link.** The full CSS gradient string
  is serialized and then trusted on read
  (`apps/web/src/hooks/colors.ts:16`). Store only the theme type and resolve it
  through `getPageGradientTheme`. Links get shorter, old links pick up theme
  changes, and one injection vector closes.
- **Three unrelated version numbers** describe the config: `version = 3` in the
  class, the `v4.` encoding prefix, and the `v2` compatibility folder. Pick one
  scheme and document it.
- `wheelColorConfigSchema` should be a `z.discriminatedUnion` on
  `wheelColorType` for better errors and narrowing.
- `apps/web/src/pages/config-page.tsx` is 568 lines. About 60 of them are
  `isLoaded ? ... : <Skeleton />` branches that cannot run, because the
  component returns early while the query is pending.
- The React Compiler is enabled, yet nearly every component hand-writes
  `useMemo` and `useCallback`. Not harmful; remove opportunistically.

## Dependencies

Beyond the security upgrades:

| Item                                      | Finding                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hono` in `apps/web`                      | Imported (`hono/client`) but not declared. Works only through hoisting.                                                                          |
| `seedrandom`, `@types/seedrandom`         | Unused.                                                                                                                                          |
| `@fontsource-variable/quicksand`          | Installed, never imported. Use it (see Privacy).                                                                                                 |
| `nanoid` in `apps/web`                    | Used only by a test. Move to `devDependencies`.                                                                                                  |
| `cp` (root and `apps/api`)                | Unused. Scripts call the shell's `cp`; the package has no binary.                                                                                |
| `react` in `@repo/shared`                 | A runtime dependency of the "framework-agnostic" package, only for a CSS type augmentation.                                                      |
| `@sentry/cli` in `shared`, `api-handlers` | A build tool listed under `dependencies`.                                                                                                        |
| `postcss` in `apps/web`                   | No direct usage found; Tailwind 4's Vite plugin does not need it.                                                                                |
| `es-toolkit`                              | One `debounce` call.                                                                                                                             |
| `@uidotdev/usehooks`                      | Two small hooks.                                                                                                                                 |
| TypeScript                                | 5.9.3; 7.0 is out. Plan this separately, after the dependency cleanup.                                                                           |
| Other majors behind                       | `vite` 8, `vitest` 5, `react-router` 8, `framer-motion` 14, `nanoid` 6, `jsdom` 31, `lint-staged` 17, `@vitejs/plugin-react` 6. None are urgent. |
| `packageManager`                          | Pins `npm@11.10.1`; this machine runs npm 12.2.2.                                                                                                |

The main bundle is 840 KB before compression. Likely contributors are Sentry
Replay, HeroUI, and `react-icons` (the About page pulls from the large `si`
set). Run a bundle analyzer before deciding what to cut; lazy-loading Replay is
the usual first win.

## CI and tooling

- **Five jobs each run `npm ci`**, and build output is passed between them
  through `actions/cache` with `fail-on-cache-miss`. For a build this small, one
  job (install, sherif, types, lint, build, test) is faster and cannot fail on
  cache eviction.
- **`build-feature` requires `SENTRY_AUTH_TOKEN`** and triggers on `push`
  only. Pull requests from forks cannot run it.
- **Actions are pinned to mutable tags** (`@v4`, `@v3`, `@v1`). Pin to commit
  SHAs. The build and deploy workflows declare no `permissions` block, so they
  get the repository default.
- **No `concurrency` group on deploy.** Two quick merges can race.
- **`get-version` installs every dependency** to print a git SHA.
- **The pre-commit hook runs a full typecheck**, which builds two packages
  first. Consider moving it to CI only.
- `packages/oxlint/index.js` says some rules "must remain in the ESLint config
  for now". There is no ESLint config.

## Tests

- Components and pages are excluded from coverage in the root
  `vitest.config.ts`, so the 79% figure describes utilities and domain code
  only.
- The API tests mock away CORS and assert only that the app object exists. The
  encode and decode route tests do not cover malformed input.
- Test output is noisy with React `act(...)` warnings.
- There is no end-to-end test. One Playwright smoke test (create a wheel, spin
  it, see a winner, reload the link) would cover the path that matters most and
  that unit tests cannot reach.
- `apps/web/src/utils/wheel-animation.ts` is at 0% coverage and
  `wheel-animation-manager.ts` at 71%.

## Accessibility

- The wheel uses `role="application"` with `aria-live` on the spinning element
  itself. The winner card, which is what should be announced, is not in a live
  region.
- Segments have `role="listitem"` with no `list` parent.
- The wheel and confetti do not honor `prefers-reduced-motion`. `WheelGlows`
  already does.
- Pinch zoom is disabled (see Privacy and content).

## Dead code

No references found outside tests:

- `apps/web/src/pages/config-page-layout.tsx`
- `apps/web/src/pages/wheel-page-layout.tsx`
- `packages/api-handlers/src/utils/assets.ts` (`getAssetURL`)
- `useLargestViewportDimension` in `apps/web/src/hooks/viewport.ts`
- `Config.setNamesArray`, `Config.queryKey`, `Config.oldQueryKey`
- `WheelManager.winnerStorageKey`
- `Easing.InOut`
- the blur overlay and commented-out blur math in the wheel, which always sets
  `blur(0)`

## Documentation

- `docs/architecture.md` says HeroUI v2; the project is on v3.
- The README's release section is accurate but there is no launch or cutover
  plan for replacing `wheelinthesky.app`.
- Seven `CLAUDE.md` files plus `copilot-instructions.md` total roughly 1,000
  lines, against 4,900 lines of source. Much of it documents workarounds for
  the `dist` build that the architecture changes would remove.

## Suggested order

1. Dependency upgrades and a Renovate or Dependabot config. Low risk, clears
   the audit.
2. Remove the server: move the codec and form-to-config mapping to the client,
   delete `packages/api-handlers`, and make the deployment assets-only.
3. Config validation on decode, with size limits, in the client codec.
4. Tests for v2 link migration, using real legacy URLs.
5. The functional bugs in blocker 4.
6. Security headers, self-hosted font, About page corrections, Sentry
   configuration.
7. Preview deployments, then the domain cutover.
8. Monorepo simplification and the state cleanup, as time allows.

## Open questions

None outstanding. Settled on 2026-11-10: removed winners do not survive a page
reload. They stay in memory only, scoped to the current wheel.
