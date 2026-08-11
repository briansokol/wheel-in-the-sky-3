# Architecture

How the monorepo is organized and where new code belongs. Workspace-specific
detail lives in each workspace's own `CLAUDE.md`.

## Monorepo structure

Managed by Turborepo over npm workspaces (`apps/*`, `packages/*`).

```
apps/
├── web/                    # React SPA frontend
└── api/                    # Cloudflare Worker shell

packages/
├── shared/                 # Core wheel domain logic
├── api-handlers/           # Hono route handlers
├── oxlint/                 # Shared oxlint presets
├── prettier/               # Shared Prettier config
└── lint-staged/            # Shared lint-staged config
```

### Workspace purposes

**`apps/web`** builds the React SPA with Vite, outputting to `apps/api/public/`
so the Worker can serve it from the edge.

**`apps/api`** is a thin Cloudflare Worker shell. It re-exports the Hono app
from `@repo/api-handlers` and owns the wrangler configuration and deploy. Logic
does not belong here.

**`packages/shared`** holds framework-agnostic wheel domain logic, shared types,
and Zod validators. Imported by both the web app and the API handlers.

**`packages/api-handlers`** holds the actual Hono routes plus the typed client
contract, kept separate from the Worker runtime so handlers stay testable.

**`packages/oxlint`, `packages/prettier`, `packages/lint-staged`** centralize
tooling configuration so every workspace shares one source of truth.

## Where code belongs

Ask, in order:

1. Is it wheel or spinner domain logic, a shared type, or a validation schema?
   Put it in `packages/shared`.
2. Is it an API route or request handler? Put it in `packages/api-handlers`.
3. Is it a React component, page, hook, or context? Put it in `apps/web/src/`.
4. Is it wrangler, deploy, or static-asset configuration? Put it in `apps/api`.

| What               | Where                                    |
| ------------------ | ---------------------------------------- |
| Wheel domain logic | `packages/shared/src/classes/`           |
| Zod validators     | `packages/shared/src/validators/`        |
| Shared types       | `packages/shared/src/types/`             |
| API route handlers | `packages/api-handlers/src/server/`      |
| React components   | `apps/web/src/components/`               |
| Pages              | `apps/web/src/pages/`                    |
| Context providers  | `apps/web/src/contexts/`                 |
| Custom hooks       | `apps/web/src/hooks/`                    |
| Tests              | a `__tests__/` directory beside the code |

A utility used in more than one workspace belongs in `packages/shared`. One used
only by the web app belongs in `apps/web/src/utils/`.

## Architectural patterns

**Shared core.** Domain logic lives in one place and is consumed by both the web
app and the API handlers, so behavior cannot drift between them.

**Framework separation.** `packages/shared` is framework-agnostic.
`apps/web` owns React concerns. `packages/api-handlers` owns HTTP concerns.
`apps/api` owns only the runtime wrapper.

**React Context for app state.** Providers in `apps/web/src/contexts/` cover
configuration, rotation, segment selection, and removed winners.

**URL-based configuration sharing.** Wheel configurations are encoded into URL
parameters, so the app needs no database and stays stateless. The `/api/config`
endpoint handles encoding and decoding.

**Edge deployment.** The Worker serves both the API and the bundled SPA.

## Technology stack

Major versions are listed only where they change how code is written. Exact
versions live in each workspace's `package.json`.

**Frontend**: React 19 with the React Compiler, React Router 7, TanStack React
Query, React Hook Form, HeroUI v2, Tailwind CSS v4, Framer Motion.

**Frontend build**: Vite with `@vitejs/plugin-react` and
`babel-plugin-react-compiler`. Because the React Compiler runs, manual `useMemo`
and `useCallback` wrapping is usually unnecessary.

**Backend**: Hono on Cloudflare Workers, with `@hono/zod-validator` for request
validation.

**Shared**: TypeScript in strict mode, Zod v4 for validation.

**Tooling**: Turborepo, Vitest with React Testing Library, oxlint, Prettier,
sherif for cross-workspace dependency consistency, husky and lint-staged.

**Error tracking**: Sentry, in both the browser and the Worker.

## Deployment model

1. `npm run build` bundles the web app with Vite into `apps/api/public/`.
2. `wrangler deploy` publishes `apps/api` to Cloudflare Workers.
3. One edge deployment serves the SPA and the API together, with SPA fallback
   routing configured in `apps/api/wrangler.jsonc`.

There is no server infrastructure and no database. State is carried in the URL.
