---
name: cost
description: View token usage and cost statistics for the current session or across all sessions.
---

# Cost Command

Track and view usage costs.

## View Current Session Cost

```bash
/cost
bash command:"openclaw cost"
bash command:"openclaw cost --current"
```

## View Cost History

```bash
bash command:"openclaw cost --today"
bash command:"openclaw cost --week"
bash command:"openclaw cost --month"
bash command:"openclaw cost --all"
```

## Cost Breakdown

```bash
bash command:"openclaw cost --breakdown"
bash command:"openclaw cost --by-model"
bash command:"openclaw cost --by-session"
```

## Output Format

```
Session Cost Summary
├── Input tokens:  45,231 ($0.018)
├── Output tokens: 12,456 ($0.062)
└── Total:         57,687 ($0.080)

Model: claude-3-5-sonnet-20241022
Rate: $1.5/1M input, $7.5/1M output
```

## Cost Alerts

Set spending limits:
```bash
bash command:"openclaw cost --alert 10"    # Alert at $10
bash command:"openclaw cost --limit 50"    # Stop at $50
```

## Export Costs

```bash
bash command:"openclaw cost --export csv"
bash command:"openclaw cost --export json"
```

## Optimization Tips

- Use smaller models for simple tasks
- Compact sessions to reduce context
- Use `/clear` to start fresh instead of new sessions
- Check `/cost` regularly to track usage
