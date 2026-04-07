---
name: model
description: Switch between different AI models. View available models and change the active model for conversations.
---

# Model Command

Switch or view AI model configuration.

## List Available Models

```bash
bash command:"openclaw models list"
# or
bash command:"openclaw config get models"
```

## Show Current Model

```bash
bash command:"openclaw status"
```

## Change Model

```bash
bash command:"openclaw model set anthropic/claude-sonnet-4"
bash command:"openclaw model set openai/gpt-5"
bash command:"openclaw model set google/gemini-pro"
```

## Model Options

Common model families:
- `anthropic` - Claude models (claude-3-5-sonnet, claude-3-opus, etc.)
- `openai` - GPT models (gpt-5, gpt-4-turbo)
- `google` - Gemini models
- `mistral` - Mistral models
- `moonshot` - Moonshot/Kimi models

## Model Selection Tips

- **Fast responses**: Use Sonnet or GPT-4o mini
- **Complex reasoning**: Use Opus or GPT-5
- **Cost optimization**: Use smaller models for simple tasks
- **Long context**: Some models support 100k+ token context

## Configuration

Models can be set:
- Per-conversation (temporary)
- Per-project (in `.openclaw.json`)
- Globally (in config)
