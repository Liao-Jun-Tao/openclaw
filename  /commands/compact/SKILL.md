---
name: compact
description: Compact conversation context to reduce token usage while preserving important information and context.
---

# Compact Command

Reduce conversation context length while preserving key information.

## When to Compact

- Context is approaching token limits
- Conversation has become long and unwieldy
- After completing a major task or milestone

## What Gets Preserved

- Current project context and goals
- Recent decisions and their rationale
- Active file state and modifications
- Unresolved issues or TODO items

## What Gets Removed

- Completed task details
- Verbose debugging output
- Redundant explanations
- Old context no longer relevant

## Result

A cleaner, shorter context that maintains:

- What you're working on
- Current state of the project
- Key decisions made
- What still needs to be done

## Usage

Simply invoke `/compact` to trigger context compaction.

The AI will:

1. Review current context
2. Create a condensed summary
3. Preserve essential information
4. Remove redundant content

## After Compacting

You can continue working with the same session but with reduced token usage, allowing for more turns before hitting limits.
