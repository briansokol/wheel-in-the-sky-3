# Development Guidelines

Guidelines for writing code in Wheel in the Sky 3. These standards help maintain consistency across the monorepo and guide AI code generation.

## TypeScript and Type Safety

**Strict Mode**: All code uses TypeScript strict mode. No `any` types unless unavoidable.

**Type Requirements**:
- All function parameters must have explicit types
- All function return types should be explicit
- Use `interface` for object shapes
- Use `type` for unions, tuples, and complex types
- Export all public types and interfaces

**Examples**:
```typescript
// ✅ Good
interface Segment {
  name: string;
  color: string;
  index: number;
}

function addSegment(segment: Segment): void {
  // implementation
}

// ❌ Avoid
function addSegment(segment: any) {
  // implementation
}
```

## Naming Conventions

**Components**: PascalCase
```typescript
// ✅ Good
function WheelSpinner() { }
function ConfigPage() { }
function ActionAccordion() { }

// ❌ Avoid
function wheelSpinner() { }
function configPage() { }
```

**Functions and Variables**: camelCase
```typescript
// ✅ Good
function calculateSegmentColor() { }
const segmentCount = 10;

// ❌ Avoid
function CalculateSegmentColor() { }
const SegmentCount = 10;
```

**Constants**: UPPER_SNAKE_CASE (if module-level) or camelCase (if local)
```typescript
// ✅ Good
export const MAX_SEGMENTS = 50;
const primaryColor = "hsl(0, 100%, 50%)";

// ❌ Avoid
const max_segments = 50;
```

**File Names**:
- Components: PascalCase (e.g., `WheelSpinner.tsx`)
- Utilities: camelCase (e.g., `colorUtils.ts`)
- Types: lowercase with `.types.ts` extension (e.g., `config.types.ts`)
- Tests: same as source with `.test.ts` or `.test.tsx` extension

## Component Composition Patterns

**Functional Components with Hooks**: All components are functional components using React hooks.

**State Management Layers**:

1. **Local State**: Use `useState` for component-specific state
   ```typescript
   const [isOpen, setIsOpen] = useState(false);
   ```

2. **Context State**: Use React Context for app-level state (see `apps/web/src/contexts/`)
   ```typescript
   const { config, setConfig } = useContext(ConfigContext);
   ```

3. **Server State**: Use TanStack React Query for server data
   ```typescript
   const { data, isLoading } = useQuery({
     queryKey: ['wheel', wheelId],
     queryFn: () => fetchWheel(wheelId),
   });
   ```

**Component Size**: Keep components focused on single responsibility. Extract smaller components when:
- Component exceeds ~200 lines
- Multiple independent behaviors exist
- Component has deeply nested JSX

**Props Typing**:
```typescript
interface WheelProps {
  segments: Segment[];
  onSegmentClick: (segment: Segment) => void;
  isSpinning?: boolean;
}

function Wheel({ segments, onSegmentClick, isSpinning = false }: WheelProps) {
  // implementation
}
```

## State Management

**React Context Pattern**: Use for application-wide state (config, rotation state, removed winners)

**TanStack React Query**: Use for async server state (fetching, caching, synchronization)

**React Hook Form**: Use for form state (multi-field forms, validation)

**Never use**:
- Redux (overkill for this project)
- MobX (unnecessary complexity)
- Zustand (Context + Query is sufficient)

## Form Handling

**React Hook Form + Zod Validation**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConfigSchema } from '@repo/shared';

function ConfigForm() {
  const form = useForm({
    resolver: zodResolver(ConfigSchema),
    defaultValues: initialConfig,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

**Validation**: All validation schemas live in `packages/shared/src/validators/` as Zod schemas.

## Testing Expectations

**Unit Tests**: Write Vitest tests for business logic
- Location: Co-located with source files (`.test.ts` or `.test.tsx`)
- Scope: Test functions, utilities, hooks independently
- Tools: Vitest, @testing-library/react

**Component Tests**: Use React Testing Library for component testing
- Test user interactions, not implementation details
- Use `getByRole`, `getByLabelText` for queries
- Avoid testing internal state directly

**E2E Tests**: Use Playwright for complete workflows
- Test user journeys across app and API
- Located in `packages/e2e/`

**Test Coverage**: Aim for meaningful coverage, not 100% number chasing. Test:
- Critical business logic
- Edge cases and error states
- Component interactions
- API integration points

## Animation Patterns

**Framer Motion**: Use for all animations
```typescript
import { motion } from 'framer-motion';

<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 2 }}
>
  Content
</motion.div>
```

**CSS Transitions**: Avoid. Use Framer Motion instead for consistency.

## Error Handling

**Try/Catch for Async Operations**:
```typescript
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) throw new Error('Failed to load');
    return await response.json();
  } catch (error) {
    console.error('Config load error:', error);
    // Handle or rethrow
  }
}
```

**Sentry Integration**: Error tracking is configured for production. Error objects are automatically sent.

**User-Facing Errors**: Display meaningful messages to users, not technical error details.

## Imports Organization

**Order**:
1. React and external libraries
2. Internal shared packages (`@repo/shared`, etc.)
3. Local utilities and types
4. Components (relative paths)

**Example**:
```typescript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WheelManager, type Segment } from '@repo/shared';
import { useAppConfig } from '../contexts/ConfigContext';
import { colorUtils } from '../utils/colors';
import { WheelDisplay } from './WheelDisplay';
```

## JSDoc Documentation

**When to Write JSDoc**:
- All exported functions and classes
- Complex functions (>20 lines or non-obvious logic)
- Public APIs in `packages/shared`

**Format**:
```typescript
/**
 * Calculates the winning segment for a rotation angle.
 * @param angle - Rotation angle in degrees (0-360)
 * @param segmentCount - Number of segments on the wheel
 * @returns The index of the winning segment
 */
export function getWinningSegment(angle: number, segmentCount: number): number {
  // implementation
}
```

**Avoid**:
- Over-documenting obvious code
- Repeating what the code clearly shows
- Comments that don't add value

## Validation

**Zod Schemas**: Use for all input validation

**Location**: `packages/shared/src/validators/` for shared schemas

**Web Form Validation**: Integrate Zod with React Hook Form

**API Handler Validation**: Use `@hono/zod-validator` for request validation

**Example**:
```typescript
import { z } from 'zod';

export const SegmentSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  index: z.number().int().nonnegative(),
});

// Type inference
export type Segment = z.infer<typeof SegmentSchema>;
```

## File Organization

**Pages** (`apps/web/src/pages/`):
- One file per page
- Contains page-level logic and layout
- Imports components from `../components/`

**Components** (`apps/web/src/components/`):
- Reusable UI components
- One component per file or related components in folder
- Keep components focused and testable

**Hooks** (`apps/web/src/hooks/`):
- Custom React hooks
- Extracted logic that's reused across components

**Contexts** (`apps/web/src/contexts/`):
- React Context providers
- One context per file

**Utils** (`apps/web/src/utils/` and `packages/shared/src/utils/`):
- Utility functions
- Shared utilities in `packages/shared`
- App-specific utilities in `apps/web/src/utils`

**Types** (`apps/web/src/types/` and `packages/shared/src/types/`):
- Type definitions
- Use `.types.ts` file extension

**Tests**:
- Co-locate with source files
- Use `.test.ts` or `.test.tsx` extension

## Common Patterns

**Query Pattern** (fetching data):
```typescript
import { useQuery } from '@tanstack/react-query';

function WheelList() {
  const { data: wheels, isLoading, error } = useQuery({
    queryKey: ['wheels'],
    queryFn: async () => {
      const res = await fetch('/api/wheels');
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* render wheels */}</div>;
}
```

**Context Pattern** (app state):
```typescript
const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WheelConfig>(defaultConfig);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
}
```

**Hook Pattern** (reusable logic):
```typescript
function useWheelState(initialConfig: WheelConfig) {
  const [wheelManager, setWheelManager] = useState(
    () => new WheelManager(initialConfig)
  );

  const addSegment = (segment: Segment) => {
    setWheelManager(prev => {
      const updated = new WheelManager(prev);
      updated.addSegment(segment);
      return updated;
    });
  };

  return { wheelManager, addSegment };
}
```

## Code Review Checklist

Before committing, verify:
- ✅ TypeScript strict mode compliant (no `any` types)
- ✅ All types explicitly declared
- ✅ Naming follows conventions (PascalCase/camelCase)
- ✅ Components are focused and testable
- ✅ State management uses appropriate layer (local/Context/Query)
- ✅ Tests written and passing
- ✅ No console.log statements (except logging errors)
- ✅ No commented-out code
- ✅ Imports organized correctly
- ✅ JSDoc on exported functions/classes

## License Compliance

**AGPL-3.0 License**: This project is copyleft software. Important implications:
- Source code changes must be contributed back
- Proprietary modifications require legal review
- Deployment = distribution in AGPL
- Include license in documentation
- Maintain copyright notices in files

When modifying code:
- Preserve existing copyright headers
- Add yourself as contributor if substantial change
- Document significant modifications in CHANGELOG.md

---

**Related Documentation**: See `docs/architecture.md` for code organization and `docs/context-organization.md` for documentation overview.
