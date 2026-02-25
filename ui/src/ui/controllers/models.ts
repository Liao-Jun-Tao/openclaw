import type { GatewayBrowserClient } from "../gateway.ts";
import { cloneConfigObject, serializeConfigForm, setPathValue } from "./config/form-utils.ts";

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
  applySessionKey: string;
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

    const rawModels = Array.isArray(modelsRes?.models) ? modelsRes.models : [];
    state.modelsCatalog = rawModels
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return "";
        }
        const id = (entry as { id?: unknown }).id;
        return typeof id === "string" ? id.trim() : "";
      })
      .filter(Boolean)
      .toSorted((a, b) => a.localeCompare(b));

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
    // Re-fetch current config to get latest hash
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
      if (!entry || typeof entry !== "object") {
        return false;
      }
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
    state.providerProbeStatus = { ...state.providerProbeStatus, [providerName]: "failed" };
    state.providerProbeError = { ...state.providerProbeError, [providerName]: String(err) };
  }
}

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
    return {
      name,
      baseUrl: getString(v, "baseUrl"),
      protocol: (getString(v, "protocol") || "openai") as ProviderEntry["protocol"],
      apiKey: getString(v, "apiKey"),
      models: getStringArray(v, "models"),
    };
  });
}
