# Architecture

How the monorepo is organized and where new code belongs. Workspace-specific
detail lives in each workspace's own `CLAUDE.md`.

## Monorepo structure

Managed by Turborepo over npm workspaces (`apps/*`, `packages/*`).

```
apps/
└── web/                    # React SPA, deployed as static assets

packages/
├── shared/                 # Core wheel domain logic
├── oxlint/                 # Shared oxlint presets
├── prettier/               # Shared Prettier config
└── lint-staged/            # Shared lint-staged config
```

### Workspace purposes

**`apps/web`** builds the React SPA with Vite into `apps/web/dist`, and owns
the wrangler configuration and deploy for serving it from the edge.

**`packages/shared`** holds framework-agnostic wheel domain logic, shared types,
Zod validators, and the share-link codec. It must stay free of DOM and Node
APIs so a future backend could import it unchanged.

**`packages/oxlint`, `packages/prettier`, `packages/lint-staged`** centralize
tooling configuration so every workspace shares one source of truth.

## Where code belongs

Ask, in order:

1. Is it wheel or spinner domain logic, a shared type, or a validation schema?
   Put it in `packages/shared`.
2. Is it a React component, page, hook, or context? Put it in `apps/web/src/`.
3. Is it wrangler, deploy, or static-asset configuration? Put it in `apps/web`.

| What               | Where                                    |
| ------------------ | ---------------------------------------- |
| Wheel domain logic | `packages/shared/src/classes/`           |
| Zod validators     | `packages/shared/src/validators/`        |
| Shared types       | `packages/shared/src/types/`             |
| Share-link codec   | `packages/shared/src/utils/encoding.ts`  |
| React components   | `apps/web/src/components/`               |
| Pages              | `apps/web/src/pages/`                    |
| Context providers  | `apps/web/src/contexts/`                 |
| Custom hooks       | `apps/web/src/hooks/`                    |
| Tests              | a `__tests__/` directory beside the code |

A utility used in more than one workspace belongs in `packages/shared`. One used
only by the web app belongs in `apps/web/src/utils/`.

## Architectural patterns

**Shared core.** Domain logic lives in one place, separate from React, so it
can be tested on its own and reused by a backend if one is added later.

**Framework separation.** `packages/shared` is framework-agnostic.
`apps/web` owns React concerns and the deployment.

**React Context for app state.** Providers in `apps/web/src/contexts/` cover
configuration, rotation, segment selection, and removed winners.

**URL-based configuration sharing.** A wheel's configuration travels in the URL
fragment as `#c=v5.<data>`, so the app needs no database and the wheel's
contents are never sent to a server. The codec in
`packages/shared/src/utils/encoding.ts` turns a config into a compact payload
(defaults omitted, derived colors not stored), compresses it with
`deflate-raw`, and base64url-encodes it. Decoding caps the input and
decompressed sizes and validates the payload with Zod.

**Edge deployment.** Cloudflare serves the built SPA as static assets, with
single-page-application fallback routing. There is no Worker script.

## Technology stack

Major versions are listed only where they change how code is written. Exact
versions live in each workspace's `package.json`.

**Frontend**: React 19 with the React Compiler, React Router 7, React Hook Form
with a Zod resolver, HeroUI v3, Tailwind CSS v4, Framer Motion.

**Frontend build**: Vite with `@vitejs/plugin-react` and
`babel-plugin-react-compiler`. Because the React Compiler runs, manual `useMemo`
and `useCallback` wrapping is usually unnecessary.

**Backend**: none. Encoding and decoding run in the browser.

**Shared**: TypeScript in strict mode, Zod v4 for validation.

**Tooling**: Turborepo, Vitest with React Testing Library, oxlint, Prettier,
sherif for cross-workspace dependency consistency, husky and lint-staged.

**Error tracking**: Sentry in the browser, with the `c=` value redacted from
URLs before events are sent.

## Deployment model

1. `npm run build` bundles the web app with Vite into `apps/web/dist`.
2. `wrangler deploy`, run from `apps/web`, publishes those files as static
   assets.
3. SPA fallback routing is configured in `apps/web/wrangler.jsonc`.

There is no server infrastructure and no database. State is carried in the URL.
