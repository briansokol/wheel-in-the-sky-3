# Wheel in the Sky 3

TypeScript React SPA with a Hono API backend on Cloudflare Workers, organized as
an npm-workspaces monorepo managed by Turborepo.

Every workspace has its own `CLAUDE.md` holding the facts specific to it. Read
that file before working inside a workspace. This file covers only what applies
everywhere.

## Package context

| Workspace                         | Purpose                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `apps/web/CLAUDE.md`              | React SPA, Vite bundled into `apps/api/public/`              |
| `apps/api/CLAUDE.md`              | Cloudflare Worker shell, wrangler config, deploy             |
| `packages/shared/CLAUDE.md`       | Framework-agnostic wheel domain logic, types, Zod validators |
| `packages/api-handlers/CLAUDE.md` | Hono routes and the typed client contract                    |
| `packages/oxlint/CLAUDE.md`       | Shared oxlint presets                                        |
| `packages/prettier/CLAUDE.md`     | Shared Prettier config                                       |
| `packages/lint-staged/CLAUDE.md`  | Shared lint-staged config                                    |

See `docs/architecture.md` for the monorepo map and the decision flow for where
new code belongs.

## Core rules

### 1. Do what has been asked; nothing more, nothing less

No unrequested features, refactoring, or "improvements". Every changed line
should trace to the request.

### 2. Ask when unclear

If a request is ambiguous or conflicts with a documented pattern, ask a specific
question and wait for an answer. Do not guess.

### 3. Respect workspace boundaries

Domain logic goes in `@repo/shared`. API routes go in `@repo/api-handlers`.
React components go in `apps/web`. `apps/api` is a deployment shell, not a home
for logic. When unsure, see `docs/architecture.md`.

### 4. Test before committing

Write Vitest tests for logic and React Testing Library tests for components.
Verify they pass. Do not commit failing tests.

### 5. AGPL-3.0 compliance

This is copyleft software. Preserve existing copyright headers and record
user-facing changes in `CHANGELOG.md`.

## Conventions

**Filenames are kebab-case, without exception**: `wheel-manager.ts`,
`config-provider.tsx`, `removed-winners-list.tsx`. This holds for components,
utilities, types, and tests alike. Never PascalCase or camelCase filenames.

**Identifiers** follow ordinary TypeScript convention: PascalCase for
components, types, and classes; camelCase for functions and variables;
UPPER_SNAKE_CASE for module-level constants. Do not confuse this with the
filename rule above.

**Tests live in `__tests__/` directories** beside the code they cover, named
`<subject>.test.ts` or `<subject>.test.tsx`. They are not co-located as siblings
of the source file.

**TypeScript is strict.** No `any`. Explicit types on parameters and return
values. `interface` for object shapes, `type` for unions and tuples.

**JSDoc on exported functions and classes.** Skip it where the code is obvious.
Do not narrate what a well-named function already communicates.

## Patterns

**State**, in order of preference. Use the narrowest option that works:

1. `useState` for state local to one component
2. React Context for app-level state, see `apps/web/src/contexts/`
3. TanStack React Query for server state

Never add Redux, MobX, or Zustand. Context plus Query is sufficient here.

**Forms**: React Hook Form with a Zod resolver. Shared schemas live in
`packages/shared/src/validators/`. API request validation uses
`@hono/zod-validator`.

**Animation**: Framer Motion. Do not hand-write CSS transitions.

**Imports**: ordering is applied automatically by
`@trivago/prettier-plugin-sort-imports` via `@repo/prettier`. Do not hand-order
imports or work around the formatter.

**Dependencies**: install from the repo root, targeting a workspace, pinned to
an exact version. Never `cd` into a workspace to install.

```bash
npm install --save-exact --workspace apps/web <package>
```

## Workflow

Work on a feature branch. Write tests alongside the implementation. Update
`CHANGELOG.md` for user-facing changes.

The husky `pre-commit` hook runs, in order:

1. `npm run sherif`, which checks dependency consistency across workspaces
2. `npm run check-types`
3. `npx lint-staged`, which applies `oxlint --fix`, `prettier --write`, and
   `vitest related --run` to staged files

A commit therefore runs the tests related to your staged changes. Run
`npm run test` yourself for the full suite.
