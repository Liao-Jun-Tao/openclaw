---
name: branch
description: List, create, switch, rename, and delete git branches. Manage branch lifecycle.
---

# Branch Command

Manage git branches for your repository.

## List Branches

### Local branches
```bash
bash command:"git branch"
bash command:"git branch -v"    # With last commit info
```

### Remote branches
```bash
bash command:"git branch -r"
```

### All branches (local + remote)
```bash
bash command:"git branch -a"
```

## Create Branches

### Create from current HEAD
```bash
bash command:"git branch feature/my-feature"
```

### Create and switch in one command
```bash
bash command:"git checkout -b feature/my-feature"
# or
bash command:"git switch -c feature/my-feature"
```

### Create from specific commit/branch
```bash
bash command:"git branch feature/my-feature abc123"
bash command:"git checkout -b feature/my-feature origin/main"
```

## Switch Branches

```bash
bash command:"git checkout main"
bash command:"git switch main"           # Modern alternative
bash command:"git checkout -"            # Switch to previous branch
```

## Rename Branch

```bash
# Rename current branch
bash command:"git branch -m new-name"
# Rename specific branch
bash command:"git branch -m old-name new-name"
```

## Delete Branch

```bash
# Delete merged branch (safe)
bash command:"git branch -d branch-name"

# Force delete unmerged branch
bash command:"git branch -D branch-name"

# Delete remote branch
bash command:"git push origin --delete branch-name"
```

## Track Remote Branches

```bash
# Set up tracking
bash command:"git branch -u origin/feature feature"

# Check tracking status
bash command:"git branch -vv"
```

## Merge Branches

```bash
# Merge feature into current branch
bash command:"git merge feature/my-feature"

# Merge with no fast-forward (creates merge commit)
bash command:"git merge --no-ff feature/my-feature"

# Abort merge if conflicts
bash command:"git merge --abort"
```

## Rebase Branches

```bash
# Rebase current branch onto main
bash command:"git rebase main"

# Interactive rebase (rewrite commits)
bash command:"git rebase -i HEAD~5"

# Continue after resolving conflicts
bash command:"git rebase --continue"

# Abort rebase
bash command:"git rebase --abort"
```
