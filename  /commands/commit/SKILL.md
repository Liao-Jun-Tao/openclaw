---
name: commit
description: Create a git commit from staged changes. Analyzes changes and generates a well-formatted commit message following repository conventions.
---

# Git Commit Command

Use the `bash` tool to create git commits.

## Workflow

1. First, check the current git status and recent commits:

```bash
bash command:"git status"
bash command:"git log --oneline -5"
```

2. Review staged changes:

```bash
bash command:"git diff --cached"
bash command:"git diff"
```

3. Create an appropriate commit message based on:
   - The nature of changes (feature, fix, refactor, docs, test)
   - The repository's existing commit message style
   - The "why" not just the "what"

4. Stage and commit:

```bash
bash command:"git add -A && git commit -m \"Your commit message\""
```

## Commit Message Guidelines

- Use imperative mood ("add feature" not "added feature")
- First line: 50 chars or less, summarize the change
- Body: Explain _why_ the change was made, not just what it does
- Reference issues/tickets if applicable

## Safety Rules

- NEVER skip git hooks (--no-verify)
- NEVER amend commits (create new commits)
- NEVER commit secrets (.env, credentials.json)
- Don't create empty commits if nothing changed
