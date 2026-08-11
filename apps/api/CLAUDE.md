# api (`apps/api`)

The Cloudflare Worker deployment shell: it exposes `@repo/api-handlers` as a Worker entry point and serves the built SPA as static assets.

## Purpose

Owns the Worker entry point, the wrangler configuration, and the generated Worker type definitions. Routes, middleware, and validators go in `packages/api-handlers/src/server/`; domain logic goes in `packages/shared`. `apps/api/src/index.ts` re-exports the Hono app and nothing else, so a change here is nearly always a change to wrangler config or asset handling.

## Layout

```
apps/api/
├── src/
│   ├── __tests__/   # vitest specs for the shell
│   └── index.ts     # Worker entry: re-exports the Hono app
└── public/          # gitignored, generated; served through the ASSETS binding
```

Root files worth knowing: `apps/api/wrangler.jsonc`, `apps/api/worker-configuration.d.ts` (generated), and the usual per-workspace vitest, oxlint, prettier, and lint-staged configs.

## Commands

| Task         | From the repo root | Notes                                                                                         |
| ------------ | ------------------ | --------------------------------------------------------------------------------------------- |
| Local Worker | `npm run dev`      | `apps/api/turbo.json` makes `dev` depend on `web#build`, so `apps/api/public` is filled first |
| Deploy       | `npm run deploy`   | `wrangler deploy --minify`                                                                    |
| Worker types | `npm run types`    | runs `wrangler types`, then copies the output into `packages/api-handlers`                    |
| Lint         | `npm run lint`     | `oxlint .`                                                                                    |

`apps/api/package.json` has no `build`, `check-types`, or `test` script. The missing `check-types` has a consequence worth reading in Gotchas; tests still run, see Testing.

## Module resolution and imports

`moduleResolution` is `Bundler`, so imports carry no file extension, as in `apps/api/src/index.ts`. No path aliases are defined. `apps/api/tsconfig.json` sets `jsxImportSource` to `hono/jsx` and takes ambient types from `./worker-configuration.d.ts` and `vitest/globals`. No workspace imports this one; wrangler bundles it from `src/index.ts`.

## Testing

`apps/api/vitest.config.ts` uses `defineProject` with `globals: true` and excludes `public/`. There is no setup file. The root `vitest.config.ts` lists `apps/*` under `projects`, so root `npm run test` runs these specs even though this workspace declares no `test` script. Specs live in `apps/api/src/__tests__/`.

## Lint and format

`apps/api/oxlint.config.ts` extends the `base` preset from `@repo/oxlint` and ignores `**/public/**` and `**/worker-configuration.d.ts`. `apps/api/prettier.config.js` re-exports the shared `base` unchanged, and `apps/api/.prettierignore` also skips the generated types file.

## Gotchas

1. Specs import `@repo/api-handlers/server`, which resolves to that package's built output rather than its source, and vitest runs outside turbo. Root `npm run test` therefore does not build api-handlers first: a stale `packages/api-handlers/dist` makes a passing run meaningless, and a missing one fails the suite outright.
2. This workspace has no `check-types` script, so `turbo run check-types` skips it entirely and the pre-commit hook will not catch a type error in `apps/api/src/index.ts`.
3. `npm run types` overwrites `packages/api-handlers/worker-configuration.d.ts` with a copy of `apps/api/worker-configuration.d.ts`. Both copies are committed, so edit neither by hand; re-run the script after changing bindings in `apps/api/wrangler.jsonc`.
4. `apps/api/public` is gitignored and fully generated: the `apps/web` build writes it via `--outDir=../api/public`, and the root `postbuild` script adds `CHANGELOG.md`. An empty `public/` means wrangler serves nothing at `/`.
5. `hono` is a declared dependency that no file under `apps/api/src` imports; it backs the `jsxImportSource` setting in `apps/api/tsconfig.json`.

## Boundaries

- Depends on: `@repo/api-handlers`, consumed as built output, and `hono`. Turbo builds api-handlers, and transitively `@repo/shared`, before this workspace's `dev` and `deploy` tasks.
- Depended on by: nothing.

This workspace is a leaf at the top of the graph. Code placed here is unreachable from `apps/web`, which imports `@repo/api-handlers` directly.
