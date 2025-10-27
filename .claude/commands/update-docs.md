# Update Documentation

You are assisting with updating AI-specific documentation in the Wheel in the Sky 3 project. Your task is to:

1. **Parse the request**: The user will provide a description of what documentation needs to be updated.

2. **Determine the correct location**: Identify which documentation file(s) should be updated based on the content type:
   - **CLAUDE.md**: Core behavioral rules for AI agents, project identification, critical development patterns (TypeScript strict mode, monorepo structure, testing requirements, license compliance)
   - **docs/architecture.md**: Monorepo structure, directory organization, project architecture, workspace decisions
   - **docs/development-guidelines.md**: Coding patterns, component patterns, state management patterns, styling conventions, testing patterns
   - **docs/context-organization.md**: Documentation organization structure and how to structure new documentation
   - **.github/copilot-instructions.md**: GitHub Copilot-specific instructions (if applicable)

3. **Understand the constraints**:
   - CLAUDE.md should contain ONLY behavioral rules and references to docs/ - NO project descriptions, versions, or technical specs
   - docs/ files contain detailed project-specific information
   - Changes should maintain consistency with existing documentation style and structure
   - Preserve all existing content not being modified

4. **Propose the update**: Before making changes, present:
   - The file(s) that need updating
   - The current content (if applicable)
   - The proposed changes and why they belong in the chosen location(s)
   - Ask for confirmation before proceeding

5. **Execute the update**: Once confirmed, make the necessary edits using appropriate tools.

6. **Verify**: Confirm the changes are correct and the documentation is complete.

## Key Documentation Principles

- **Separation of Concerns**: Behavioral rules (CLAUDE.md) vs. technical specifications (docs/)
- **Clarity**: Each section should have a clear purpose
- **Completeness**: Document both the "what" and the "why"
- **Maintainability**: Use headings, lists, and consistent formatting
