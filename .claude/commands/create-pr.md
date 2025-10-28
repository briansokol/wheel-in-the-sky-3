# Create or Update PR

Create a new pull request for the current branch, or update an existing PR description if one already exists. Uses the GitHub CLI and the PR template from `.github/PULL_REQUEST_TEMPLATE.md`.

<subagent_type>github-cli-manager</subagent_type>

## Task Description

Execute a pull request workflow using the GitHub CLI:

### Phase 1: Check for Existing PR
Use the GitHub CLI to:
- Check if a PR already exists for the current branch
- If found, retrieve the PR number and current description
- Note any new commits since the PR was created

### Phase 2: Gather Branch Information
Use git to determine:
- Current branch name
- Current commit history since main branch
- Summary of changes (files modified, lines changed)

### Phase 3: Load PR Template
- Read the `.github/PULL_REQUEST_TEMPLATE.md` file to use as the PR description template
- Extract the template structure and sections

### Phase 4: Create or Update PR
**If no PR exists:**
- Use `gh pr create` to create a new PR with:
  - Title: Branch name formatted as a descriptive title (e.g., "bugfix/visual-regressions" → "Fix visual regressions")
  - Body: PR template with sections filled in based on the changes
  - Target: main branch

**If PR already exists:**
- Use `gh pr edit` to update the PR description
- Preserve any user-filled content from the template sections (Description, Type of Change, Additional Context)
- Update the description to reflect new commits if any were added since the PR was created
- Keep the PR open and ready for review

### Phase 5: Provide Feedback
Display:
- PR URL (for new PRs)
- PR number and current status (for updated PRs)
- Summary of what was created or updated
- Next steps for the user

## Expected Output

One of the following outcomes:

**For new PR creation:**
```
✓ PR #123 created successfully
  URL: https://github.com/username/repo/pull/123
  Branch: bugfix/visual-regressions
  Target: main
```

**For existing PR update:**
```
✓ PR #123 updated successfully
  Branch: bugfix/visual-regressions
  Status: Open
  New commits included in updated description
```

## Notes

- Respects existing PR descriptions and user-provided content
- Intelligently extracts PR title from branch name if needed
- Accounts for new commits when updating existing PRs
- Handles edge cases like no changes, already-merged branches, etc.
