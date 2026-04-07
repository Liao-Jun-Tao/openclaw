---
name: think
description: Enable thinking mode to show the AI's reasoning process. Use for complex problem-solving, architecture decisions, or learning purposes.
---

# Think Command

Enable thinking mode to see how the AI reasons through problems.

## Usage

```bash
# Check thinking status
/think status

# Enable thinking at medium level
/think enable --level medium

# Show current thinking
/think show

# Disable thinking
/think disable
```

## Thinking Levels

| Level    | Max Tokens | Approx Duration | Use Case                    |
| -------- | ---------- | --------------- | --------------------------- |
| `off`    | 0          | Instant         | Simple, fast responses      |
| `low`    | 2,000      | ~2s             | Straightforward tasks       |
| `medium` | 8,000      | ~8s             | Normal complexity           |
| `high`   | 15,000     | ~15s            | Complex problem-solving     |
| `ultra`  | 30,000     | ~30s            | Deep reasoning (Haiku 4.5+) |

## What Thinking Shows

### Example: System Architecture

```
🤔 Thinking...

Let me analyze this microservices migration:

1. **Understand the current state**
   - Monolithic app with 50k lines
   - 5 developers
   - Strong DC coupling

2. **Evaluate migration strategies**

   Option A: Strangler Fig
   - Pros: Incremental, lower risk
   - Cons: Longer timeline (6-12 months)
   - Best for: Critical systems

   Option B: Big Bang
   - Pros: Clean slate
   - Cons: High risk, downtime
   - Best for: Small, replaceable

3. **Recommendation**
   Based on team size and complexity:
   → Strangler Fig Pattern
   → Start with bounded context: User Auth
   → Migrate 1 service/quarter
```

## When to Use Thinking

### Good Use Cases

- Architecture decisions
- Debugging complex issues
- Learning how something works
- Planning implementations
- Code review with reasoning

### Maybe Skip

- Simple questions
- Quick lookups
- Time-sensitive tasks
- Already know the answer

## Thinking and Coding

When coding with thinking enabled:

```
🤔 Planning the auth implementation...

1. Requirements Analysis
   - Need JWT tokens
   - Refresh token rotation
   - Secure httpOnly cookies

2. Security Considerations
   - Password hashing: PBKDF2 (not MD5!)
   - Token expiry: 15min access, 7d refresh
   - CSRF protection via SameSite

3. Implementation Plan
   - auth/service.ts - JWT generation
   - auth/middleware.ts - Token validation
   - auth/routes.ts - API endpoints

4. Test Strategy
   - Unit: hash function, token gen
   - Integration: full auth flow
```

## Model Support

Thinking is supported on:

- Claude 4+ (Opus 4+, Sonnet 4+, Haiku 4.5+)
- Not supported on Claude 3.x

## Tips

1. **Start low** - Use `low` for simple tasks
2. **Escalate as needed** - Increase level for complex problems
3. **Watch tokens** - Higher thinking = more tokens used
4. **Consider cost** - Thinking adds to token usage

## Examples

```bash
# Quick question
/think enable --level low
Think about which caching strategy to use?

# Complex decision
/think enable --level high
Should we use microservices or monolith for our startup?

# Architecture
/think enable --level medium
Design a multi-tenant SaaS architecture
```
