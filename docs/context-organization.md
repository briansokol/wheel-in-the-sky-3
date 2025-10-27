# Context Organization

This document explains how AI context is organized for Wheel in the Sky 3 to help AI agents navigate and understand the project structure.

## Documentation Structure

**AI context documentation is organized in the `docs/` directory**:

```
docs/
├── architecture.md              # Monorepo structure, workspace organization
├── development-guidelines.md    # Coding standards, patterns, conventions
├── context-organization.md      # This file - meta-documentation
```

**Root context files**:
- `CLAUDE.md` - Primary context file for Claude Code (references docs/)
- `.github/copilot-instructions.md` - Context file for GitHub Copilot (mirrors CLAUDE.md)

## What Each Documentation File Contains

### architecture.md

**Purpose**: Helps AI agents understand the project structure and where code belongs.

**Sections**:
- Monorepo structure and workspace purposes
- Where code belongs (decision flow for new features)
- Core domain classes (WheelManager, Config, Segment)
- Architectural patterns in use
- Technology stack overview
- Deployment model

**Use When**: Deciding where to place new code, understanding how systems interact, or making architectural decisions.

### development-guidelines.md

**Purpose**: Provides coding standards and patterns for consistent code generation.

**Sections**:
- TypeScript and type safety requirements
- Naming conventions (PascalCase, camelCase, etc.)
- Component composition patterns
- State management layers (Context, Query, etc.)
- Form handling with React Hook Form
- Testing expectations
- Animation patterns with Framer Motion
- Error handling approach
- Import organization
- JSDoc documentation standards
- Validation with Zod
- Common patterns and examples

**Use When**: Writing components, functions, or any code that needs to match project patterns.

### CLAUDE.md (Root Context File)

**Purpose**: Serves as the entry point for Claude Code with essential behavioral rules and references.

**Content**:
- Self-documenting header about content separation
- Core behavioral rules for code generation
- Minimal project identification
- References to detailed documentation in docs/

**Key Principle**: Does NOT duplicate content from docs/ files. Uses references instead.

Example: "For development standards, see docs/development-guidelines.md"

### .github/copilot-instructions.md (Copilot Context File)

**Purpose**: Provides GitHub Copilot with the same context as Claude Code for consistency.

**Content**: Mirrors CLAUDE.md structure for consistency between AI tools.

## How AI Agents Use This Documentation

### Initial Context Setup

When starting a new session, AI agents receive:
1. Root context file (CLAUDE.md or .github/copilot-instructions.md)
2. Essential behavioral rules from root file
3. References to detailed docs/ files for specific topics

### Navigation Flow

**AI agents follow this pattern**:

1. Read root context file (CLAUDE.md)
2. Understand essential rules and behavioral expectations
3. Reference `docs/architecture.md` for architectural decisions
4. Reference `docs/development-guidelines.md` for coding patterns
5. Use `docs/context-organization.md` to understand the documentation system

### Example Scenarios

**Scenario 1: Adding a new API endpoint**
1. Consult `docs/architecture.md` for API handler placement
2. Check `docs/development-guidelines.md` for validation patterns
3. Reference existing handlers in `packages/api-handlers/`
4. Implement following documented patterns

**Scenario 2: Creating a new React component**
1. Consult `docs/development-guidelines.md` for component patterns
2. Check naming conventions (PascalCase)
3. Review state management approach (Context/Query)
4. Implement following patterns with JSDoc documentation

**Scenario 3: Making architectural decisions**
1. Consult `docs/architecture.md` for code placement decision tree
2. Determine if code belongs in shared, app-specific, or handlers
3. Follow established patterns for that location

## Cross-References Between Documents

**architecture.md references**:
- development-guidelines.md for coding patterns
- context-organization.md (this file) for documentation overview

**development-guidelines.md references**:
- architecture.md for code organization
- context-organization.md for documentation overview

**CLAUDE.md references**:
- architecture.md for monorepo structure
- development-guidelines.md for coding standards
- context-organization.md for documentation system

## Maintenance and Updates

### When to Update Documentation

**Update `docs/architecture.md` when**:
- Monorepo structure changes (new workspace, moved code)
- Architectural patterns change
- Core domain classes change significantly
- Deployment model or technology stack updates

**Update `docs/development-guidelines.md` when**:
- Coding standards change
- New patterns are established
- Testing approach changes
- State management approach evolves

**Update CLAUDE.md when**:
- Behavioral rules change
- Core principles shift
- References to docs/ files need updating
- License or compliance requirements change

### Update Process

1. Make code changes first
2. Update relevant docs/ file(s)
3. Update CLAUDE.md if behavioral rules affected
4. Update .github/copilot-instructions.md to match CLAUDE.md
5. Commit all changes together

### Solo Developer Notes

**Effort**: Updates take ~15-30 minutes per change
- Usually updating one or two docs/ files
- Quick reference update in CLAUDE.md
- Done alongside code changes

## Content Separation Principle

**Root files** (CLAUDE.md, .github/copilot-instructions.md):
- ✅ DO: Behavioral rules, project identification, references
- ❌ DON'T: Project descriptions, framework details, code examples

**docs/ files**:
- ✅ DO: Detailed guidance, examples, implementation patterns
- ✅ DO: Project-specific information, architecture, standards
- ❌ DON'T: Behavioral rules (those go in root)

**Example**:
- ❌ CLAUDE.md says "Use Zod for validation"
- ✅ docs/development-guidelines.md explains Zod validation patterns
- ✅ CLAUDE.md references development-guidelines.md

## Consistency Between AI Tools

**CLAUDE.md and .github/copilot-instructions.md must stay in sync**:
- Same behavioral rules
- Same references to docs/
- Same project identification
- Same license compliance emphasis

**docs/ files are shared by both tools**:
- No tool-specific variations
- Both tools reference same documentation
- Consistency across all AI development

## No Duplication Rule

**Critical Principle**: Content exists in ONE place only.

**Example of violation**:
- CLAUDE.md includes full architecture explanation (should reference docs/architecture.md)
- .github/copilot-instructions.md duplicates content from CLAUDE.md (should mirror, not duplicate)

**Correct approach**:
- CLAUDE.md: "For architecture details, see docs/architecture.md"
- .github/copilot-instructions.md: Same reference to docs/architecture.md
- Both files stay concise by using references

## AI Agent Expectations

**AI agents are expected to**:
- Read root context file first
- Follow references to detailed documentation
- Understand decision flows from architecture.md
- Follow coding patterns from development-guidelines.md
- Respect AGPL-3.0 license implications
- Ask for clarification if requirements are ambiguous
- Generate code matching documented patterns
- Write tests for new functionality
- Document complex logic with JSDoc

**AI agents should NOT**:
- Ignore documented patterns
- Assume alternative approaches
- Generate code that violates TypeScript strict mode
- Create new patterns without consultation
- Skip validation in API handlers
- Ignore AGPL-3.0 license requirements

---

**Related Documentation**: See `docs/architecture.md` for monorepo structure and `docs/development-guidelines.md` for coding standards.
