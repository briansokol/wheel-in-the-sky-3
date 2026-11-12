# Architecture

How the app is organized and where new code belongs. Conventions, commands, and
gotchas live in the root `CLAUDE.md`.

## Source structure

The app is a single Vite project at the repository root. All source code lives
under `src/`.

```
src/
├── assets/             # Module-imported assets
├── classes/            # Wheel domain classes: Config, Segment, WheelManager
├── compatibility/v2/   # Conversion of v2-era wheel URLs to a v3 Config
├── components/         # Reusable React components
├── constants/          # Literal values, size limits, route paths
├── contexts/           # React contexts and their providers
├── enums/              # Shared enums
├── hooks/              # Custom React hooks
├── pages/              # Route-level screens and their layouts
├── types/              # Type declarations and some runtime defaults
├── utils/              # Helpers with no React dependency, including the share-link codec
└── validators/         # Zod schemas
```

The Vite, wrangler, TypeScript, and tool configs sit at the repository root
beside `src/`. Files in `public/` are copied verbatim into the build output.

## Where code belongs

| Directory                | What goes there                                                 |
| ------------------------ | --------------------------------------------------------------- |
| `src/classes/`           | Wheel and spinner domain classes                                |
| `src/compatibility/v2/`  | Code that reads v2-era wheel URLs                               |
| `src/components/`        | React components used by more than one page                     |
| `src/constants/`         | Literal values and limits                                       |
| `src/contexts/`          | Context providers and their hooks                               |
| `src/enums/`             | Enums                                                           |
| `src/hooks/`             | Custom hooks                                                    |
| `src/pages/`             | Route-level screens                                             |
| `src/types/`             | Type declarations                                               |
| `src/utils/`             | Helper functions, including `encoding.ts`, the share-link codec |
| `src/validators/`        | Zod validation schemas                                          |
| `__tests__/` beside code | Tests for the code in the parent directory                      |
| repository root          | Wrangler, deploy, and static-asset configuration                |

## Architectural patterns

**React Context for app state.** Providers in `src/contexts/` cover
configuration, rotation, segment selection, and removed winners.

**URL-based configuration sharing.** A wheel's configuration travels in the URL
fragment as `#c=v5.<data>`, so the app needs no database and the wheel's
contents are never sent to a server. The codec in `src/utils/encoding.ts` turns
a config into a compact payload (defaults omitted, derived colors not stored),
compresses it with `deflate-raw`, and base64url-encodes it. Decoding caps the
input and decompressed sizes and validates the payload with Zod.

**Edge deployment.** Cloudflare serves the built SPA as static assets, with
single-page-application fallback routing. There is no Worker script.

## Technology stack

Major versions are listed only where they change how code is written. Exact
versions live in `package.json`.

**Frontend**: React 19 with the React Compiler, React Router 7, React Hook Form
with a Zod resolver, HeroUI v3, Tailwind CSS v4, Framer Motion.

**Frontend build**: Vite with `@vitejs/plugin-react` and
`babel-plugin-react-compiler`. Because the React Compiler runs, manual `useMemo`
and `useCallback` wrapping is usually unnecessary.

**Backend**: none. Encoding and decoding run in the browser.

**Tooling**: Vitest with React Testing Library, oxlint, Prettier, husky and
lint-staged.

**Error tracking**: Sentry in the browser, with the `c=` value redacted from
URLs before events are sent.

## Deployment model

1. `npm run build` bundles the web app with Vite into `dist`.
2. `wrangler deploy`, run from the repository root, publishes those files as
   static assets.
3. SPA fallback routing is configured in `wrangler.jsonc`.

There is no server infrastructure and no database. State is carried in the URL.
