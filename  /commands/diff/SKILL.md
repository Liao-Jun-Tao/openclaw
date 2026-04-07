---
name: diff
description: View differences between commits, branches, or files. Shows detailed changes with syntax highlighting.
---

# Diff Command

View and analyze differences in code.

## Common Usage

### Show unstaged changes (working tree vs staging)

```bash
bash command:"git diff"
```

### Show staged changes (staging vs last commit)

```bash
bash command:"git diff --cached"
bash command:"git diff --staged"
```

### Compare commits

```bash
bash command:"git diff HEAD~1 HEAD"           # Last commit vs previous
bash command:"git diff abc123..def456"      # Between two commits
bash command:"git diff HEAD~3..HEAD"        # Last 3 commits
```

### Compare branches

```bash
bash command:"git diff main..feature-branch"
bash command:"git diff HEAD..origin/main"
```

### Compare files

```bash
bash command:"git diff path/to/file"
bash command:"git diff branchA path/to/file:branchB:path/to/file"
```

### Show stats only (no actual diff)

```bash
bash command:"git diff --stat"
bash command:"git diff --numstat"
```

## Diff Options

| Option          | Description                         |
| --------------- | ----------------------------------- |
| `--stat`        | Show file change statistics         |
| `--name-only`   | Show only changed file names        |
| `--name-status` | Show file names with status (A/M/D) |
| `-w`            | Ignore whitespace changes           |
| `--color`       | Force color output                  |

## Word Diff

Show inline word-level changes:

```bash
bash command:"git diff --word-diff"
```

## Three-way Diff

Compare a file across three treeish versions:

```bash
bash command:"git diff HEAD:file.ext stage:file.ext"
```
