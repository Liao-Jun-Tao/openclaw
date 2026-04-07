---
name: think
description: Enable visible thinking mode to show the AI's reasoning process. Use for complex problem-solving, architecture decisions, or learning purposes.
---

# Think Command

Enable visible thinking to see how the AI reasons through problems.

## Usage

```bash
# Start thinking visible
/think

# Think about something specific
/think Should I use microservices or monolith?

# Thinking with different levels
/think --level high How to design this system?
```

## Thinking Levels

| Level | Visible | Use Case |
|-------|---------|----------|
| `off` | None | Simple, fast responses |
| `low` | Key steps | Straightforward tasks |
| `medium` | Main reasoning | Normal complexity |
| `high` | Full reasoning | Complex problem-solving |

## What Thinking Shows

### High Thinking Example
```
[Thinking: Let me analyze this problem...]

Step 1: Understanding the requirements
- User wants to migrate from monolith to microservices
- Key concerns: data consistency, network latency, operational complexity
- Team size: 5 developers

Step 2: Evaluating options
Option A: Strangler Fig Pattern
- Pros: Incremental migration, lower risk
- Cons: Longer timeline
- Best for: Large, complex systems

Option B: Big Bang Rewrite
- Pros: Clean slate
- Cons: High risk, long downtime
- Best for: Small, replaceable systems

Step 3: Recommendation
Based on team size and system complexity, I recommend:
1. Start with Strangler Fig
2. Identify bounded contexts
3. Migrate incrementally
4. Monitor and adjust
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

## Thinking in Coding Tasks

When coding, thinking shows:

1. **Analysis** - Understanding the task
2. **Planning** - How to approach
3. **Implementation** - Why each choice
4. **Review** - Validation steps

```
[Thinking: Building the auth system...]

Analysis:
- Need JWT tokens
- Refresh token rotation
- Secure httpOnly cookies

Plan:
1. Create auth service
2. Implement JWT generation
3. Add middleware
4. Write tests

Implementation choices:
- Using PBKDF2 for password hashing (not MD5/SHA1)
- 15min access token, 7 day refresh
- CSRF protection via SameSite cookie

...
```

## Customizing Thinking

```bash
# Set default thinking level
/openclaw config set thinking.default high

# Thinking for specific tasks only
/openclaw think --level medium "Quick question"
```

## Thinking vs Non-Thinking

| Aspect | Thinking | Non-Thinking |
|--------|----------|--------------|
| Response time | Slower | Faster |
| Reasoning visible | ✅ | ❌ |
| Better for complex | ✅ | ❌ |
| Simple tasks | Overhead | Ideal |
| Token usage | Higher | Lower |

## Learning Tool

Thinking is also great for learning:

```
/think Explain how React's useEffect cleanup works
/think How does database indexing improve performance?
/think Walk me through the observer pattern
```

The visible reasoning helps understand not just *what* but *why*.
