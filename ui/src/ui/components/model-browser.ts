import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { t } from "../../i18n/index.ts";
import type { ModelCatalogEntry } from "../controllers/models.ts";
import {
  catalogProviders,
  filterCatalog,
  formatContextWindow,
  groupedByProvider,
} from "../controllers/models.ts";

export type ModelAction = "primary" | "fallback" | "image";

@customElement("model-browser")
export class ModelBrowser extends LitElement {
  @property({ type: Array }) catalog: ModelCatalogEntry[] = [];
  @property({ type: String }) primaryModel = "";
  @property({ type: Array }) fallbacks: string[] = [];
  @property({ type: String }) imageModel = "";
  @property({ type: String }) search = "";
  @property({ type: String }) activeProvider = "";
  @property({ type: Object }) probeStatus: Record<string, string> = {};
  /** Model currently being tested (shows spinner on the row) */
  @property({ type: String }) testingModelId = "";

  @state() private popoverModelId: string | null = null;

  private boundClosePopover = (e: MouseEvent) => this._closePopoverOutside(e);

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("mousedown", this.boundClosePopover, true);
  }

  disconnectedCallback() {
    document.removeEventListener("mousedown", this.boundClosePopover, true);
    super.disconnectedCallback();
  }

  private _closePopoverOutside(e: MouseEvent) {
    if (!this.popoverModelId) {
      return;
    }
    const target = e.target as Node;
    if (this.contains(target)) {
      return;
    }
    this.popoverModelId = null;
  }

  private _onSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent("search-change", { detail: val, bubbles: true }));
  }

  private _onTabClick(provider: string) {
    this.dispatchEvent(new CustomEvent("provider-change", { detail: provider, bubbles: true }));
  }

  private _onRowClick(modelId: string) {
    // Primary selection goes through the test-on-select flow
    this.dispatchEvent(new CustomEvent("model-test", { detail: modelId, bubbles: true }));
  }

  private _onMoreClick(e: MouseEvent, modelId: string) {
    e.stopPropagation();
    this.popoverModelId = this.popoverModelId === modelId ? null : modelId;
  }

  private _onAction(modelId: string, action: ModelAction) {
    this.popoverModelId = null;
    this.dispatchEvent(
      new CustomEvent("model-action", { detail: { modelId, action }, bubbles: true }),
    );
  }

  private _getProviderStatus(provider: string): string {
    return this.probeStatus[provider] ?? "idle";
  }

  private _getFiltered(): ModelCatalogEntry[] {
    let base = this.catalog;
    if (this.activeProvider) {
      base = base.filter((e) => e.provider === this.activeProvider);
    }
    return filterCatalog(base, this.search);
  }

  render() {
    const filtered = this._getFiltered();
    const providers = catalogProviders(this.catalog);

    return html`
      <div class="card models-browser">
        ${this._renderToolbar()}
        ${this._renderTabs(providers)}
        ${this._renderList(filtered)}
        ${
          filtered.length > 0
            ? html`<div class="models-browser-hint">${t("models.browser.clickHint")}</div>`
            : nothing
        }
      </div>
    `;
  }

  private _renderToolbar() {
    return html`
      <div class="models-browser-toolbar">
        <div class="models-browser-search">
          <input
            type="text"
            placeholder=${t("models.searchPlaceholder")}
            .value=${this.search}
            @input=${(e: Event) => this._onSearchInput(e)}
          />
        </div>
      </div>
    `;
  }

  private _renderTabs(providers: string[]) {
    return html`
      <div class="models-provider-tabs">
        <button
          class="models-provider-tab ${!this.activeProvider ? "models-provider-tab--active" : ""}"
          @click=${() => this._onTabClick("")}
        >
          ${t("models.browser.allProviders")}
        </button>
        ${providers.map(
          (p) => html`
            <button
              class="models-provider-tab ${this.activeProvider === p ? "models-provider-tab--active" : ""}"
              @click=${() => this._onTabClick(p)}
            >
              <span class="models-provider-dot models-provider-dot--${this._getProviderStatus(p)}"></span>
              ${p}
            </button>
          `,
        )}
      </div>
    `;
  }

  private _renderList(filtered: ModelCatalogEntry[]) {
    if (this.catalog.length === 0) {
      return html`
        <div class="models-browser-empty">
          <div class="models-browser-empty-title">${t("models.browser.emptyTitle")}</div>
          <div class="models-browser-empty-hint">${t("models.browser.emptyHint")}</div>
          <button
            class="btn btn--secondary btn--sm"
            @click=${() => this.dispatchEvent(new CustomEvent("retry", { bubbles: true }))}
          >
            ${t("models.browser.retry")}
          </button>
        </div>
      `;
    }

    if (filtered.length === 0) {
      return html`
        <div class="models-browser-empty">
          <div class="models-browser-empty-hint">${t("models.browser.noResults")}</div>
        </div>
      `;
    }

    if (this.activeProvider) {
      return html`
        <div class="models-browser-list">
          ${filtered.map((entry) => this._renderRow(entry))}
        </div>
      `;
    }

    const groups = groupedByProvider(filtered);
    const primaryProvider = this.primaryModel ? (this.primaryModel.split("/")[0] ?? "") : "";
    return html`
      <div class="models-browser-list">
        ${[...groups.entries()].map(
          ([provider, entries]) => html`
            <details class="models-group" ?open=${provider === primaryProvider}>
              <summary class="models-group-header">
                <span class="models-provider-dot models-provider-dot--${this._getProviderStatus(provider)}"></span>
                ${provider}
                <span class="models-group-count">(${entries.length})</span>
                <span class="models-group-chevron">&#9654;</span>
              </summary>
              ${entries.map((entry) => this._renderRow(entry))}
            </details>
          `,
        )}
      </div>
    `;
  }

  private _renderRow(entry: ModelCatalogEntry) {
    const isPrimary = entry.id === this.primaryModel;
    const isTesting = entry.id === this.testingModelId;
    const ctx = formatContextWindow(entry.contextWindow);
    const showPopover = this.popoverModelId === entry.id;

    return html`
      <div
        class="models-row ${isPrimary ? "models-row--active" : ""} ${isTesting ? "models-row--testing" : ""}"
        @click=${() => this._onRowClick(entry.id)}
      >
        <span class="models-row-star">${isPrimary ? "★" : ""}</span>
        <span class="models-row-id">${entry.id}</span>
        <span class="models-row-meta">
          ${ctx ? html`<span class="models-chip models-chip--ctx">${ctx}</span>` : nothing}
          ${entry.reasoning ? html`<span class="models-chip models-chip--reasoning">${t("models.caps.reasoning")}</span>` : nothing}
          ${entry.input?.includes("image") ? html`<span class="models-chip models-chip--vision">${t("models.caps.vision")}</span>` : nothing}
        </span>
        <span class="models-row-actions">
          <button
            class="models-row-more"
            @click=${(e: MouseEvent) => this._onMoreClick(e, entry.id)}
            aria-label="More actions"
          >&#8943;</button>
          ${showPopover ? this._renderPopover(entry.id) : nothing}
        </span>
      </div>
    `;
  }

  private _renderPopover(modelId: string) {
    return html`
      <div class="models-popover">
        <button
          class="models-popover-item"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            this.popoverModelId = null;
            this.dispatchEvent(new CustomEvent("model-test", { detail: modelId, bubbles: true }));
          }}
        >
          ★ ${t("models.browser.setPrimary")}
        </button>
        <button
          class="models-popover-item"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            this._onAction(modelId, "fallback");
          }}
        >
          + ${t("models.browser.addFallback")}
        </button>
        <button
          class="models-popover-item"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            this._onAction(modelId, "image");
          }}
        >
          &#128248; ${t("models.browser.setImage")}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "model-browser": ModelBrowser;
  }
}
