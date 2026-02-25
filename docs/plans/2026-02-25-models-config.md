# Models Configuration UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Models" tab to the Settings group in the OpenClaw Web UI that lets users visually select primary/fallback AI models, manage custom providers, and probe provider connectivity — saving via the existing `config.apply` RPC.

**Architecture:** New controller (`controllers/models.ts`) holds state + RPC logic; new view (`views/models.ts`) renders 4 cards (primary model, fallback chain, custom providers, image model). Tab registration follows the exact same pattern as all existing tabs. Saves by mutating `configForm` via `updateConfigFormValue` then calling the existing `applyConfig` function from `controllers/config.ts`.

**Tech Stack:** Lit (html template literals), TypeScript, existing RPC client (`state.client.request`), existing config form utilities (`updateConfigFormValue`, `cloneConfigObject`, `serializeConfigForm`), CSS design tokens (no new npm deps).

---

## Reference Files (read before starting)

| What                                  | Path                                            |
| ------------------------------------- | ----------------------------------------------- |
| Tab union + TAB_GROUPS                | `ui/src/ui/navigation.ts`                       |
| AppViewState type                     | `ui/src/ui/app-view-state.ts`                   |
| Master render + tab routing           | `ui/src/ui/app-render.ts`                       |
| Config controller (pattern to follow) | `ui/src/ui/controllers/config.ts`               |
| Config form helpers                   | `ui/src/ui/controllers/config/form-utils.ts`    |
| Cron controller (models.list usage)   | `ui/src/ui/controllers/cron.ts` lines 166-190   |
| i18n English locale                   | `ui/src/i18n/locales/en.ts`                     |
| i18n Chinese locale                   | `ui/src/i18n/locales/zh-CN.ts`                  |
| CSS design tokens                     | `ui/src/styles/tokens.css`                      |
| Component CSS patterns                | `ui/src/styles/components.css`                  |
| Design doc                            | `docs/plans/2026-02-25-models-config-design.md` |

## Build & Lint Commands

```bash
# Type-check only (fast, no emit):
pnpm tsgo

# Full build (type-check + bundle):
pnpm build

# Lint + format check:
pnpm check

# Format fix:
pnpm format:fix

# Run tests (UI subset only — avoids OOM on low-memory machines):
pnpm vitest run ui/src
```

---

## Task 1: Register the "models" tab in navigation

**Files:**

- Modify: `ui/src/ui/navigation.ts`

### Step 1: Add `"models"` to the Tab union type

Open `ui/src/ui/navigation.ts`. The `Tab` type is at line 14. Add `"models"` to it:

```typescript
export type Tab =
  | "agents"
  | "overview"
  | "channels"
  | "instances"
  | "sessions"
  | "usage"
  | "cron"
  | "skills"
  | "nodes"
  | "chat"
  | "config"
  | "debug"
  | "logs"
  | "models"; // ← add this line
```

### Step 2: Add path to TAB_PATHS

In the same file, `TAB_PATHS` is at line 29. Add:

```typescript
models: "/models",
```

### Step 3: Add to TAB_GROUPS settings array

Change line 11 from:

```typescript
{ label: "settings", tabs: ["config", "debug", "logs"] },
```

to:

```typescript
{ label: "settings", tabs: ["config", "debug", "logs", "models"] },
```

### Step 4: Add icon mapping

In `iconForTab` switch (line 126), add a case before `default`:

```typescript
case "models":
  return "cpu";   // use "cpu" icon — it exists in icons.ts
```

(If "cpu" is not in the `IconName` union, use `"settings"` as a fallback — verify by searching `icons.ts` for available names.)

### Step 5: Type-check

```bash
cd /Volumes/taotao/02_Projects/OpenSource/openclaw
pnpm tsgo
```

Expected: no errors related to `Tab` (there will be errors about missing `tabs.models` and `subtitles.models` i18n keys — that's fine, fix in Task 2).

### Step 6: Commit

```bash
git add ui/src/ui/navigation.ts
git commit -m "UI/models: register models tab in navigation"
```

---

## Task 2: Add i18n keys for the models tab

**Files:**

- Modify: `ui/src/i18n/locales/en.ts`
- Modify: `ui/src/i18n/locales/zh-CN.ts`

### Step 1: Add to `en.ts`

The file is at `ui/src/i18n/locales/en.ts`. The `TranslationMap` type is imported from `../lib/types.ts` — you must add keys there too if the type is strict. First check if `TranslationMap` has a `models` namespace — if the type uses `Record<string, unknown>` or is loose, just add the keys. If it's a strict interface, you'll need to update it (see sub-step below).

Add to `tabs` object:

```typescript
models: "Models",
```

Add to `subtitles` object:

```typescript
models: "Configure AI models, providers, and fallback chains.",
```

Add a new top-level `models` namespace at the end of the export (before closing `}`):

```typescript
models: {
  title: "Models",
  subtitle: "Configure AI models, providers, and fallback chains.",
  primary: {
    title: "Primary Model",
    hint: "The default model used for all sessions.",
    notInCatalog: "not in catalog",
    custom: "Custom…",
  },
  fallbacks: {
    title: "Fallback Chain",
    hint: "Tried in order if the primary model is unavailable.",
    empty: "No fallbacks configured. The gateway will error if primary is unavailable.",
    add: "Add fallback",
  },
  imageModel: {
    title: "Image Model",
    hint: "Optional. Used for image generation tasks.",
    clear: "Clear",
  },
  providers: {
    title: "Custom Providers",
    hint: "Register additional OpenAI-compatible, Anthropic-compatible, or Gemini-compatible endpoints.",
    add: "Add Provider",
    remove: "Remove",
    test: "Test",
    testOk: "OK",
    testFailed: "Failed",
    modelCount: "{n} models",
  },
  form: {
    name: "Name",
    baseUrl: "Base URL",
    protocol: "Protocol",
    apiKey: "API Key",
    models: "Models (one per line)",
  },
  actions: {
    apply: "Apply & Restart",
    discard: "Discard Changes",
    unsaved: "Unsaved changes",
  },
  errors: {
    primaryRequired: "Primary model is required.",
    duplicateName: "Provider name already in use.",
    loadFailed: "Failed to load configuration.",
    saveFailed: "Failed to apply configuration.",
  },
},
```

### Step 2: Update TranslationMap type if strict

Check `ui/src/i18n/lib/types.ts`. If `TranslationMap` lists each key explicitly, add `models` there too, mirroring the structure above (use `string` for leaf values). If it's `Record<string, unknown>`, skip this sub-step.

### Step 3: Add to `zh-CN.ts`

Same structure as en.ts but in Chinese. Add to `tabs`:

```typescript
models: "模型",
```

Add to `subtitles`:

```typescript
models: "配置 AI 模型、提供商及备用链。",
```

Add `models` namespace:

```typescript
models: {
  title: "模型",
  subtitle: "配置 AI 模型、提供商及备用链。",
  primary: {
    title: "主模型",
    hint: "所有会话使用的默认模型。",
    notInCatalog: "不在目录中",
    custom: "自定义…",
  },
  fallbacks: {
    title: "备用链",
    hint: "主模型不可用时按顺序尝试。",
    empty: "未配置备用模型。主模型不可用时网关将报错。",
    add: "添加备用模型",
  },
  imageModel: {
    title: "图像模型",
    hint: "可选。用于图像生成任务。",
    clear: "清除",
  },
  providers: {
    title: "自定义提供商",
    hint: "注册额外的 OpenAI 兼容、Anthropic 兼容或 Gemini 兼容端点。",
    add: "添加提供商",
    remove: "删除",
    test: "测试",
    testOk: "正常",
    testFailed: "失败",
    modelCount: "{n} 个模型",
  },
  form: {
    name: "名称",
    baseUrl: "基础 URL",
    protocol: "协议",
    apiKey: "API 密钥",
    models: "模型（每行一个）",
  },
  actions: {
    apply: "应用并重启",
    discard: "放弃更改",
    unsaved: "有未保存的更改",
  },
  errors: {
    primaryRequired: "主模型不能为空。",
    duplicateName: "提供商名称已被使用。",
    loadFailed: "加载配置失败。",
    saveFailed: "应用配置失败。",
  },
},
```

### Step 4: Type-check

```bash
pnpm tsgo
```

Expected: the i18n-related type errors from Task 1 are now gone. No new errors.

### Step 5: Commit

```bash
git add ui/src/i18n/locales/en.ts ui/src/i18n/locales/zh-CN.ts ui/src/i18n/lib/types.ts
git commit -m "UI/models: add i18n keys for models tab (en + zh-CN)"
```

---

## Task 3: Create the models controller

**Files:**

- Create: `ui/src/ui/controllers/models.ts`

This file follows the exact same pattern as `controllers/config.ts` and `controllers/cron.ts`.

### Step 1: Write the full controller file

```typescript
// ui/src/ui/controllers/models.ts
//
// Models tab controller — loads model catalog + current config,
// maintains a local draft, and saves via config.apply.

import type { GatewayBrowserClient } from "../gateway.ts";
import { cloneConfigObject, serializeConfigForm, setPathValue } from "./config/form-utils.ts";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProviderEntry {
  name: string;
  baseUrl: string;
  protocol: "openai" | "anthropic" | "gemini";
  apiKey: string;
  models: string[];
}

export interface ModelsDraft {
  primary: string;
  fallbacks: string[];
  imageModel: string;
  providers: ProviderEntry[];
}

export type ModelsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  modelsLoading: boolean;
  modelsCatalog: string[];
  modelsDraft: ModelsDraft | null;
  modelsConfigHash: string | null;
  modelsDirty: boolean;
  modelsSaving: boolean;
  modelsError: string | null;
  providerProbeStatus: Record<string, "idle" | "testing" | "ok" | "failed">;
  providerProbeError: Record<string, string>;
};

// ── Default state values (add these to app.ts initialState) ──────────────────

export const MODELS_INITIAL_STATE: ModelsState = {
  client: null,
  connected: false,
  modelsLoading: false,
  modelsCatalog: [],
  modelsDraft: null,
  modelsConfigHash: null,
  modelsDirty: false,
  modelsSaving: false,
  modelsError: null,
  providerProbeStatus: {},
  providerProbeError: {},
};

// ── Load ─────────────────────────────────────────────────────────────────────

export async function loadModels(state: ModelsState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.modelsLoading) {
    return;
  }
  state.modelsLoading = true;
  state.modelsError = null;
  try {
    const [configRes, modelsRes] = await Promise.all([
      state.client.request<{ config?: Record<string, unknown>; hash?: string }>("config.get", {}),
      state.client.request<{ models?: unknown[] }>("models.list", {}),
    ]);

    // Build catalog from models.list response
    const rawModels = Array.isArray(modelsRes?.models) ? modelsRes.models : [];
    state.modelsCatalog = rawModels
      .map((entry) => {
        if (!entry || typeof entry !== "object") return "";
        const id = (entry as { id?: unknown }).id;
        return typeof id === "string" ? id.trim() : "";
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    // Extract current values from config
    state.modelsConfigHash = typeof configRes?.hash === "string" ? configRes.hash : null;

    const config = configRes?.config ?? {};
    const agentsDefaults = getNestedObj(config, ["agents", "defaults", "model"]);
    const providersRaw = getNestedObj(config, ["models", "providers"]);

    state.modelsDraft = {
      primary: getString(agentsDefaults, "primary"),
      fallbacks: getStringArray(agentsDefaults, "fallbacks"),
      imageModel: getString(agentsDefaults, "image"),
      providers: parseProviders(providersRaw),
    };
    state.modelsDirty = false;
    state.providerProbeStatus = {};
    state.providerProbeError = {};
  } catch (err) {
    state.modelsError = String(err);
  } finally {
    state.modelsLoading = false;
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveModels(
  state: ModelsState & {
    applySessionKey: string;
    configSnapshot: { hash?: string } | null;
  },
) {
  if (!state.client || !state.connected) {
    return;
  }
  if (!state.modelsDraft) {
    return;
  }
  state.modelsSaving = true;
  state.modelsError = null;
  try {
    const baseHash = state.modelsConfigHash ?? state.configSnapshot?.hash;
    if (!baseHash) {
      state.modelsError = "Config hash missing; reload and retry.";
      return;
    }

    // Build updated config object from current snapshot + draft mutations
    const configRes = await state.client.request<{
      config?: Record<string, unknown>;
      hash?: string;
    }>("config.get", {});
    const config = cloneConfigObject(configRes?.config ?? {});

    // Apply draft values using path helpers
    const draft = state.modelsDraft;
    setPathValue(config, ["agents", "defaults", "model", "primary"], draft.primary);
    setPathValue(config, ["agents", "defaults", "model", "fallbacks"], draft.fallbacks);
    if (draft.imageModel) {
      setPathValue(config, ["agents", "defaults", "model", "image"], draft.imageModel);
    }

    // Convert providers array to Record<name, config> format
    if (draft.providers.length > 0) {
      const providersRecord: Record<string, unknown> = {};
      for (const p of draft.providers) {
        providersRecord[p.name] = {
          baseUrl: p.baseUrl,
          protocol: p.protocol,
          ...(p.apiKey ? { apiKey: p.apiKey } : {}),
          models: p.models,
        };
      }
      setPathValue(config, ["models", "providers"], providersRecord);
    }

    const raw = serializeConfigForm(config);
    await state.client.request("config.apply", {
      raw,
      baseHash: configRes?.hash ?? baseHash,
      sessionKey: state.applySessionKey,
    });
    state.modelsDirty = false;
    // Reload to pick up new hash
    await loadModels(state);
  } catch (err) {
    state.modelsError = String(err);
  } finally {
    state.modelsSaving = false;
  }
}

// ── Probe provider connectivity ───────────────────────────────────────────────

export async function probeProvider(state: ModelsState, providerName: string) {
  if (!state.client || !state.connected) {
    return;
  }
  state.providerProbeStatus = { ...state.providerProbeStatus, [providerName]: "testing" };
  state.providerProbeError = { ...state.providerProbeError, [providerName]: "" };
  try {
    const res = await state.client.request<{ models?: unknown[] }>("models.list", {});
    const rawModels = Array.isArray(res?.models) ? res.models : [];
    const hasProvider = rawModels.some((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const id = (entry as { id?: unknown }).id;
      return typeof id === "string" && id.startsWith(`${providerName}/`);
    });
    state.providerProbeStatus = {
      ...state.providerProbeStatus,
      [providerName]: hasProvider ? "ok" : "failed",
    };
    if (!hasProvider) {
      state.providerProbeError = {
        ...state.providerProbeError,
        [providerName]: "No models found for this provider in the catalog.",
      };
    }
  } catch (err) {
    state.providerProbeStatus = {
      ...state.providerProbeStatus,
      [providerName]: "failed",
    };
    state.providerProbeError = {
      ...state.providerProbeError,
      [providerName]: String(err),
    };
  }
}

// ── Draft mutation helpers ────────────────────────────────────────────────────

export function updateModelsDraftField<K extends keyof ModelsDraft>(
  state: ModelsState,
  key: K,
  value: ModelsDraft[K],
) {
  if (!state.modelsDraft) return;
  state.modelsDraft = { ...state.modelsDraft, [key]: value };
  state.modelsDirty = true;
}

export function discardModelsDraft(state: ModelsState) {
  // Re-load from gateway to reset draft
  void loadModels(state);
}

// ── Private parse helpers ─────────────────────────────────────────────────────

function getNestedObj(obj: Record<string, unknown>, path: string[]): Record<string, unknown> {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return {};
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current && typeof current === "object" && !Array.isArray(current)
    ? (current as Record<string, unknown>)
    : {};
}

function getString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : "";
}

function getStringArray(obj: Record<string, unknown>, key: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function parseProviders(raw: Record<string, unknown>): ProviderEntry[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).map(([name, value]) => {
    const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    return {
      name,
      baseUrl: getString(v, "baseUrl"),
      protocol: (getString(v, "protocol") || "openai") as ProviderEntry["protocol"],
      apiKey: getString(v, "apiKey"),
      models: getStringArray(v, "models"),
    };
  });
}
```

### Step 2: Type-check

```bash
pnpm tsgo
```

Expected: no errors in the new file.

### Step 3: Commit

```bash
git add ui/src/ui/controllers/models.ts
git commit -m "UI/models: add models controller (load, save, probe)"
```

---

## Task 4: Add ModelsState fields to AppViewState

**Files:**

- Modify: `ui/src/ui/app-view-state.ts`
- Modify: `ui/src/ui/app.ts` (initial state + handlers)

### Step 1: Import ModelsState type in app-view-state.ts

At the top of `ui/src/ui/app-view-state.ts`, add:

```typescript
import type { ModelsDraft, ModelsState } from "./controllers/models.ts";
```

### Step 2: Add fields to AppViewState type

Find the section near `debugLoading` (around line 239) — add the models fields after the logs section (near line 260), before `updateAvailable`:

```typescript
modelsLoading: boolean;
modelsCatalog: string[];
modelsDraft: ModelsDraft | null;
modelsConfigHash: string | null;
modelsDirty: boolean;
modelsSaving: boolean;
modelsError: string | null;
providerProbeStatus: Record<string, "idle" | "testing" | "ok" | "failed">;
providerProbeError: Record<string, string>;
```

Also add the handler methods at the bottom of the type (after the last `handle*` method, before the closing `}`):

```typescript
handleModelsLoad: () => Promise<void>;
handleModelsDraftUpdate: <K extends keyof ModelsDraft>(key: K, value: ModelsDraft[K]) => void;
handleModelsDiscard: () => void;
handleModelsSave: () => Promise<void>;
handleModelsProbe: (providerName: string) => Promise<void>;
```

### Step 3: Add initial state values in app.ts

Open `ui/src/ui/app.ts`. Find the `initialState` / `createState` object (it's a large object literal that initializes all state fields). Add the models fields:

```typescript
modelsLoading: false,
modelsCatalog: [],
modelsDraft: null,
modelsConfigHash: null,
modelsDirty: false,
modelsSaving: false,
modelsError: null,
providerProbeStatus: {},
providerProbeError: {},
```

### Step 4: Add handler implementations in app.ts

In `app.ts`, find the section where `handle*` methods are implemented (they call into controllers and call `this.requestUpdate()`). Add:

```typescript
handleModelsLoad: async () => {
  await loadModels(state);
  this.requestUpdate();
},
handleModelsDraftUpdate: (key, value) => {
  updateModelsDraftField(state, key, value);
  this.requestUpdate();
},
handleModelsDiscard: () => {
  discardModelsDraft(state);
  this.requestUpdate();
},
handleModelsSave: async () => {
  await saveModels(state);
  this.requestUpdate();
},
handleModelsProbe: async (providerName: string) => {
  await probeProvider(state, providerName);
  this.requestUpdate();
},
```

Add the corresponding imports at the top of `app.ts`:

```typescript
import {
  loadModels,
  updateModelsDraftField,
  discardModelsDraft,
  saveModels,
  probeProvider,
} from "./controllers/models.ts";
```

### Step 5: Wire tab load trigger

Find where other tabs trigger their load (e.g. search for `loadChannels` or `loadDebug` in `app.ts` — it's typically in a `setTab` handler or a `connectedCallback`/`updated` lifecycle). Add similar logic for `models`:

```typescript
if (tab === "models" && state.connected) {
  void loadModels(state).then(() => this.requestUpdate());
}
```

Also add to the `connected` state change handler (so if the user is already on the models tab when the gateway connects, it auto-loads):

```typescript
if (state.tab === "models") {
  void loadModels(state).then(() => this.requestUpdate());
}
```

### Step 6: Type-check

```bash
pnpm tsgo
```

Expected: no errors. All `ModelsState` fields now satisfy `AppViewState`.

### Step 7: Commit

```bash
git add ui/src/ui/app-view-state.ts ui/src/ui/app.ts
git commit -m "UI/models: wire ModelsState into AppViewState and app.ts"
```

---

## Task 5: Create the models view

**Files:**

- Create: `ui/src/ui/views/models.ts`

This file renders the 4 cards. It receives `AppViewState` (passed as `state` — follow the pattern of other views like `ui/src/ui/views/channels.ts` or `ui/src/ui/views/config.ts`).

### Step 1: Create the view file

```typescript
// ui/src/ui/views/models.ts
//
// Models tab view — 4 cards: primary model, fallback chain,
// custom providers, image model.

import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import type { ProviderEntry } from "../controllers/models.ts";
import type { AppViewState } from "../app-view-state.ts";

// ── Model selector helper (reused in cards 1, 2, 4) ─────────────────────────

function renderModelSelect(opts: {
  value: string;
  catalog: string[];
  onChange: (v: string) => void;
  id?: string;
  showClear?: boolean;
  onClear?: () => void;
}) {
  const { value, catalog, onChange, id, showClear, onClear } = opts;
  const isCustom = value !== "" && !catalog.includes(value);
  const selectValue = isCustom ? "__custom__" : value;

  return html`
    <div class="models-selector">
      <select
        id=${id ?? nothing}
        class="form-input"
        .value=${selectValue}
        @change=${(e: Event) => {
          const v = (e.target as HTMLSelectElement).value;
          if (v !== "__custom__") onChange(v);
        }}
      >
        <option value="">— select —</option>
        ${catalog.map((m) => html`<option value=${m} ?selected=${m === value}>${m}</option>`)}
        <option value="__custom__" ?selected=${isCustom}>${t("models.primary.custom")}</option>
      </select>
      ${isCustom || selectValue === "__custom__"
        ? html`
            <input
              class="form-input models-custom-input"
              type="text"
              placeholder="provider/model-id"
              .value=${value}
              @input=${(e: Event) => onChange((e.target as HTMLInputElement).value)}
            />
          `
        : nothing}
      ${showClear && value
        ? html`
            <button class="btn btn--ghost btn--sm" @click=${onClear}>
              ${t("models.imageModel.clear")}
            </button>
          `
        : nothing}
      ${value && !catalog.includes(value) && value !== ""
        ? html`<span class="pill pill--warn models-not-in-catalog"
            >${t("models.primary.notInCatalog")}</span
          >`
        : nothing}
    </div>
  `;
}

// ── Card 1: Primary Model ────────────────────────────────────────────────────

function renderPrimaryCard(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) return nothing;

  return html`
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${t("models.primary.title")}</h3>
        <p class="card-sub">${t("models.primary.hint")}</p>
      </div>
      <div class="card-body">
        ${renderModelSelect({
          value: draft.primary,
          catalog: state.modelsCatalog,
          onChange: (v) => state.handleModelsDraftUpdate("primary", v),
        })}
        ${!draft.primary
          ? html`<p class="form-error">${t("models.errors.primaryRequired")}</p>`
          : nothing}
      </div>
    </div>
  `;
}

// ── Card 2: Fallback Chain ───────────────────────────────────────────────────

function renderFallbacksCard(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) return nothing;

  const fallbacks = draft.fallbacks;

  const removeAt = (idx: number) => {
    state.handleModelsDraftUpdate(
      "fallbacks",
      fallbacks.filter((_, i) => i !== idx),
    );
  };

  const addFallback = (v: string) => {
    if (v) state.handleModelsDraftUpdate("fallbacks", [...fallbacks, v]);
  };

  // Drag-and-drop reorder
  const onDragStart = (e: DragEvent, idx: number) => {
    e.dataTransfer?.setData("text/plain", String(idx));
  };
  const onDrop = (e: DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = Number(e.dataTransfer?.getData("text/plain") ?? -1);
    if (fromIdx === targetIdx || fromIdx < 0) return;
    const next = [...fallbacks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(targetIdx, 0, moved);
    state.handleModelsDraftUpdate("fallbacks", next);
  };

  return html`
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${t("models.fallbacks.title")}</h3>
        <p class="card-sub">${t("models.fallbacks.hint")}</p>
      </div>
      <div class="card-body">
        ${fallbacks.length === 0
          ? html`<p class="text-muted">${t("models.fallbacks.empty")}</p>`
          : html`
              <ol class="models-fallback-list">
                ${fallbacks.map(
                  (m, idx) => html`
                    <li
                      class="models-fallback-item"
                      draggable="true"
                      @dragstart=${(e: DragEvent) => onDragStart(e, idx)}
                      @dragover=${(e: DragEvent) => e.preventDefault()}
                      @drop=${(e: DragEvent) => onDrop(e, idx)}
                    >
                      <span class="models-drag-handle">⠿</span>
                      <span class="models-fallback-model">${m}</span>
                      <button
                        class="btn btn--ghost btn--sm models-remove-btn"
                        aria-label="Remove"
                        @click=${() => removeAt(idx)}
                      >
                        ×
                      </button>
                    </li>
                  `,
                )}
              </ol>
            `}
        <div class="models-add-row">
          <label class="form-label">${t("models.fallbacks.add")}</label>
          ${renderModelSelect({
            value: "",
            catalog: state.modelsCatalog,
            onChange: addFallback,
          })}
        </div>
      </div>
    </div>
  `;
}

// ── Card 3: Custom Providers ─────────────────────────────────────────────────

function renderProviderCard(state: AppViewState, provider: ProviderEntry, idx: number) {
  const probeStatus = state.providerProbeStatus[provider.name] ?? "idle";
  const probeError = state.providerProbeError[provider.name] ?? "";
  const draft = state.modelsDraft!;

  const updateProvider = (patch: Partial<ProviderEntry>) => {
    const next = draft.providers.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    state.handleModelsDraftUpdate("providers", next);
  };

  const removeProvider = () => {
    state.handleModelsDraftUpdate(
      "providers",
      draft.providers.filter((_, i) => i !== idx),
    );
  };

  return html`
    <details class="models-provider-card">
      <summary class="models-provider-summary">
        <span class="models-provider-name">${provider.name || "(unnamed)"}</span>
        <span class="models-provider-meta text-muted">
          ${provider.baseUrl} · ${provider.models.length}
          ${t("models.providers.modelCount").replace("{n}", String(provider.models.length))}
        </span>
        ${probeStatus === "ok"
          ? html`<span class="pill pill--success">✓ ${t("models.providers.testOk")}</span>`
          : probeStatus === "failed"
            ? html`<span class="pill pill--danger">✗ ${t("models.providers.testFailed")}</span>`
            : nothing}
      </summary>
      <div class="models-provider-form">
        <div class="form-row">
          <label class="form-label">${t("models.form.name")}</label>
          <input
            class="form-input"
            type="text"
            .value=${provider.name}
            @input=${(e: Event) => updateProvider({ name: (e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="form-row">
          <label class="form-label">${t("models.form.baseUrl")}</label>
          <input
            class="form-input"
            type="url"
            .value=${provider.baseUrl}
            @input=${(e: Event) =>
              updateProvider({ baseUrl: (e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="form-row">
          <label class="form-label">${t("models.form.protocol")}</label>
          <select
            class="form-input"
            .value=${provider.protocol}
            @change=${(e: Event) =>
              updateProvider({
                protocol: (e.target as HTMLSelectElement).value as ProviderEntry["protocol"],
              })}
          >
            <option value="openai" ?selected=${provider.protocol === "openai"}>openai</option>
            <option value="anthropic" ?selected=${provider.protocol === "anthropic"}>
              anthropic
            </option>
            <option value="gemini" ?selected=${provider.protocol === "gemini"}>gemini</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">${t("models.form.apiKey")}</label>
          <input
            class="form-input"
            type="password"
            .value=${provider.apiKey}
            @input=${(e: Event) => updateProvider({ apiKey: (e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="form-row">
          <label class="form-label">${t("models.form.models")}</label>
          <textarea
            class="form-input models-models-textarea"
            .value=${provider.models.join("\n")}
            @input=${(e: Event) => {
              const lines = (e.target as HTMLTextAreaElement).value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              updateProvider({ models: lines });
            }}
          ></textarea>
        </div>
        <div class="models-provider-actions">
          <button
            class="btn btn--secondary btn--sm"
            ?disabled=${probeStatus === "testing"}
            @click=${() => state.handleModelsProbe(provider.name)}
          >
            ${probeStatus === "testing" ? "…" : t("models.providers.test")}
          </button>
          ${probeError ? html`<span class="text-danger text-sm">${probeError}</span>` : nothing}
          <button class="btn btn--danger btn--sm" @click=${removeProvider}>
            ${t("models.providers.remove")}
          </button>
        </div>
      </div>
    </details>
  `;
}

function renderProvidersCard(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) return nothing;

  const addProvider = () => {
    state.handleModelsDraftUpdate("providers", [
      ...draft.providers,
      { name: "", baseUrl: "", protocol: "openai", apiKey: "", models: [] },
    ]);
  };

  return html`
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${t("models.providers.title")}</h3>
        <p class="card-sub">${t("models.providers.hint")}</p>
      </div>
      <div class="card-body">
        <div class="models-providers-list">
          ${draft.providers.map((p, i) => renderProviderCard(state, p, i))}
        </div>
        <button class="btn btn--secondary btn--sm" @click=${addProvider}>
          + ${t("models.providers.add")}
        </button>
      </div>
    </div>
  `;
}

// ── Card 4: Image Model ──────────────────────────────────────────────────────

function renderImageModelCard(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) return nothing;

  return html`
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${t("models.imageModel.title")}</h3>
        <p class="card-sub">${t("models.imageModel.hint")}</p>
      </div>
      <div class="card-body">
        ${renderModelSelect({
          value: draft.imageModel,
          catalog: state.modelsCatalog,
          onChange: (v) => state.handleModelsDraftUpdate("imageModel", v),
          showClear: true,
          onClear: () => state.handleModelsDraftUpdate("imageModel", ""),
        })}
      </div>
    </div>
  `;
}

// ── Action bar ───────────────────────────────────────────────────────────────

function renderActionBar(state: AppViewState) {
  const canSave = state.modelsDirty && !state.modelsSaving && !!state.modelsDraft?.primary;

  return html`
    <div class="models-action-bar">
      ${state.modelsDirty
        ? html`<span class="models-unsaved-badge">• ${t("models.actions.unsaved")}</span>`
        : nothing}
      <button
        class="btn btn--ghost"
        ?disabled=${!state.modelsDirty || state.modelsSaving}
        @click=${() => state.handleModelsDiscard()}
      >
        ${t("models.actions.discard")}
      </button>
      <button
        class="btn btn--primary"
        ?disabled=${!canSave}
        @click=${() => void state.handleModelsSave()}
      >
        ${state.modelsSaving ? "…" : t("models.actions.apply")}
      </button>
    </div>
  `;
}

// ── Main render export ───────────────────────────────────────────────────────

export function renderModels(state: AppViewState) {
  if (state.modelsLoading && !state.modelsDraft) {
    return html`<div class="content-loading">Loading…</div>`;
  }

  if (state.modelsError && !state.modelsDraft) {
    return html`
      <div class="alert alert--error">
        ${state.modelsError}
        <button class="btn btn--sm" @click=${() => void state.handleModelsLoad()}>Retry</button>
      </div>
    `;
  }

  return html`
    <div class="stack">
      ${renderPrimaryCard(state)} ${renderFallbacksCard(state)} ${renderProvidersCard(state)}
      ${renderImageModelCard(state)} ${renderActionBar(state)}
    </div>
  `;
}
```

### Step 2: Type-check

```bash
pnpm tsgo
```

Expected: no errors in the new view file.

### Step 3: Commit

```bash
git add ui/src/ui/views/models.ts
git commit -m "UI/models: add models view (4 cards + action bar)"
```

---

## Task 6: Register models tab in app-render.ts

**Files:**

- Modify: `ui/src/ui/app-render.ts`

### Step 1: Import the view

At the top of `ui/src/ui/app-render.ts`, add:

```typescript
import { renderModels } from "./views/models.ts";
```

### Step 2: Add conditional render in the content area

Find the section in `renderApp` (or similar function) where other tabs render:

```typescript
${state.tab === "config" ? renderConfig({...}) : nothing}
${state.tab === "debug" ? renderDebug({...}) : nothing}
${state.tab === "logs" ? renderLogs({...}) : nothing}
```

Add after the logs line:

```typescript
${state.tab === "models" ? renderModels(state) : nothing}
```

### Step 3: Add content header for models tab

Find where the page title/subtitle is rendered (look for `page-title` CSS class or `subtitleForTab`). The existing pattern typically renders title + subtitle for all tabs. Since `titleForTab("models")` and `subtitleForTab("models")` now return values from i18n, this should work automatically if the pattern is generic. Verify by checking how other tabs' headers are rendered — if it's a `switch` or explicit list, add `"models"` to it.

### Step 4: Type-check + lint

```bash
pnpm tsgo && pnpm check
```

Expected: no errors.

### Step 5: Commit

```bash
git add ui/src/ui/app-render.ts
git commit -m "UI/models: wire models tab into app-render"
```

---

## Task 7: Add CSS for models components

**Files:**

- Modify: `ui/src/styles/components.css` (or create `ui/src/styles/models.css` and import it)

Check whether `components.css` is imported in the main CSS entry point. If a new file is cleaner, create `models.css` and import it from `ui/src/styles/index.css` (or wherever the main imports are).

### Step 1: Add models CSS

```css
/* ===========================================
   Models Tab
   =========================================== */

/* Selector row: select + optional custom input */
.models-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.models-custom-input {
  flex: 1;
  min-width: 200px;
}

.models-not-in-catalog {
  font-size: 11px;
}

/* Fallback list */
.models-fallback-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: grid;
  gap: 4px;
}

.models-fallback-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: grab;
}

.models-fallback-item:active {
  cursor: grabbing;
}

.models-drag-handle {
  color: var(--muted);
  font-size: 14px;
  flex-shrink: 0;
}

.models-fallback-model {
  flex: 1;
  font-size: 13px;
  font-family: var(--font-mono, monospace);
}

.models-remove-btn {
  flex-shrink: 0;
  color: var(--muted);
}

.models-remove-btn:hover {
  color: var(--danger, red);
}

.models-add-row {
  display: grid;
  gap: 6px;
}

/* Provider cards */
.models-providers-list {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.models-provider-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.models-provider-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  list-style: none;
  background: var(--bg-subtle);
  user-select: none;
}

.models-provider-summary::-webkit-details-marker {
  display: none;
}

.models-provider-summary:hover {
  background: var(--bg-hover);
}

.models-provider-name {
  font-weight: 600;
  font-size: 13px;
}

.models-provider-meta {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.models-provider-form {
  padding: 14px;
  display: grid;
  gap: 12px;
  border-top: 1px solid var(--border);
}

.models-models-textarea {
  min-height: 80px;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  resize: vertical;
}

.models-provider-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

/* Action bar */
.models-action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

.models-unsaved-badge {
  color: var(--accent);
  font-size: 13px;
  font-weight: 500;
  margin-right: auto;
}
```

### Step 2: Import if using a separate file

If you created `ui/src/styles/models.css`, add to the main CSS entry point:

```css
@import "./models.css";
```

### Step 3: Check build

```bash
pnpm build
```

Expected: builds cleanly. Open `http://localhost:5173/models` (after starting Vite) and verify the tab renders.

### Step 4: Commit

```bash
git add ui/src/styles/
git commit -m "UI/models: add CSS for models tab components"
```

---

## Task 8: Manual smoke test

Start the dev environment:

```bash
bash scripts/start-dev.sh
```

Then open `http://localhost:5173`.

**Test checklist:**

1. [ ] "Models" appears in the Settings sidebar group
2. [ ] Clicking Models navigates to the tab (URL changes to `/models`)
3. [ ] While disconnected: tab shows loading state gracefully (no crash)
4. [ ] Connect to gateway (Overview tab → set wsUrl + token → Connect)
5. [ ] Switch to Models tab: catalog loads from `models.list`
6. [ ] Primary model dropdown shows catalog entries
7. [ ] Selecting a model marks draft as dirty (unsaved badge appears)
8. [ ] "Add fallback" adds a row; × removes it; drag-and-drop reorders
9. [ ] "Add Provider" adds a blank provider form
10. [ ] "Test" button on a provider sends `models.list` (check network tab)
11. [ ] "Apply & Restart" sends `config.apply` and reloads (check network tab)
12. [ ] "Discard Changes" reloads and clears dirty state
13. [ ] i18n: switch to 中文 in topbar — Models tab labels switch to Chinese

### Step 5: Final commit

```bash
git add -u
git commit -m "UI/models: complete models configuration tab"
```

---

## Troubleshooting

| Problem                                              | Fix                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| TypeScript error: `"models"` not assignable to `Tab` | Make sure you added `\| "models"` to the Tab union in `navigation.ts`           |
| `t("tabs.models")` returns key literally             | Check `en.ts` has `tabs.models` and the i18n type allows it                     |
| `handleModels*` missing from state                   | You forgot to add to `AppViewState` type or `app.ts` initialState               |
| Models tab doesn't load on navigate                  | Check `setTab` handler in `app.ts` for the load trigger                         |
| `config.apply` fails with "hash missing"             | `loadModels` re-fetches config before apply; check `configRes?.hash` path       |
| CSS classes not applied                              | Verify `models.css` is imported in the main CSS entry                           |
| Drag-and-drop not working                            | `draggable="true"` and `@dragover=${e => e.preventDefault()}` are both required |
