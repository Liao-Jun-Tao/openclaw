import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import type { AppViewState } from "../app-view-state.ts";
import type { ProviderEntry } from "../controllers/models.ts";

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
          if (v !== "__custom__") {
            onChange(v);
          }
        }}
      >
        <option value="">— select —</option>
        ${catalog.map((m) => html`<option value=${m} ?selected=${m === value}>${m}</option>`)}
        <option value="__custom__" ?selected=${isCustom}>${t("models.primary.custom")}</option>
      </select>
      ${
        isCustom || selectValue === "__custom__"
          ? html`
            <input
              class="form-input models-custom-input"
              type="text"
              placeholder="provider/model-id"
              .value=${value}
              @input=${(e: Event) => onChange((e.target as HTMLInputElement).value)}
            />
          `
          : nothing
      }
      ${
        showClear && value
          ? html`
            <button class="btn btn--ghost btn--sm" @click=${onClear}>
              ${t("models.imageModel.clear")}
            </button>
          `
          : nothing
      }
      ${
        value && !catalog.includes(value) && value !== ""
          ? html`<span class="pill pill--warn models-not-in-catalog"
            >${t("models.primary.notInCatalog")}</span
          >`
          : nothing
      }
    </div>
  `;
}

function renderPrimaryCard(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) {
    return nothing;
  }

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
        ${
          !draft.primary
            ? html`<p class="form-error">${t("models.errors.primaryRequired")}</p>`
            : nothing
        }
      </div>
    </div>
  `;
}

function renderFallbacksCard(state: AppViewState) {
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

  const addFallback = (v: string) => {
    if (v) {
      state.handleModelsDraftUpdate("fallbacks", [...fallbacks, v]);
    }
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
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${t("models.fallbacks.title")}</h3>
        <p class="card-sub">${t("models.fallbacks.hint")}</p>
      </div>
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
                      >
                        ×
                      </button>
                    </li>
                  `,
                )}
              </ol>
            `
        }
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
          ${provider.baseUrl} ·
          ${t("models.providers.modelCount").replace("{n}", String(provider.models.length))}
        </span>
        ${
          probeStatus === "ok"
            ? html`<span class="pill pill--success">${t("models.providers.testOk")}</span>`
            : probeStatus === "failed"
              ? html`<span class="pill pill--danger">${t("models.providers.testFailed")}</span>`
              : nothing
        }
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
  if (!draft) {
    return nothing;
  }

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

function renderImageModelCard(state: AppViewState) {
  const draft = state.modelsDraft;
  if (!draft) {
    return nothing;
  }

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

function renderActionBar(state: AppViewState) {
  const canSave = state.modelsDirty && !state.modelsSaving && !!state.modelsDraft?.primary;

  return html`
    <div class="models-action-bar">
      ${
        state.modelsDirty
          ? html`<span class="models-unsaved-badge">• ${t("models.actions.unsaved")}</span>`
          : nothing
      }
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
    <div class="stack">
      ${renderPrimaryCard(state)} ${renderFallbacksCard(state)} ${renderProvidersCard(state)}
      ${renderImageModelCard(state)} ${renderActionBar(state)}
    </div>
  `;
}
