# Unit Tests

Orchestrate a comprehensive unit test workflow that analyzes changed files, assesses test coverage, creates or updates tests as needed, and verifies all tests pass.

<subagent_type>git-change-analyzer</subagent_type>

## Task Description

Execute a complete unit testing workflow:

### Phase 1: Analyze Changed Files
Use the git-change-analyzer agent to:
- Identify all files that have changed in the current branch
- Determine which changes are likely to require new or updated unit tests
- Focus on source code changes (exclude documentation, configuration, type-only changes)

### Phase 2: Research Test Coverage (if needed)
For files with source code changes, use the code-researcher agent to:
- Locate existing unit tests for the changed files
- Assess current test coverage for modified functions/components
- Identify gaps in test coverage

### Phase 3: Create or Update Tests
Based on the analysis:
- Create new test files for any untested source files
- Add or update tests to cover the changes made
- Follow project testing patterns (Vitest for logic, React Testing Library for components)
- Ensure tests validate the actual behavior changes

### Phase 4: Verify Test Suite
Use the unit-test-runner agent to:
- Run all unit tests to ensure they pass
- Debug any failing tests and provide fixes
- Generate a comprehensive report of test status
- Confirm coverage hasn't regressed

## Expected Output

A summary report including:
1. Files changed and which require test updates
2. New tests created or existing tests modified
3. Test execution results (pass/fail count)
4. Any coverage gaps identified and addressed
5. Recommendations for additional test coverage if applicable
