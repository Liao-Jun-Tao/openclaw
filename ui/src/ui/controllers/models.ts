import type { GatewayBrowserClient } from "../gateway.ts";
import { cloneConfigObject, serializeConfigForm, setPathValue } from "./config/form-utils.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ModelCatalogEntry {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  reasoning?: boolean;
  input?: string[];
}

export type ModelApi =
  | "openai-completions"
  | "openai-responses"
  | "anthropic-messages"
  | "google-generative-ai"
  | "github-copilot"
  | "bedrock-converse-stream"
  | "ollama";

const API_DISPLAY: Record<string, string> = {
  "openai-completions": "OpenAI (Completions)",
  "openai-responses": "OpenAI (Responses)",
  "anthropic-messages": "Anthropic",
  "google-generative-ai": "Google Gemini",
  "github-copilot": "GitHub Copilot",
  "bedrock-converse-stream": "AWS Bedrock",
  ollama: "Ollama",
};

export function apiDisplayName(api: string): string {
  return API_DISPLAY[api] ?? api;
}

export interface ProviderEntry {
  name: string;
  baseUrl: string;
  api: string;
  apiKey: string;
  models: Array<{ id: string; name?: string }>;
  /** Extra config fields we don't edit but must preserve on save */
  extra: Record<string, unknown>;
}

export interface ModelsDraft {
  primary: string;
  fallbacks: string[];
  imageModel: string;
  providers: ProviderEntry[];
}

export type ModelTestStatus = "idle" | "testing" | "ok" | "failed";

export interface ModelTestState {
  modelId: string;
  provider: string;
  status: ModelTestStatus;
  error: string;
  /** True when the provider has no configured API key and we need user input */
  needsKey: boolean;
}

export type ModelsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  applySessionKey: string;
  modelsLoading: boolean;
  modelsCatalog: ModelCatalogEntry[];
  modelsDraft: ModelsDraft | null;
  modelsConfigHash: string | null;
  modelsDirty: boolean;
  modelsSaving: boolean;
  modelsError: string | null;
  providerProbeStatus: Record<string, "idle" | "testing" | "ok" | "failed">;
  providerProbeError: Record<string, string>;
  /** State for the modal test-on-select flow */
  modelTestState: ModelTestState | null;
};

// ── Load ──────────────────────────────────────────────────────────────────────

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

    // Parse full catalog entries from models.list
    const rawModels = Array.isArray(modelsRes?.models) ? modelsRes.models : [];
    state.modelsCatalog = rawModels
      .map((entry): ModelCatalogEntry | null => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const e = entry as Record<string, unknown>;
        const id = typeof e.id === "string" ? e.id.trim() : "";
        if (!id) {
          return null;
        }
        const provider = typeof e.provider === "string" ? e.provider : (id.split("/")[0] ?? "");
        return {
          id,
          name: typeof e.name === "string" ? e.name : id,
          provider,
          contextWindow: typeof e.contextWindow === "number" ? e.contextWindow : undefined,
          reasoning: typeof e.reasoning === "boolean" ? e.reasoning : undefined,
          input: Array.isArray(e.input) ? (e.input as string[]) : undefined,
        };
      })
      .filter((e): e is ModelCatalogEntry => e !== null)
      .toSorted((a, b) => a.id.localeCompare(b.id));

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

export async function saveModels(state: ModelsState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (!state.modelsDraft) {
    return;
  }
  state.modelsSaving = true;
  state.modelsError = null;
  try {
    const configRes = await state.client.request<{
      config?: Record<string, unknown>;
      hash?: string;
    }>("config.get", {});
    const baseHash = configRes?.hash ?? state.modelsConfigHash;
    if (!baseHash) {
      state.modelsError = "Config hash missing; reload and retry.";
      return;
    }

    const config = cloneConfigObject(configRes?.config ?? {});
    const draft = state.modelsDraft;

    setPathValue(config, ["agents", "defaults", "model", "primary"], draft.primary);
    setPathValue(config, ["agents", "defaults", "model", "fallbacks"], draft.fallbacks);
    if (draft.imageModel) {
      setPathValue(config, ["agents", "defaults", "model", "image"], draft.imageModel);
    }

    // Write providers with correct schema fields
    if (draft.providers.length > 0) {
      const providersRecord: Record<string, unknown> = {};
      for (const p of draft.providers) {
        if (!p.name.trim()) {
          continue;
        }
        providersRecord[p.name] = {
          ...p.extra,
          baseUrl: p.baseUrl,
          api: p.api || "openai-responses",
          ...(p.apiKey ? { apiKey: p.apiKey } : {}),
          models: p.models.map((m) => ({
            id: m.id,
            ...(m.name && m.name !== m.id ? { name: m.name } : {}),
          })),
        };
      }
      setPathValue(config, ["models", "providers"], providersRecord);
    }

    const raw = serializeConfigForm(config);
    await state.client.request("config.apply", {
      raw,
      baseHash,
      sessionKey: state.applySessionKey,
    });
    state.modelsDirty = false;
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
    const providerModels = rawModels.filter((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }
      const id = (entry as { id?: unknown }).id;
      return typeof id === "string" && id.startsWith(`${providerName}/`);
    });
    state.providerProbeStatus = {
      ...state.providerProbeStatus,
      [providerName]: providerModels.length > 0 ? "ok" : "failed",
    };
    if (providerModels.length === 0) {
      state.providerProbeError = {
        ...state.providerProbeError,
        [providerName]: "No models returned for this provider.",
      };
    }
  } catch (err) {
    state.providerProbeStatus = { ...state.providerProbeStatus, [providerName]: "failed" };
    state.providerProbeError = { ...state.providerProbeError, [providerName]: String(err) };
  }
}

// ── Provider key URLs (for the API key modal) ────────────────────────────────

const PROVIDER_KEY_URLS: Record<string, string> = {
  anthropic: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  google: "https://aistudio.google.com/apikey",
  groq: "https://console.groq.com/keys",
  xai: "https://console.x.ai/team/default/api-keys",
  openrouter: "https://openrouter.ai/keys",
  mistral: "https://console.mistral.ai/api-keys",
  together: "https://api.together.xyz/settings/api-keys",
  cerebras: "https://cloud.cerebras.ai/platform",
  deepgram: "https://console.deepgram.com/",
};

export function getProviderKeyUrl(provider: string): string | undefined {
  return PROVIDER_KEY_URLS[provider];
}

/** Providers that run locally and never need an API key. */
const LOCAL_PROVIDERS = new Set(["ollama", "vllm"]);

/** Providers that require OAuth/CLI setup rather than a simple API key. */
const OAUTH_PROVIDERS = new Set(["github-copilot", "openai-codex"]);

export function isLocalProvider(provider: string): boolean {
  return LOCAL_PROVIDERS.has(provider);
}

export function isOAuthProvider(provider: string): boolean {
  return OAUTH_PROVIDERS.has(provider);
}

/**
 * Determine whether a provider appears to have credentials configured.
 * Built-in providers that appear in the catalog are assumed to have env-var keys.
 * Custom providers need a non-empty apiKey in the draft.
 */
export function providerHasCredentials(state: ModelsState, providerName: string): boolean {
  if (isLocalProvider(providerName)) {
    return true;
  }
  // Custom provider with an explicit API key in draft
  const custom = state.modelsDraft?.providers.find((p) => p.name === providerName);
  if (custom?.apiKey) {
    return true;
  }
  // Built-in provider: if gateway returned models for it, env vars must be set
  const hasModels = state.modelsCatalog.some((e) => e.provider === providerName);
  if (hasModels && !custom) {
    return true;
  }
  return false;
}

// ── Test model connectivity ──────────────────────────────────────────────────

/**
 * Run a real completion against the gateway to verify a model works.
 * Uses sessions.patch to set the model override, then chat.send to test.
 */
export async function testModel(state: ModelsState, modelId: string): Promise<boolean> {
  if (!state.client || !state.connected) {
    if (state.modelTestState) {
      state.modelTestState = {
        ...state.modelTestState,
        status: "failed",
        error: "Gateway not connected",
      };
    }
    return false;
  }

  const probeSessionKey = `probe-web-${Date.now()}`;

  try {
    // Set model override on a temporary probe session
    await state.client.request("sessions.patch", {
      key: probeSessionKey,
      model: modelId,
    });

    // Send a minimal test message
    const idempotencyKey = `probe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const result = await state.client.request<{
      runId?: string;
      status?: string;
      summary?: string;
    }>("chat.send", {
      sessionKey: probeSessionKey,
      message: "Reply with OK. Do not use tools.",
      timeoutMs: 15000,
      idempotencyKey,
    });

    const ok = result?.status !== "error";
    if (state.modelTestState) {
      state.modelTestState = {
        ...state.modelTestState,
        status: ok ? "ok" : "failed",
        error: ok ? "" : (result?.summary ?? "Model test failed"),
      };
    }

    // Clean up the probe session
    try {
      await state.client.request("sessions.delete", {
        key: probeSessionKey,
        deleteTranscript: true,
      });
    } catch {
      // cleanup is best-effort
    }

    return ok;
  } catch (err) {
    const errMsg = String(err);
    // Classify common errors
    let userMsg = errMsg;
    if (errMsg.includes("401") || errMsg.includes("auth") || errMsg.includes("Unauthorized")) {
      userMsg = "Authentication failed — check your API key.";
    } else if (errMsg.includes("429") || errMsg.includes("rate")) {
      userMsg = "Rate limited — try again in a moment.";
    } else if (errMsg.includes("timeout") || errMsg.includes("ETIMEDOUT")) {
      userMsg = "Request timed out — the model may be slow or unreachable.";
    }

    if (state.modelTestState) {
      state.modelTestState = {
        ...state.modelTestState,
        status: "failed",
        error: userMsg,
      };
    }
    return false;
  }
}

/**
 * Begin the test-on-select flow for a model.
 * Checks if credentials exist; if not, sets needsKey=true so the UI shows the key modal.
 * If credentials exist, runs the test immediately.
 */
export async function beginModelTest(state: ModelsState, modelId: string): Promise<void> {
  const provider = modelId.split("/")[0] ?? "";

  state.modelTestState = {
    modelId,
    provider,
    status: "idle",
    error: "",
    needsKey: false,
  };

  if (isLocalProvider(provider)) {
    // Local providers skip the test, just set directly
    state.modelTestState = { ...state.modelTestState, status: "ok" };
    return;
  }

  if (!providerHasCredentials(state, provider)) {
    // Need API key — UI will show the key input modal
    state.modelTestState = { ...state.modelTestState, needsKey: true };
    return;
  }

  // Credentials exist — run the test
  state.modelTestState = { ...state.modelTestState, status: "testing" };
  await testModel(state, modelId);
}

/**
 * Save an API key for a provider, then run the model test.
 * Called from the key-input modal after the user enters a key.
 */
export async function saveKeyAndTest(
  state: ModelsState,
  providerName: string,
  apiKey: string,
  modelId: string,
): Promise<void> {
  if (!state.modelsDraft || !state.client) {
    return;
  }

  // Add or update the provider in the draft
  const existing = state.modelsDraft.providers.find((p) => p.name === providerName);
  if (existing) {
    const next = state.modelsDraft.providers.map((p) =>
      p.name === providerName ? { ...p, apiKey } : p,
    );
    state.modelsDraft = { ...state.modelsDraft, providers: next };
  } else {
    state.modelsDraft = {
      ...state.modelsDraft,
      providers: [
        ...state.modelsDraft.providers,
        {
          name: providerName,
          baseUrl: "",
          api: "openai-responses",
          apiKey,
          models: [],
          extra: {},
        },
      ],
    };
  }

  // Persist the config so the gateway picks up the new key
  state.modelsDirty = true;
  await saveModels(state);

  // Now run the test
  if (state.modelTestState) {
    state.modelTestState = { ...state.modelTestState, needsKey: false, status: "testing" };
  }
  await testModel(state, modelId);
}

export function dismissModelTest(state: ModelsState) {
  state.modelTestState = null;
}

// ── Draft mutation helpers ────────────────────────────────────────────────────

export function updateModelsDraftField<K extends keyof ModelsDraft>(
  state: ModelsState,
  key: K,
  value: ModelsDraft[K],
) {
  if (!state.modelsDraft) {
    return;
  }
  state.modelsDraft = { ...state.modelsDraft, [key]: value };
  state.modelsDirty = true;
}

export function discardModelsDraft(state: ModelsState) {
  void loadModels(state);
}

// ── Derived helpers for the view ──────────────────────────────────────────────

/** Extract unique provider names from catalog, sorted. */
export function catalogProviders(catalog: ModelCatalogEntry[]): string[] {
  const set = new Set<string>();
  for (const entry of catalog) {
    if (entry.provider) {
      set.add(entry.provider);
    }
  }
  return [...set].toSorted((a, b) => a.localeCompare(b));
}

/** Get catalog IDs as a simple string array. */
export function catalogIds(catalog: ModelCatalogEntry[]): string[] {
  return catalog.map((e) => e.id);
}

/** Group catalog entries by provider, sorted within each group. */
export function groupedByProvider(catalog: ModelCatalogEntry[]): Map<string, ModelCatalogEntry[]> {
  const groups = new Map<string, ModelCatalogEntry[]>();
  for (const entry of catalog) {
    const key = entry.provider || "other";
    const list = groups.get(key);
    if (list) {
      list.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }
  return groups;
}

/** Filter catalog by search query (substring match on id/name). */
export function filterCatalog(catalog: ModelCatalogEntry[], query: string): ModelCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return catalog;
  }
  return catalog.filter((e) => e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
}

/** Format a context window number for display (e.g. 200000 -> "200K"). */
export function formatContextWindow(ctx?: number): string {
  if (!ctx) {
    return "";
  }
  if (ctx >= 1_000_000) {
    return `${(ctx / 1_000_000).toFixed(1)}M`;
  }
  return `${Math.round(ctx / 1000)}K`;
}

/** Look up a catalog entry by model id. */
export function findCatalogEntry(
  catalog: ModelCatalogEntry[],
  modelId: string,
): ModelCatalogEntry | undefined {
  return catalog.find((e) => e.id === modelId);
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
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is string => typeof x === "string");
}

function parseProviders(raw: Record<string, unknown>): ProviderEntry[] {
  if (!raw || typeof raw !== "object") {
    return [];
  }
  return Object.entries(raw).map(([name, value]) => {
    const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const api = getString(v, "api") || "openai-responses";
    const apiKey = getString(v, "apiKey");
    const baseUrl = getString(v, "baseUrl");

    // Parse models: can be array of strings or array of objects
    const rawModels = v.models;
    const models: Array<{ id: string; name?: string }> = [];
    if (Array.isArray(rawModels)) {
      for (const m of rawModels) {
        if (typeof m === "string") {
          models.push({ id: m });
        } else if (m && typeof m === "object") {
          const mo = m as Record<string, unknown>;
          const id = typeof mo.id === "string" ? mo.id : "";
          if (id) {
            models.push({
              id,
              name: typeof mo.name === "string" ? mo.name : undefined,
            });
          }
        }
      }
    }

    // Preserve extra fields we don't directly edit
    const knownKeys = new Set(["baseUrl", "api", "apiKey", "models"]);
    const extra: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      if (!knownKeys.has(k)) {
        extra[k] = val;
      }
    }

    return { name, baseUrl, api, apiKey, models, extra };
  });
}
