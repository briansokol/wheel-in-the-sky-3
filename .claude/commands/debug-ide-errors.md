# Debug IDE Errors

Use the typescript-error-analyzer agent to analyze and resolve all TypeScript type errors, ESLint warnings, and other IDE diagnostics in the current file. To analyze diagnostics across the entire codebase, explicitly specify "analyze all files".

<subagent_type>typescript-error-analyzer</subagent_type>

## Task Description

Analyze all current IDE diagnostic errors in the project including:

1. **TypeScript Type Errors**: Any type mismatches, implicit `any` usage, strict mode violations, or compiler issues
2. **ESLint/Linting Warnings**: Code quality issues, pattern violations, or style inconsistencies
3. **Other IDE Diagnostics**: Any additional warnings or errors reported by the development environment

For each error found:
- Retrieve the complete diagnostic information using the IDE diagnostics tool
- Identify the root cause and explain why the error occurred
- Provide targeted, actionable solutions that maintain type safety and follow project standards
- Ensure all solutions comply with TypeScript strict mode requirements
- Align fixes with established project patterns (React Context, React Query, Zod validation)
- Respect the monorepo structure (@repo/shared, apps/web, @repo/api-handlers)

Prioritize solutions that:
1. Maintain strict type safety and avoid `any` types
2. Follow documented project patterns from CLAUDE.md and docs/
3. Improve code maintainability and clarity

Present findings as a comprehensive analysis with:
- Clear categorization of errors by type (TypeScript, ESLint, etc.)
- File locations and line numbers for each issue
- Explanation of root causes
- Recommended fixes with code examples
- Any necessary architectural considerations
