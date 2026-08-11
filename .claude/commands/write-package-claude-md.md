---
description: Generate a self-contained CLAUDE.md for one workspace, deriving every fact from that workspace's code and config
argument-hint: <workspace-path> e.g. packages/shared
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, Bash(ls:*), Bash(find:*), Bash(test:*), Bash(grep:*), Bash(wc:*)
---

# Write a package-level CLAUDE.md

Target workspace: **$1**

Pre-flight:

- Workspace listing: !`ls -1 $1`
- Source tree: !`find $1 -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/public/*" -not -name ".DS_Store" | sort`
- Existing file: !`test -f $1/CLAUDE.md && echo EXISTS || echo NONE`

If `$1` is empty, stop and ask which workspace to document. If `$1/package.json`
does not exist, stop: it is not a workspace. If the pre-flight blocks came back
empty, run those three commands yourself before continuing.

You will write exactly one file, `$1/CLAUDE.md`. You will not modify anything
else. You will not run builds, installs, or tests.

## Rule 0: sources of truth

**Derive every fact from code and config you open during this run.**

These are forbidden as fact sources. Do not open them to learn anything about
the workspace:

- `docs/**`
- `.github/copilot-instructions.md`
- `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- any sibling workspace's `CLAUDE.md`
- an existing `$1/CLAUDE.md`; if one exists, treat it as untrusted and rewrite
  from scratch

You may read the root `CLAUDE.md` exactly once, for one purpose: to learn which
rules already live at the root so you do not restate them. Copy no technical
claim out of it.

This repository's prose documentation has drifted from its code before. Reading
a doc to learn a fact is how that drift propagates and gains authority.

## Rule 1: tool selection

| Target                                                                            | Tool                                                |
| --------------------------------------------------------------------------------- | --------------------------------------------------- |
| Any `.ts` / `.tsx` under `src/`                                                    | `mcp__serena__get_symbols_overview` first            |
| A specific exported symbol you will name in the doc                                | `mcp__serena__find_symbol` with `include_body=true`  |
| Who consumes an export of this workspace                                           | `mcp__serena__find_referencing_symbols`              |
| Cross-workspace import strings (`@repo/<name>/...`)                                | `Grep`, as a multi-file discovery step               |
| `package.json`, `tsconfig*.json`, `turbo.json`, `wrangler.jsonc`                   | `Read`                                               |
| `vitest.config.ts`, `vite.config.ts`, `oxlint.config.ts`, `*.config.js`, `*.d.ts`  | `Read`; these are short declarative config           |

Never open a whole `src/*.ts` file with `Read` when an overview answers the
question. You are writing a map, so you need names and paths far more often
than bodies.

## Phase 1: config evidence

Read, skipping what does not exist:

1. `$1/package.json`: name, `type`, `exports`, `scripts`, dependencies
2. `$1/tsconfig.json` and any `tsconfig.*.json`
3. `$1/vitest.config.ts` or `$1/vite.config.ts`
4. `$1/oxlint.config.ts`, `$1/prettier.config.js`, `$1/lint-staged.config.js`
5. `$1/turbo.json`, `$1/wrangler.jsonc`, any `*.d.ts` at the workspace root
6. Root context: `package.json`, `turbo.json`, `vitest.config.ts`, `.husky/pre-commit`

Record before writing anything:

- the exact `exports` map and what each subpath points at
- every key in `scripts`, and which common scripts are **absent**
- `moduleResolution`, `module`, `outDir`, `composite`, and path aliases
- whether this workspace appears in the root `vitest.config.ts` `projects` array
- whether it appears in the root coverage `exclude` array
- `defineConfig` vs `defineProject` in its vitest config
- which oxlint presets it extends, and its ignore patterns

## Phase 2: structure

From the pre-flight tree, confirm by listing rather than assuming:

- which directories exist under `src/`, or at the workspace root if there is no `src/`
- where test files live
- actual filename casing
- whether `exports` subpaths map one-to-one onto directory names

## Phase 3: code survey

Run `get_symbols_overview` on the files that define the public surface: those
named in `exports`, the entry points, and the largest modules. Use `find_symbol`
only for symbols you will actually name in the document.

Look for what the exported symbols are, which local conventions repeat, and
anything that would surprise someone editing here for the first time.

## Phase 4: boundaries

- which workspaces this one depends on
- which workspaces import this one, found by grepping its package name across `apps/` and `packages/`
- the exact import specifier consumers write, not the on-disk path it resolves to
- any file generated in one workspace and copied into another

## Phase 5: size tier

Count files under `src/`, or at the workspace root if there is no `src/`.

| Tier | Files        | Budget for the whole file |
| ---- | ------------ | ------------------------- |
| A    | 5 or fewer   | 25 to 60 lines            |
| B    | 6 to 30      | 70 to 130 lines           |
| C    | more than 30 | 130 to 220 lines          |

A tiny tooling package gets a genuinely short file. Do not pad it to resemble a
large one. **`## Gotchas` is exempt from this budget**: a small package with
three real traps documents all three.

## Phase 6: write `$1/CLAUDE.md`

Use this skeleton verbatim. Same headings, same spelling, same order. The two
conditional headings have mechanical triggers, so the same workspace always
yields the same shape.

```markdown
# <package.json name> (`<workspace path>`)

<One sentence: what this workspace is and its role in the monorepo.>

## Purpose

## Layout

## Key entry points

## Commands

## Module resolution and imports

## Build output and consumption

## Testing

## Lint and format

## Gotchas

## Boundaries
```

Include `## Key entry points` only for tier C. Include
`## Build output and consumption` only when `package.json` has a `build` script.

If a required section has nothing to say, keep the heading and write one line:
`Not applicable: <mechanical reason>.` Never delete a required heading. Never
add a heading that is not on this list.

### What belongs under each heading

**Purpose**, 2 to 4 sentences. What this workspace is responsible for, and what
does **not** belong here. Phrase the negative as a placement rule an agent can
act on, for example "React components do not go here; they go in
`apps/web/src/components/`".

**Layout**. A fenced tree of directories only, not every file, with one trailing
comment per directory. For config-only packages, list root files instead. This
is the "where do I put a new file" section.

**Key entry points**, tier C only. A two-column table of repo-relative path to
one line of description. Cap at 12 rows. Only files someone must read to orient.
No prose.

**Commands**. A table of task, command, and notes. Every command must be a
script key that literally exists in this `package.json`, or a documented
root-level invocation. Include how to run it from the repo root. Explicitly list
scripts an agent would expect to find but that are **absent**; a missing
`check-types` or `test` is a fact worth writing down.

**Module resolution and imports**. State the `moduleResolution` value and its
consequence. If it is `NodeNext`, say plainly that imports need an explicit
`.js` extension even in `.ts` source, and point at one real file that shows it.
State the path alias and its scope, and the specifier other workspaces use to
import this one. One line at most on import ordering, noting only that the
Prettier sort-imports plugin owns it.

**Build output and consumption**, only when a `build` script exists. The build
command and why it has two stages. The on-disk output shape and how it relates
to the `exports` map. The consequence for consumers: they resolve built output,
so a stale build makes their typecheck meaningless. Name the watch script.

**Testing**. Which config governs it and which helper it calls. Whether the
workspace is registered in the root vitest `projects` array; if it is not, say
so plainly, because that means the root `npm run test` does not run it. Where
tests live and how they are named, verified against a real listing. Any setup
file. Any deliberate coverage exclusion, and the fact that it is deliberate.

**Lint and format**. Which shared presets the oxlint config extends, and any
ignore patterns. One line on Prettier only if this workspace has a non-default
config. Do not restate global formatting values.

**Gotchas**. A numbered list. Each entry states the trap in one sentence, then
the file path that proves it. Prioritize things that silently produce a wrong
result: files generated in one workspace and copied into another, coupling
between an export map and a directory layout, declared exports whose target is
missing, scripts that exist at the root but not here, build-before-use
requirements, order-dependent dev workflows. If you found no trap, write
`None found beyond what is documented above.` Do not invent one.

**Boundaries**. Two short lists, depends on and depended on by, then any hard
rule about dependency direction that the current graph enforces.

## Rule 2: anti-drift constraints

1. Every claim traces to a file you opened this run. If you cannot name the
   file, delete the sentence.
2. All paths are repo-relative from the repository root and wrapped in
   backticks, for example `packages/shared/src/classes/config.ts`. Never
   `./src/...`, never absolute. This makes verification mechanical.
3. Do not restate root-level rules. Nothing about TypeScript strict mode,
   writing tests, asking for clarification, licensing, or commit workflow. A
   package file that repeats them is pure drift surface.
4. Do not invent conventions. Describe only patterns you observed in at least
   two files, or that a config file enforces. Write what the code does, in the
   present tense.
5. Prefer a path over a paragraph.
6. No code examples longer than three lines, except shell commands and trees.
7. No dependency version numbers. Point at the `package.json` instead. The only
   exception is a runtime or engine version that is itself a hard constraint.
8. No file counts, line counts, test counts, or percentages.
9. No status, roadmap, history, or TODO language. Nothing "currently" or "for now".
10. Filenames in this repository are kebab-case and tests live in `__tests__/`
    directories. Verify both against the actual listing before writing either
    claim, and never write the opposite from memory.
11. Write for an agent that has read the root `CLAUDE.md` and nothing else. The
    only external pointer permitted is `docs/architecture.md`.

## Phase 7: verification

Run all six checks. Fix and re-run anything that fails. Do not report success on
an unverified file.

**V1, every referenced path exists.** From the repository root:

```bash
grep -oE '`[^`]+`' $1/CLAUDE.md | tr -d '`' \
  | grep -E '^(apps|packages|docs|\.github|\.husky|\.claude)/' \
  | sed 's/[:,.]$//' | sort -u \
  | while read -r p; do [ -e "$p" ] || echo "MISSING: $p"; done
```

Expect no output. Any `MISSING:` line is a hallucinated path. A path you are
documenting **because it is absent** must be phrased in prose so it is obviously
a report of absence, not left as a bare backticked path.

**V2, every command is real.** Re-read `$1/package.json` and confirm each
command in the Commands table is an exact `scripts` key there or a root-level
script. Confirm each "missing script" claim by its absence from that same object.

**V3, tsconfig claims match.** Re-check `moduleResolution`, `outDir`, `paths`,
and `include`. The `.js` extension claim must match the actual resolution mode,
not your expectation.

**V4, banned content is absent.** No version numbers, no counts, no code block
over three lines outside shell and tree blocks, no pointer to `docs/` other than
`docs/architecture.md`, no restatement of a root rule.

**V5, structure.** `grep -n '^## ' $1/CLAUDE.md` matches the required set and
order, with conditional sections present only if their trigger fired.

**V6, budget.** `wc -l $1/CLAUDE.md` falls inside the tier band.

## Phase 8: report

State briefly: the tier and final line count; which conditional sections were
included and which trigger fired; the gotchas documented, one line each; and
anything you could not verify and therefore omitted.

Do not edit the root `CLAUDE.md`. Its package index is maintained separately.
