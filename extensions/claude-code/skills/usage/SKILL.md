---
name: usage
description: View detailed usage statistics including tokens, API calls, session counts, and feature usage over time.
---

# Usage Command

View detailed usage statistics.

## View Usage Stats

```bash
/usage
bash command:"openclaw usage"
bash command:"openclaw usage --detailed"
```

## Usage Timeframes

```bash
bash command:"openclaw usage --today"
bash command:"openclaw usage --week"
bash command:"openclaw usage --month"
bash command:"openclaw usage --year"
bash command:"openclaw usage --all-time"
```

## Usage Categories

### Tokens
```bash
bash command:"openclaw usage --tokens"
```
Shows input/output token breakdown by model.

### Sessions
```bash
bash command:"openclaw usage --sessions"
```
Shows session count, average length, creation dates.

### Commands
```bash
bash command:"openclaw usage --commands"
```
Shows most used commands (/commit, /review, etc.).

### Tools
```bash
bash command:"openclaw usage --tools"
```
Shows tool usage breakdown (bash, read, edit, etc.).

## Usage Report

```
OpenClaw Usage Report
Period: Jan 1 - Jan 31, 2024

Tokens
├── Claude Sonnet: 1.2M input, 450K output
├── GPT-4: 800K input, 300K output
└── Total: 2.0M input, 750K output

Sessions
├── Total: 45
├── Avg Length: 32 messages
├── Most Active: project-x (23 sessions)

Commands Used
├── /commit: 34 times
├── /review: 28 times
├── /search: 56 times
└── /help: 12 times
```

## Export Usage Data

```bash
bash command:"openclaw usage --export"
bash command:"openclaw usage --format csv"
```
