# AI Agent Workflows

This document describes specialized Claude Code subagents and when they should be used during development workflows. These subagents provide focused capabilities for specific tasks.

## Overview

Claude Code supports specialized subagents that can be invoked to handle specific types of tasks more effectively. Each subagent has access to particular tools and is optimized for a specific domain of work.

## Available Subagents

### docs-fetcher

**Purpose**: Retrieves and processes documentation for libraries and frameworks using the context7 MCP server.

**Model**: Haiku (fast, efficient for documentation lookup)

**Tools Available**:

- `mcp__context7__resolve-library-id`: Look up library IDs from context7
- `mcp__context7__get-library-docs`: Fetch complete documentation

**When to Use**:

- User asks for information about a specific library or framework
- Setting up a new feature that requires understanding library APIs
- Need to verify current best practices for a dependency
- Want to ensure implementation follows official documentation

**Examples**:

```
✅ Use docs-fetcher when:
- "How do I use React Query for data fetching?"
- "What's the best way to set up Zod validation?"
- "I need to understand Vitest testing patterns"
- "How does Hono middleware work?"

❌ Don't use docs-fetcher when:
- Documentation is already in the codebase
- Question is about project-specific code
- Internal architecture or patterns (use existing docs/)
```

**Common Library IDs**:

- NextJS: `/vercel/next.js`
- React: `/reactjs/react.dev`
- Vitest: `/vitest-dev/vitest`
- React Testing Library: `/testing-library/react-testing-library`
- Drizzle ORM: `/replit/drizzle-orm`

**Workflow Integration**:

1. User mentions needing to use a new library
2. Proactively invoke docs-fetcher to retrieve documentation
3. Use the documentation to provide accurate implementation guidance
4. Reference specific documentation sections when explaining patterns

## Best Practices for Working with Subagents

### When to Invoke Subagents

**Proactive Invocation**:

- Docs-fetcher: When user mentions adopting a new library or asks about library-specific patterns

**User-Requested Invocation**:

- User explicitly asks for documentation lookup

### Subagent Communication

**Clear Instructions**: When invoking a subagent, provide:

- Specific task description
- Relevant context (library name, UI component, feature scope)
- Expected output format
- Any constraints or requirements

**Example**:

```
Good: "Use docs-fetcher to retrieve React Query documentation,
       focusing on mutation patterns and error handling for our API handlers"

Avoid: "Look up React Query docs"
```

### Integration with Development Workflow

**Standard Development Flow**:

1. User requests feature implementation
2. Main agent determines if subagent assistance would be helpful
3. Invoke appropriate subagent(s) if needed
4. Use subagent output to inform implementation
5. Complete feature implementation following project patterns

**Testing Flow**:

1. Implement feature following development-guidelines.md
2. Write unit tests (Vitest) for business logic
3. Run test suite before committing

## Subagent Limitations

### docs-fetcher Limitations

- Only retrieves documentation from context7 MCP server
- Cannot access documentation not indexed by context7
- May not have the most recent documentation updates
- Cannot interpret or modify documentation content

## Future Subagents

This documentation will be updated as new specialized subagents are added to the Claude Code workflow.

**Potential Future Subagents**:

- Code review and analysis agents
- Performance profiling agents
- Security scanning agents
- Dependency update agents

---

**Related Documentation**: See [development-guidelines.md](development-guidelines.md) for coding standards and [architecture.md](architecture.md) for project structure.
