# CRITICAL: Content Separation Requirements

This file contains ONLY behavioral rules for AI agents.
Project-specific information (language, frameworks, architecture) belongs in docs/
DO NOT add: project descriptions, version info, or technical specifications here.
See docs/ for all project-specific documentation.

---

# Wheel in the Sky 3 - Claude Code Context

## Project Identification

**Wheel in the Sky 3** is a TypeScript React SPA with a Hono API backend on Cloudflare Workers.

## Core Behavioral Rules

### 1. Do What Has Been Asked; Nothing More, Nothing Less

Generate exactly what is requested. Don't add features, refactoring, or "improvements" unless explicitly asked. If requirements are ambiguous, ask for clarification rather than assuming.

### 2. Follow TypeScript Strict Mode

All code must:
- Use TypeScript strict mode (no `any` types)
- Have explicit type annotations on function parameters and returns
- Define interfaces for all object shapes
- Pass type checking without errors

### 3. Maintain Monorepo Structure

Understand and respect the monorepo organization:
- Place code in correct workspace (shared, web, or api-handlers)
- Core logic goes in `@repo/shared`
- React components go in `apps/web`
- API handlers go in `@repo/api-handlers`
- See docs/architecture.md for decision flow

### 4. Follow Project Patterns

Write code matching established patterns:
- Use React Context for app-level state
- Use React Query for server state
- Use React Hook Form for form state
- Use Zod for validation
- See docs/development-guidelines.md for detailed patterns

### 5. AGPL-3.0 License Compliance

This is copyleft software under AGPL-3.0. When modifying:
- Preserve existing copyright headers
- Document significant changes in CHANGELOG.md
- Understand that modifications may require source code sharing
- Include license references in generated documentation

### 6. Test Before Committing

- Write tests for new code (Vitest for logic, React Testing Library for components)
- Verify tests pass locally
- Don't commit code with failing tests
- Include E2E tests for complete workflows

### 7. Write Clear, Maintainable Code

- Use descriptive names (PascalCase for components, camelCase for functions)
- Keep components focused on single responsibility
- Document exported functions with JSDoc
- Avoid commented-out code and console.log statements

### 8. Ask for Clarification

If requirements are unclear, ambiguous, or conflict with documented patterns:
- Ask specific clarifying questions
- Don't make assumptions
- Wait for explicit user guidance before proceeding

## Project Documentation

For detailed project information, architecture, and coding patterns:

- **Architecture & Monorepo Structure**: See `docs/architecture.md`
- **Development Standards & Patterns**: See `docs/development-guidelines.md`
- **Documentation Organization**: See `docs/context-organization.md`

All project-specific information is in the `docs/` directory. Reference these files when making architectural or implementation decisions.

## Development Workflow

- Create feature branches for changes
- Write tests alongside implementation
- Run `npm run lint` before committing (enforced by Husky)
- Run `npm run test` to verify tests pass
- Follow existing commit message patterns
- Update CHANGELOG.md for user-facing changes

## Deployment Context

- Frontend: React SPA bundled with Vite to `apps/api/public/`
- Backend: Hono on Cloudflare Workers (edge computing)
- Configuration: Shared via URL parameters (no database)
- Error Tracking: Sentry integration for production monitoring

## Success Criteria for Code

✅ Matches documented patterns from docs/
✅ Passes TypeScript strict mode
✅ Has tests and they all pass
✅ Follows naming conventions (PascalCase/camelCase)
✅ Uses appropriate state management for the scope
✅ Includes JSDoc for exported functions
✅ Respects monorepo structure
✅ Compliant with AGPL-3.0 principles

---

**Remember**: Reference `docs/` directory for detailed implementation guidance. This file contains only core behavioral rules.
