import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import type { AppViewState } from "../app-view-state.ts";
import type { ModelAction } from "../components/model-browser.ts";
import {
  apiDisplayName,
  catalogProviders,
  findCatalogEntry,
  formatContextWindow,
  isLocalProvider,
  type ModelCatalogEntry,
  type ProviderEntry,
} from "../controllers/models.ts";
import "../components/model-browser.ts";
import "../components/model-test-modal.ts";

// ── Zone 1: Active Configuration Summary ─────────────────────────────────────

function renderConfigSummary(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) {
    return nothing;
  }

  const primaryEntry = findCatalogEntry(state.modelsCatalog, draft.primary);
  const ctx = primaryEntry ? formatContextWindow(primaryEntry.contextWindow) : "";

  return html`
    <div class="card models-summary">
      <!-- Primary row -->
      <div class="models-summary-row">
        <span class="models-summary-label">${t("models.summary.primaryLabel")}</span>
        <span class="models-summary-value">
          ${
            draft.primary
              ? html`
                <span class="models-summary-model models-summary-model--primary">${draft.primary}</span>
                ${ctx ? html`<span class="models-chip models-chip--ctx">${ctx}</span>` : nothing}
                ${primaryEntry?.reasoning ? html`<span class="models-chip models-chip--reasoning">${t("models.caps.reasoning")}</span>` : nothing}
                ${primaryEntry?.input?.includes("image") ? html`<span class="models-chip models-chip--vision">${t("models.caps.vision")}</span>` : nothing}
              `
              : html`<span class="models-summary-muted">${t("models.summary.notSet")}</span>`
          }
        </span>
      </div>

      <!-- Fallbacks row -->
      <div class="models-summary-row">
        <span class="models-summary-label">${t("models.summary.fallbacksLabel")}</span>
        <span class="models-summary-value">
          ${
            draft.fallbacks.length > 0
              ? html`
                <span class="models-summary-fallbacks">
                  ${draft.fallbacks.map(
                    (fb, idx) => html`
                      ${
                        idx > 0
                          ? html`
                              <span class="models-summary-fb-arrow">→</span>
                            `
                          : nothing
                      }
                      <span class="models-summary-fb-chip">${fb.split("/").pop()}</span>
                    `,
                  )}
                </span>
              `
              : html`<span class="models-summary-muted">${t("models.fallbacks.empty")}</span>`
          }
        </span>
        <span class="models-summary-actions">
          <button
            class="btn btn--ghost btn--sm"
            @click=${() => {
              const el = document.querySelector(".models-fallback-section");
              if (el instanceof HTMLDetailsElement) {
                el.open = true;
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            }}
          >${t("models.summary.manage")}</button>
        </span>
      </div>

      <!-- Image model row -->
      <div class="models-summary-row">
        <span class="models-summary-label">${t("models.summary.imageLabel")}</span>
        <span class="models-summary-value">
          ${
            draft.imageModel
              ? html`<span class="models-summary-model">${draft.imageModel}</span>`
              : html`<span class="models-summary-muted">${t("models.summary.notSet")}</span>`
          }
        </span>
      </div>
    </div>
  `;
}

// ── Zone 2: Model Browser (delegates to <model-browser> component) ───────────

function renderBrowserSection(state: AppViewState) {
  const onModelAction = (e: CustomEvent<{ modelId: string; action: ModelAction }>) => {
    const { modelId, action } = e.detail;
    switch (action) {
      case "primary":
        void state.handleModelTest(modelId);
        break;
      case "fallback": {
        const current = state.modelsDraft?.fallbacks ?? [];
        if (!current.includes(modelId)) {
          state.handleModelsDraftUpdate("fallbacks", [...current, modelId]);
        }
        break;
      }
      case "image":
        state.handleModelsDraftUpdate("imageModel", modelId);
        break;
    }
  };

  const onModelTest = (e: CustomEvent<string>) => {
    void state.handleModelTest(e.detail);
  };

  const testingId = state.modelTestState?.status === "testing" ? state.modelTestState.modelId : "";

  return html`
    <model-browser
      .catalog=${state.modelsCatalog}
      .primaryModel=${state.modelsDraft?.primary ?? ""}
      .fallbacks=${state.modelsDraft?.fallbacks ?? []}
      .imageModel=${state.modelsDraft?.imageModel ?? ""}
      .search=${state.modelsBrowserSearch}
      .activeProvider=${state.modelsBrowserProvider}
      .probeStatus=${state.providerProbeStatus}
      .testingModelId=${testingId}
      @search-change=${(e: CustomEvent<string>) => {
        state.modelsBrowserSearch = e.detail;
      }}
      @provider-change=${(e: CustomEvent<string>) => {
        state.modelsBrowserProvider = e.detail;
      }}
      @model-action=${onModelAction}
      @model-test=${onModelTest}
      @retry=${() => void state.handleModelsLoad()}
    ></model-browser>
  `;
}

// ── Zone 2b: Fallback & Image editors (collapsible) ──────────────────────────

function renderFallbackSection(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) {
    return nothing;
  }
  const fallbacks = draft.fallbacks;

  const removeAt = (idx: number) => {
    state.handleModelsDraftUpdate(
      "fallbacks",
      fallbacks.filter((_, i) => i !== idx),
    );
  };

  const onDragStart = (e: DragEvent, idx: number) => {
    e.dataTransfer?.setData("text/plain", String(idx));
  };
  const onDrop = (e: DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = Number(e.dataTransfer?.getData("text/plain") ?? -1);
    if (fromIdx === targetIdx || fromIdx < 0) {
      return;
    }
    const next = [...fallbacks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(targetIdx, 0, moved);
    state.handleModelsDraftUpdate("fallbacks", next);
  };

  return html`
    <details class="card models-fallback-section" ?open=${fallbacks.length > 0}>
      <summary class="card-header" style="cursor:pointer; user-select:none; list-style:none;">
        <h3 class="card-title">${t("models.fallbacks.title")}</h3>
        <p class="card-sub">${t("models.fallbacks.hint")}</p>
      </summary>
      <div class="card-body">
        ${
          fallbacks.length === 0
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
                      >×</button>
                    </li>
                  `,
                )}
              </ol>
            `
        }
      </div>
    </details>
  `;
}

// ── Zone 3: Providers (collapsible) ──────────────────────────────────────────

interface ProviderSummary {
  name: string;
  isCustom: boolean;
  modelCount: number;
  providerEntry: ProviderEntry | null;
}

function buildProviderList(
  catalog: ModelCatalogEntry[],
  customProviders: ProviderEntry[],
): ProviderSummary[] {
  const builtIn = catalogProviders(catalog);
  const customNames = new Set(customProviders.map((p) => p.name));

  const result: ProviderSummary[] = [];

  for (const name of builtIn) {
    if (customNames.has(name)) {
      continue;
    }
    const count = catalog.filter((e) => e.provider === name).length;
    result.push({ name, isCustom: false, modelCount: count, providerEntry: null });
  }

  for (const p of customProviders) {
    const count = catalog.filter((e) => e.provider === p.name).length + p.models.length;
    result.push({ name: p.name, isCustom: true, modelCount: count, providerEntry: p });
  }

  return result.toSorted((a, b) => a.name.localeCompare(b.name));
}

function renderBuiltInProviderCard(state: AppViewState, summary: ProviderSummary) {
  const probeStatus = state.providerProbeStatus[summary.name] ?? "idle";
  const probeError = state.providerProbeError[summary.name] ?? "";

  const statusBadge = () => {
    switch (probeStatus) {
      case "ok":
        return html`<span class="mp-badge mp-badge--ok">${t("models.providers.testOk")}</span>`;
      case "failed":
        return html`<span class="mp-badge mp-badge--err">${t("models.providers.testFailed")}</span>`;
      case "testing":
        return html`<span class="mp-badge mp-badge--testing">${t("models.providers.testing")}</span>`;
      default:
        return nothing;
    }
  };

  return html`
    <div class="mp-card">
      <div class="mp-header">
        <span class="mp-name">${summary.name}</span>
        ${statusBadge()}
        <span class="mp-models text-muted">
          ${t("models.providers.modelCount").replace("{n}", String(summary.modelCount))}
        </span>
        <button
          class="btn btn--ghost btn--sm"
          ?disabled=${probeStatus === "testing"}
          @click=${() => state.handleModelsProbe(summary.name)}
        >${probeStatus === "testing" ? t("models.providers.testing") : t("models.providers.test")}</button>
      </div>
      ${probeError ? html`<p class="mp-error text-danger text-sm">${probeError}</p>` : nothing}
    </div>
  `;
}

function renderCustomProviderCard(
  state: AppViewState,
  provider: ProviderEntry,
  idx: number,
  summary: ProviderSummary,
) {
  const draft = state.modelsDraft!;
  const probeStatus = state.providerProbeStatus[provider.name] ?? "idle";
  const probeError = state.providerProbeError[provider.name] ?? "";

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

  const statusBadge = () => {
    switch (probeStatus) {
      case "ok":
        return html`<span class="mp-badge mp-badge--ok">${t("models.providers.testOk")}</span>`;
      case "failed":
        return html`<span class="mp-badge mp-badge--err">${t("models.providers.testFailed")}</span>`;
      case "testing":
        return html`<span class="mp-badge mp-badge--testing">${t("models.providers.testing")}</span>`;
      default:
        return nothing;
    }
  };

  return html`
    <details class="mp-card mp-card--custom" open>
      <summary class="mp-header mp-header--clickable">
        <span class="mp-name">${provider.name || "(unnamed)"}</span>
        <span class="mp-badge mp-badge--custom">${t("models.providers.customBadge")}</span>
        ${statusBadge()}
        <span class="mp-models text-muted">
          ${t("models.providers.modelCount").replace("{n}", String(summary.modelCount))}
        </span>
      </summary>
      <div class="mp-body">
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
            placeholder="https://api.example.com/v1"
            .value=${provider.baseUrl}
            @input=${(e: Event) =>
              updateProvider({ baseUrl: (e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="form-row">
          <label class="form-label">${t("models.form.api")}</label>
          <select
            class="form-input"
            .value=${provider.api}
            @change=${(e: Event) => updateProvider({ api: (e.target as HTMLSelectElement).value })}
          >
            ${[
              "openai-responses",
              "openai-completions",
              "anthropic-messages",
              "google-generative-ai",
              "bedrock-converse-stream",
              "ollama",
            ].map(
              (api) =>
                html`<option value=${api} ?selected=${provider.api === api}>${apiDisplayName(api)}</option>`,
            )}
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
            class="form-input mp-models-textarea"
            placeholder="model-id-1&#10;model-id-2"
            .value=${provider.models.map((m) => m.id).join("\n")}
            @input=${(e: Event) => {
              const lines = (e.target as HTMLTextAreaElement).value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              updateProvider({ models: lines.map((id) => ({ id })) });
            }}
          ></textarea>
        </div>
        <div class="mp-actions">
          <button
            class="btn btn--secondary btn--sm"
            ?disabled=${probeStatus === "testing" || !provider.name}
            @click=${() => state.handleModelsProbe(provider.name)}
          >${probeStatus === "testing" ? t("models.providers.testing") : t("models.providers.test")}</button>
          ${probeError ? html`<span class="text-danger text-sm">${probeError}</span>` : nothing}
          <span class="mp-actions-spacer"></span>
          <button class="btn btn--danger btn--sm" @click=${removeProvider}>
            ${t("models.providers.remove")}
          </button>
        </div>
      </div>
    </details>
  `;
}

function renderProvidersSection(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) {
    return nothing;
  }

  const providers = buildProviderList(state.modelsCatalog, draft.providers);
  const okCount = Object.values(state.providerProbeStatus).filter((s) => s === "ok").length;
  const statusText = t("models.providers.statusSummary").replace("{ok}", String(okCount));

  const addProvider = () => {
    state.handleModelsDraftUpdate("providers", [
      ...draft.providers,
      { name: "", baseUrl: "", api: "openai-responses", apiKey: "", models: [], extra: {} },
    ]);
  };

  return html`
    <details class="models-providers-details">
      <summary class="models-providers-summary">
        ${t("models.providers.title")}
        <span class="models-providers-status">${statusText}</span>
        <span class="models-providers-chevron">&#9654;</span>
      </summary>
      <div class="models-providers-body">
        <p class="card-sub" style="margin: 0 0 12px;">${t("models.providers.hint")}</p>
        <div class="mp-list">
          ${providers.map((summary) => {
            if (summary.isCustom && summary.providerEntry) {
              const idx = draft.providers.indexOf(summary.providerEntry);
              return renderCustomProviderCard(state, summary.providerEntry, idx, summary);
            }
            return renderBuiltInProviderCard(state, summary);
          })}
        </div>
        <button class="btn btn--secondary btn--sm" @click=${addProvider}>
          + ${t("models.providers.add")}
        </button>
      </div>
    </details>
  `;
}

// ── Action Bar ────────────────────────────────────────────────────────────────

function renderActionBar(state: AppViewState) {
  const canSave = state.modelsDirty && !state.modelsSaving && !!state.modelsDraft?.primary;

  return html`
    <div class="models-action-bar">
      ${
        state.modelsDirty
          ? html`<span class="models-unsaved-badge">● ${t("models.actions.unsaved")}</span>`
          : nothing
      }
      <button
        class="btn btn--ghost"
        ?disabled=${!state.modelsDirty || state.modelsSaving}
        @click=${() => state.handleModelsDiscard()}
      >${t("models.actions.discard")}</button>
      <button
        class="btn btn--primary"
        ?disabled=${!canSave}
        @click=${() => void state.handleModelsSave()}
      >${state.modelsSaving ? t("models.actions.applying") : t("models.actions.apply")}</button>
    </div>
  `;
}

// ── Error Banner ──────────────────────────────────────────────────────────────

function renderErrorBanner(state: AppViewState) {
  if (!state.modelsError) {
    return nothing;
  }
  return html`
    <div class="alert alert--error models-error-banner">
      <span>${state.modelsError}</span>
      <button
        class="btn btn--ghost btn--sm"
        @click=${() => {
          state.modelsError = null;
          void state.handleModelsLoad();
        }}
      >${t("models.errors.dismissError")}</button>
    </div>
  `;
}

// ── Test modal ────────────────────────────────────────────────────────────────

function renderTestModal(state: AppViewState) {
  const ts = state.modelTestState;
  if (!ts) {
    return nothing;
  }

  // For local providers or immediate "ok" (no modal needed), auto-apply
  if (ts.status === "ok" && isLocalProvider(ts.provider)) {
    // Apply as primary immediately, then dismiss
    state.handleModelsDraftUpdate("primary", ts.modelId);
    state.handleModelTestDismiss();
    return nothing;
  }

  // Only show modal when there is something to display
  if (ts.status === "idle" && !ts.needsKey) {
    return nothing;
  }

  const onConfirm = (e: CustomEvent<string>) => {
    state.handleModelsDraftUpdate("primary", e.detail);
    state.handleModelTestDismiss();
  };

  const onSaveKey = (e: CustomEvent<{ provider: string; apiKey: string; modelId: string }>) => {
    void state.handleModelTestSaveKey(e.detail.provider, e.detail.apiKey, e.detail.modelId);
  };

  const onRetry = (e: CustomEvent<string>) => {
    void state.handleModelTest(e.detail);
  };

  return html`
    <model-test-modal
      .testState=${ts}
      @dismiss=${() => state.handleModelTestDismiss()}
      @confirm=${onConfirm}
      @save-key=${onSaveKey}
      @retry=${onRetry}
    ></model-test-modal>
  `;
}

// ── Main Render ───────────────────────────────────────────────────────────────

export function renderModels(state: AppViewState) {
  if (state.modelsLoading && !state.modelsDraft) {
    return html`
      <div class="content-loading">Loading…</div>
    `;
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
    <div class="models-page">
      ${renderErrorBanner(state)}
      ${renderConfigSummary(state)}
      ${renderBrowserSection(state)}
      ${renderFallbackSection(state)}
      ${renderProvidersSection(state)}
      ${renderActionBar(state)}
      ${renderTestModal(state)}
    </div>
  `;
}
