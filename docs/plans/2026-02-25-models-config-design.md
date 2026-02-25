# Models Configuration UI — Design

**Date:** 2026-02-25
**Status:** Approved
**Scope:** New "Models" tab in Settings group; model selection, fallback chain, and custom provider management.

---

## Overview

Add a dedicated **Models** tab to the Settings navigation group that gives users a visual interface to:

1. Select the primary AI model from the gateway's available catalog
2. Manage the ordered fallback chain
3. Configure custom providers (name, baseUrl, protocol, API key, model list)
4. Optionally set a separate image model

Configuration is saved via the existing `config.apply` RPC path (same as the Config tab), which writes the config file and auto-restarts the gateway. The Config tab is retained as the advanced JSON entry point.

---

## Architecture

### Navigation

Add `"models"` to the `Tab` union type and insert it into the `settings` TAB_GROUP in `navigation.ts`:

```
Settings group
  ├── config    ← retain (advanced JSON editor)
  ├── debug
  ├── logs
  └── models    ← new (primary visual entry point)
```

### New Files

| File                              | Purpose                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `ui/src/ui/controllers/models.ts` | State type + RPC functions (`loadModels`, `saveModels`, `probeProvider`) |
| `ui/src/ui/views/models.ts`       | Render function `renderModels(props)`                                    |

### Modified Files

| File                           | Change                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `ui/src/ui/navigation.ts`      | Add `"models"` to Tab union + TAB_GROUPS settings array |
| `ui/src/ui/app-view-state.ts`  | Add ModelsState mixin fields to AppViewState            |
| `ui/src/ui/app-render.ts`      | Add `state.tab === "models"` conditional render branch  |
| `ui/src/i18n/locales/en.ts`    | Add `models` namespace                                  |
| `ui/src/i18n/locales/zh-CN.ts` | Add `models` namespace                                  |

---

## Data Flow

### Load

```
Tab mounted / connected
  → config.get             → extract agents.defaults.model + models.providers
  → models.list            → build available model catalog (provider/model-id strings)
  → merge into ModelsState.draft (local, no auto-save)
```

### Edit

All edits mutate `state.modelsDraft` only. The draft mirrors the shape of the config
section being edited. A `state.modelsDirty` boolean tracks unsaved changes and shows
an "Unsaved changes" badge.

### Save

```
User clicks "Apply & Restart"
  → updateConfigFormValue(state, ["agents","defaults","model","primary"], draft.primary)
  → updateConfigFormValue(state, ["agents","defaults","model","fallbacks"], draft.fallbacks)
  → updateConfigFormValue(state, ["agents","defaults","model","image"], draft.imageModel)
  → updateConfigFormValue(state, ["models","providers"], providersAsRecord)
  → config.apply { raw, baseHash, sessionKey }
  → show "Gateway restarting..." toast (same pattern as Config tab)
  → reload config on success
```

### Connectivity Probe

Each custom provider card has a **Test** button:

```
User clicks "Test"
  → set providerProbeStatus[name] = "testing"
  → models.list {}            (re-fetch catalog; gateway will attempt live calls)
  → if provider's models appear in response → "ok"
  → catch error → "failed" + error message
```

---

## State Type

```typescript
// ui/src/ui/controllers/models.ts

export interface ProviderEntry {
  name: string; // provider identifier, e.g. "my-openai"
  baseUrl: string; // API endpoint URL
  protocol: "openai" | "anthropic" | "gemini";
  apiKey: string; // plaintext while editing; display masked after save
  models: string[]; // model IDs available under this provider
}

export interface ModelsDraft {
  primary: string; // "provider/model-id"
  fallbacks: string[]; // ordered list
  imageModel: string; // optional; empty string = not set
  providers: ProviderEntry[];
}

export interface ModelsState {
  client: GatewayBrowserClient | null;
  connected: boolean;
  modelsLoading: boolean;
  modelsCatalog: string[]; // from models.list
  modelsDraft: ModelsDraft | null;
  modelsConfigHash: string | null; // baseHash for optimistic locking
  modelsDirty: boolean;
  modelsSaving: boolean;
  modelsError: string | null;
  providerProbeStatus: Record<string, "idle" | "testing" | "ok" | "failed">;
  providerProbeError: Record<string, string>;
}
```

---

## UI Components (4 Cards)

### Card 1 — Primary Model

- `<select>` populated from `modelsCatalog` (sorted alphabetically)
- Option at bottom: "Custom…" → reveals a free-text `<input>` for arbitrary `provider/model-id`
- Displays current value; highlights if not in catalog (warning pill: "not in catalog")

### Card 2 — Fallback Chain

- Ordered `<ol>` list; each row = model string + × delete button
- **+ Add fallback** button at bottom → same select/input as Card 1
- HTML5 drag-and-drop for reordering (no external library needed)
- Empty state: "No fallbacks configured — gateway will error if primary is unavailable."

### Card 3 — Custom Providers

- List of provider cards (collapsed by default); each shows: `name` · `baseUrl` · `N models`
- Expand/collapse toggle per provider (CSS `<details>` pattern)
- Expanded form fields:
  - **Name** — identifier used in `provider/model-id` strings
  - **Base URL** — API endpoint
  - **Protocol** — `<select>`: openai / anthropic / gemini
  - **API Key** — `<input type="password">` (masked after save)
  - **Models** — `<textarea>` one model ID per line
  - **Test** button → probe connectivity (see Data Flow above)
  - **Remove** button → delete provider
- **+ Add Provider** button appends a blank form

### Card 4 — Image Model (Optional)

- Same `<select>` + "Custom…" text input as Card 1
- Labeled "Optional" with muted subtitle
- Clear button to unset

### Bottom Action Bar

- **Apply & Restart** — primary action (disabled when `modelsSaving` or no dirty state)
- **Discard Changes** — resets draft to last loaded state
- Unsaved badge: `• Unsaved changes` (appears when `modelsDirty === true`)

---

## Error Handling

| Scenario                | Behavior                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| `models.list` fails     | Show error banner; catalog falls back to empty; manual input still works |
| `config.get` fails      | Show error banner; Models tab shows retry button                         |
| `config.apply` fails    | Show inline error; draft preserved; user can retry                       |
| Provider Test fails     | Provider card shows red "✗ Failed" badge + error message                 |
| Duplicate provider name | Inline validation error on Name field before save                        |
| Empty primary model     | "Apply & Restart" button disabled; show "Primary model is required"      |

---

## i18n Keys (new `models` namespace)

```typescript
models: {
  title: "Models",
  subtitle: "Configure AI models, providers, and fallback chains.",
  primary: { title: "Primary Model", hint: "The default model for all sessions." },
  fallbacks: { title: "Fallback Chain", hint: "Tried in order if primary is unavailable.", empty: "No fallbacks configured.", add: "Add fallback" },
  imageModel: { title: "Image Model", hint: "Optional. Used for image generation tasks.", clear: "Clear" },
  providers: { title: "Custom Providers", hint: "Register additional OpenAI-compatible or Anthropic-compatible endpoints.", add: "Add Provider", remove: "Remove", test: "Test", testOk: "OK", testFailed: "Failed" },
  form: { name: "Name", baseUrl: "Base URL", protocol: "Protocol", apiKey: "API Key", models: "Models (one per line)" },
  actions: { apply: "Apply & Restart", discard: "Discard Changes", unsaved: "Unsaved changes" },
  errors: { primaryRequired: "Primary model is required.", duplicateName: "Provider name already in use.", loadFailed: "Failed to load config.", saveFailed: "Failed to apply config." },
  notInCatalog: "not in catalog",
  custom: "Custom…",
}
```

---

## Out of Scope

- No changes to gateway RPC surface (uses existing `config.get`, `config.apply`, `models.list`)
- No new npm dependencies
- No changes to the Config tab or its JSON editor
- No per-agent model override UI (future work)
- No model benchmarking or cost display
