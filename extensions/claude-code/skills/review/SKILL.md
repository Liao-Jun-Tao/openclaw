---
name: review
description: Review code changes and provide feedback. Analyzes diffs for code quality, potential bugs, security issues, and best practices.
---

# Code Review Command

Review code changes for quality, bugs, security issues, and best practices.

## Workflow

1. Get the diff to review:
```bash
bash command:"git diff HEAD~1 HEAD"                    # Review last commit
bash command:"git diff main...HEAD"                   # Review all unpushed commits
bash command:"git diff --cached"                     # Review staged changes
bash command:"git diff branch-A..branch-B"           # Compare branches
```

2. For a PR or range of commits:
```bash
bash command:"git log origin/main..HEAD --oneline"   # List commits in PR
bash command:"git show --stat HEAD"                  # Show latest commit with stats
```

3. Review specific files:
```bash
bash command:"git diff path/to/file"
```

## Review Focus Areas

### Code Quality
- Is the code clear and readable?
- Are functions/classes appropriately sized?
- Is there proper error handling?

### Potential Bugs
- Off-by-one errors
- Null/undefined handling
- Race conditions
- Resource leaks

### Security
- Input validation
- SQL/injection vulnerabilities
- Authentication/authorization issues
- Secrets exposure

### Best Practices
- Follow language idioms
- Proper testing
- Documentation
- Performance considerations

## Output Format

Provide structured feedback:
```
## Summary
[Brief description of what was reviewed]

## Issues Found
1. [Severity] [File:Line] - [Description]
2. ...

## Suggestions
- ...

## LGTM (Looks Good To Me)
[List of things done well]
```
