import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { t } from "../../i18n/index.ts";
import type { ModelTestState } from "../controllers/models.ts";
import { getProviderKeyUrl, isOAuthProvider } from "../controllers/models.ts";

/**
 * Modal overlay shown when a user selects a model.
 * Handles three states:
 *  1. needsKey — show API key input form
 *  2. testing  — show spinner
 *  3. ok/failed — show result with actions
 */
@customElement("model-test-modal")
export class ModelTestModal extends LitElement {
  @property({ type: Object }) testState: ModelTestState | null = null;

  @state() private keyInput = "";

  createRenderRoot() {
    return this;
  }

  private _dismiss() {
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true }));
  }

  private _confirm() {
    if (!this.testState) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("confirm", { detail: this.testState.modelId, bubbles: true }),
    );
  }

  private _submitKey() {
    if (!this.testState || !this.keyInput.trim()) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("save-key", {
        detail: {
          provider: this.testState.provider,
          apiKey: this.keyInput.trim(),
          modelId: this.testState.modelId,
        },
        bubbles: true,
      }),
    );
  }

  private _retry() {
    if (!this.testState) {
      return;
    }
    this.dispatchEvent(new CustomEvent("retry", { detail: this.testState.modelId, bubbles: true }));
  }

  render() {
    if (!this.testState) {
      return nothing;
    }

    return html`
      <div class="mtest-overlay" @click=${() => this._dismiss()}>
        <div class="mtest-dialog" @click=${(e: MouseEvent) => e.stopPropagation()}>
          ${this._renderContent()}
        </div>
      </div>
    `;
  }

  private _renderContent() {
    const ts = this.testState!;

    if (ts.needsKey) {
      return this._renderKeyForm(ts);
    }
    if (ts.status === "testing") {
      return this._renderTesting(ts);
    }
    if (ts.status === "ok") {
      return this._renderSuccess(ts);
    }
    if (ts.status === "failed") {
      return this._renderFailed(ts);
    }
    return nothing;
  }

  private _renderKeyForm(ts: ModelTestState) {
    const keyUrl = getProviderKeyUrl(ts.provider);
    const isOAuth = isOAuthProvider(ts.provider);

    return html`
      <div class="mtest-header">
        <h3 class="mtest-title">${t("models.test.configureProvider").replace("{provider}", ts.provider)}</h3>
        <p class="mtest-sub">${ts.modelId}</p>
      </div>
      <div class="mtest-body">
        ${
          isOAuth
            ? html`
              <p class="mtest-oauth-hint">
                ${t("models.test.oauthHint").replace("{provider}", ts.provider)}
              </p>
              <code class="mtest-cli-cmd">openclaw models auth setup-token --provider ${ts.provider}</code>
            `
            : html`
              <label class="mtest-label">${t("models.test.apiKeyLabel")}</label>
              <input
                class="mtest-input"
                type="password"
                placeholder=${t("models.test.apiKeyPlaceholder").replace("{provider}", ts.provider.toUpperCase())}
                .value=${this.keyInput}
                @input=${(e: Event) => {
                  this.keyInput = (e.target as HTMLInputElement).value;
                }}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    this._submitKey();
                  }
                }}
              />
              ${
                keyUrl
                  ? html`<a class="mtest-key-link" href=${keyUrl} target="_blank" rel="noopener">${t("models.test.getApiKey")} →</a>`
                  : nothing
              }
            `
        }
      </div>
      <div class="mtest-footer">
        <button class="btn btn--ghost btn--sm" @click=${() => this._dismiss()}>
          ${t("models.test.cancel")}
        </button>
        ${
          !isOAuth
            ? html`
              <button
                class="btn btn--primary btn--sm"
                ?disabled=${!this.keyInput.trim()}
                @click=${() => this._submitKey()}
              >
                ${t("models.test.testAndSave")}
              </button>
            `
            : nothing
        }
      </div>
    `;
  }

  private _renderTesting(ts: ModelTestState) {
    return html`
      <div class="mtest-header">
        <h3 class="mtest-title">${t("models.test.testingTitle")}</h3>
        <p class="mtest-sub">${ts.modelId}</p>
      </div>
      <div class="mtest-body mtest-body--center">
        <div class="mtest-spinner"></div>
        <p class="mtest-status-text">${t("models.test.testingHint")}</p>
      </div>
    `;
  }

  private _renderSuccess(ts: ModelTestState) {
    return html`
      <div class="mtest-header">
        <h3 class="mtest-title mtest-title--ok">${t("models.test.successTitle")}</h3>
        <p class="mtest-sub">${ts.modelId}</p>
      </div>
      <div class="mtest-body mtest-body--center">
        <span class="mtest-icon mtest-icon--ok">&#10003;</span>
        <p class="mtest-status-text">${t("models.test.successHint")}</p>
      </div>
      <div class="mtest-footer">
        <button class="btn btn--ghost btn--sm" @click=${() => this._dismiss()}>
          ${t("models.test.cancel")}
        </button>
        <button class="btn btn--primary btn--sm" @click=${() => this._confirm()}>
          ${t("models.test.useModel")}
        </button>
      </div>
    `;
  }

  private _renderFailed(ts: ModelTestState) {
    return html`
      <div class="mtest-header">
        <h3 class="mtest-title mtest-title--err">${t("models.test.failedTitle")}</h3>
        <p class="mtest-sub">${ts.modelId}</p>
      </div>
      <div class="mtest-body mtest-body--center">
        <span class="mtest-icon mtest-icon--err">&#10007;</span>
        <p class="mtest-error-text">${ts.error}</p>
      </div>
      <div class="mtest-footer">
        <button class="btn btn--ghost btn--sm" @click=${() => this._dismiss()}>
          ${t("models.test.cancel")}
        </button>
        <button class="btn btn--secondary btn--sm" @click=${() => this._retry()}>
          ${t("models.test.retry")}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "model-test-modal": ModelTestModal;
  }
}
