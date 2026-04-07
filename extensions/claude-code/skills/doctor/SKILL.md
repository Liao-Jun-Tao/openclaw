---
name: doctor
description: Run system diagnostics to check OpenClaw health. Identifies configuration issues, missing dependencies, and setup problems.
---

# Doctor Command

Run diagnostic checks on your OpenClaw installation.

## Usage

```bash
/openclaw doctor
bash command:"openclaw doctor"
bash command:"openclaw doctor --verbose"
bash command:"openclaw doctor --fix"
```

## What Doctor Checks

### Configuration
- Config file validity
- Required settings present
- API keys configured

### Environment
- Node.js version
- Required environment variables
- Network connectivity

### Dependencies
- npm/node_modules installed
- Plugin dependencies resolved
- Binary tools available

### Permissions
- File read/write permissions
- Directory access rights
- Security settings

## Output Example

```
✓ Configuration: OK
  - Config file found
  - Model configured
  - Theme set

⚠ Environment: Warnings
  - NODE_ENV not set
  - Some env vars missing

✗ Dependencies: Issues found
  - Some packages not installed
  - Run: openclaw doctor --fix

✓ Permissions: OK
```

## Fix Issues

```bash
# Auto-fix common issues
openclaw doctor --fix

# Install missing dependencies
openclaw install

# Re-run after fixes
openclaw doctor
```

## Verbose Mode

```bash
# Show detailed output
openclaw doctor --verbose

# Show debug info
openclaw doctor --debug
```
