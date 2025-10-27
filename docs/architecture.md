# Architecture

## Monorepo Structure

**Wheel in the Sky 3** uses a monorepo architecture managed by Turborepo. The project is organized into applications and reusable packages with clear separation of concerns.

### Directory Organization

```
apps/
├── web/                    # React SPA frontend application
└── api/                    # Hono backend on Cloudflare Workers

packages/
├── shared/                 # Core business logic (WheelManager, Config, Segment)
├── api-handlers/           # Hono route handlers
├── e2e/                    # Playwright end-to-end tests
├── eslint/                 # Shared ESLint configuration
├── prettier/               # Shared Prettier configuration
└── lint-staged/            # Shared lint-staged configuration
```

### Workspace Purposes

**`apps/web`** - React Single Page Application
- User-facing frontend built with React 19 and TypeScript
- Vite bundled, outputs to `apps/api/public/`
- React Router for client-side navigation
- Communicates with API handlers for wheel configuration encoding

**`apps/api`** - Hono API on Cloudflare Workers
- Deploys to Cloudflare Workers edge compute
- Imports handlers from `@repo/api-handlers`
- Serves web app from `public/` directory
- Handles wheel configuration encoding/decoding

**`packages/shared`** - Core Business Logic
- Framework-agnostic wheel domain logic
- Contains: WheelManager (wheel state), Config (serialization), Segment (segment representation)
- Zod validators for type-safe configuration
- Utility functions for colors, encoding, math
- Imported by both web app and API handlers

**`packages/api-handlers`** - API Handlers
- Hono route handlers for API endpoints
- Separates API logic from Cloudflare Worker runtime
- Handlers are independently testable
- Exports for both server and client consumption

**`packages/e2e`** - End-to-End Tests
- Playwright test suite
- Tests complete workflows across app and API
- Isolated from web/api build dependencies

**Configuration Packages** - ESLint, Prettier, lint-staged
- Centralized tooling configuration
- Used by all workspaces
- DRY principle: single source of truth for quality standards

## Where Code Belongs

### Adding a New Feature

**Ask these questions to determine placement**:

1. **Is this core wheel/spinner business logic?**
   - YES → Add to `packages/shared`
   - Example: New WheelManager method, segment calculation, color logic

2. **Is this an API endpoint or handler?**
   - YES → Add to `packages/api-handlers`
   - Example: New route for configuration, new validation endpoint

3. **Is this a React component or page?**
   - YES → Add to `apps/web/src/`
   - Example: New UI component, new page, new page layout

4. **Is this shared between web and API?**
   - YES → Add to `packages/shared`
   - Example: Shared types, validation schemas, utility functions

5. **Is this a type definition?**
   - YES → Add to `packages/shared/src/types/` (if shared) or local to component (if app-specific)

### Common Placements

| What | Where | Why |
|------|-------|-----|
| WheelManager methods | `packages/shared/src/classes/` | Domain logic, used by both web and handlers |
| Zod validators | `packages/shared/src/validators/` | Reusable validation, shared by web/API |
| React components | `apps/web/src/components/` | UI-specific, only web needs it |
| API route handlers | `packages/api-handlers/src/server/` | API logic, independent from Cloudflare runtime |
| Utility functions | `packages/shared/src/utils/` or local | If used multiple places, add to shared |
| Tests | Co-located with source (`.test.ts` or `.test.tsx`) | Easy to maintain alongside code |
| Page components | `apps/web/src/pages/` | React Router pages |
| Context providers | `apps/web/src/contexts/` | React-specific state management |

## Core Domain Classes

### WheelManager

**Purpose**: Manages wheel state, segments, colors, winner tracking, and animations.

**Location**: `packages/shared/src/classes/WheelManager.ts`

**Responsibilities**:
- Segment management (add, remove, update)
- Color assignment and randomization
- Winner tracking and removal
- Animation state
- Wheel configuration

**Used By**: Web app, API handlers for wheel operations

### Config

**Purpose**: Serializes and deserializes wheel configurations using a fluent API.

**Location**: `packages/shared/src/classes/Config.ts`

**Responsibilities**:
- Create configuration from WheelManager state
- Parse configuration from serialized format
- Fluent builder pattern for construction
- Format conversion for sharing via URL

**Used By**: Web app for loading/saving wheels, API for configuration encoding

### Segment

**Purpose**: Represents a single wheel segment.

**Location**: `packages/shared/src/classes/Segment.ts`

**Responsibilities**:
- Segment data (name, color, index)
- Segment properties and relationships
- Segment validation

**Used By**: WheelManager, Web components for rendering

## Architectural Patterns in Use

### 1. Monorepo with Shared Libraries

All business logic centralized in `packages/shared`, avoiding duplication. Both web app and API handlers import from shared package.

### 2. Separation of Framework Concerns

- **Core Domain** (`packages/shared`): Framework-agnostic business logic
- **Frontend** (`apps/web`): React-specific UI and state management
- **Backend** (`packages/api-handlers`): API logic, imported by Cloudflare Worker
- **Infrastructure** (`apps/api`): Cloudflare Worker runtime wrapper

### 3. React Context for State Management

Multiple context providers manage app state:
- `ConfigProvider`: Wheel configuration
- `RotationProvider`: Wheel spinning state
- `SegmentProvider`: Segment selection
- `RemovedWinnersProvider`: Removed participants

### 4. URL-Based Configuration Sharing

Wheel configurations are encoded in URL parameters (no database required). The `/api/config` endpoint handles encoding/decoding.

### 5. Cloudflare Workers Deployment

Backend runs on Cloudflare Workers edge compute. Web app bundled to `apps/api/public/` for serving from edge.

## Technology Stack Overview

**Frontend Runtime**: React 19.1.0, TypeScript 5.8.3
**Frontend Build**: Vite 6.3.5 with @vitejs/plugin-react-swc
**Backend Runtime**: Hono 4.8.2 on Cloudflare Workers
**Monorepo**: Turborepo 2.5.4
**Validation**: Zod 3.25.67
**Testing**: Vitest 3.2.4, Playwright, React Testing Library
**Code Quality**: ESLint 9.29.0, Prettier 3.5.3
**Error Tracking**: Sentry (v9.30.0)

## Deployment Model

**Environment**: Cloudflare Workers (edge computing)

**Build Process**:
1. `npm run build` bundles web app with Vite
2. Output goes to `apps/api/public/`
3. `wrangler deploy` deploys `apps/api` to Cloudflare Workers
4. Edge location serves both web app and API

**Characteristics**:
- No traditional server infrastructure
- Global CDN edge deployment
- Stateless design (config shared via URL)
- SPA 404 handling configured in wrangler.jsonc

## Decision Flow Diagram

```
New Feature Decision:

Is it wheel/spinner domain logic?
├─ YES → packages/shared
│
Is it API endpoint/handler?
├─ YES → packages/api-handlers
│
Is it React component/page?
├─ YES → apps/web/src/
│
Is it shared between multiple places?
├─ YES → packages/shared (if not above)
│
Is it tests/configuration?
└─ Place with related code
```

---

**Related Documentation**: See `docs/development-guidelines.md` for coding patterns and `docs/context-organization.md` for documentation overview.
