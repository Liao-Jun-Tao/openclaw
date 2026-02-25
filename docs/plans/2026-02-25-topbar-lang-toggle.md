# Topbar Language Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a persistent language switcher button in the topbar (next to the theme toggle) so users can switch languages from any page, and fix redundant language label text in zh-CN.ts / en.ts.

**Architecture:** Add `renderLangToggle(state)` to `app-render.helpers.ts` using a `<details>/<summary>` dropdown (no new deps, no new state). Wire it into `app-render.ts` topbar. Add CSS to `layout.css`. Fix translation text in locale files.

**Tech Stack:** Lit (html template literals), TypeScript, CSS custom properties (existing design tokens)

---

### Task 1: Fix translation text in locale files

**Files:**

- Modify: `ui/src/i18n/locales/zh-CN.ts:115-120`
- Modify: `ui/src/i18n/locales/en.ts:116-121`

**Step 1: Edit zh-CN.ts — fix redundant language labels**

In `ui/src/i18n/locales/zh-CN.ts`, change the `languages` block from:

```typescript
  languages: {
    en: "English",
    zhCN: "简体中文 (简体中文)",
    zhTW: "繁體中文 (繁体中文)",
    ptBR: "Português (巴西葡萄牙语)",
  },
```

To:

```typescript
  languages: {
    en: "English",
    zhCN: "简体中文",
    zhTW: "繁體中文",
    ptBR: "Português (巴西葡萄牙语)",
  },
```

**Step 2: Edit en.ts — simplify language labels to native script**

In `ui/src/i18n/locales/en.ts`, change the `languages` block from:

```typescript
  languages: {
    en: "English",
    zhCN: "简体中文 (Simplified Chinese)",
    zhTW: "繁體中文 (Traditional Chinese)",
    ptBR: "Português (Brazilian Portuguese)",
  },
```

To:

```typescript
  languages: {
    en: "English",
    zhCN: "简体中文",
    zhTW: "繁體中文",
    ptBR: "Português",
  },
```

**Step 3: Verify tests pass**

Run: `cd ui && pnpm test`
Expected: All existing i18n tests pass (no snapshot failures).

**Step 4: Commit**

```bash
scripts/committer "i18n: simplify language label text in en and zh-CN locales" \
  ui/src/i18n/locales/en.ts \
  ui/src/i18n/locales/zh-CN.ts
```

---

### Task 2: Add `renderLangToggle` to app-render.helpers.ts

**Files:**

- Modify: `ui/src/ui/app-render.helpers.ts`

**Step 1: Add the import for `i18n` and `Locale` type at the top of the file**

The file already imports `t` from `../i18n/index.ts`. Check if `i18n` (the manager instance) and `isSupportedLocale`/`Locale` are exported from `ui/src/i18n/index.ts`. If so, add them to the existing import line:

```typescript
import { i18n, t, type Locale } from "../i18n/index.ts";
```

If `i18n` is not exported from `index.ts`, check `ui/src/i18n/lib/translate.ts` — import from there directly. Look at the existing import in `ui/src/ui/views/overview.ts` to see the exact pattern used.

**Step 2: Add the locale short-label map and `renderLangToggle` function**

Append the following to the end of `ui/src/ui/app-render.helpers.ts`, before the last closing line:

```typescript
/* ── Language short labels for topbar ─────────────────── */
const LOCALE_SHORT: Record<string, string> = {
  en: "EN",
  "zh-CN": "中文",
  "zh-TW": "繁中",
  "pt-BR": "PT",
};

const LOCALE_OPTIONS: Array<{ value: Locale; labelKey: string }> = [
  { value: "en", labelKey: "languages.en" },
  { value: "zh-CN", labelKey: "languages.zhCN" },
  { value: "zh-TW", labelKey: "languages.zhTW" },
  { value: "pt-BR", labelKey: "languages.ptBR" },
];

export function renderLangToggle(state: AppViewState) {
  const currentLocale = i18n.getLocale();
  const shortLabel = LOCALE_SHORT[currentLocale] ?? currentLocale.toUpperCase();

  const setLocale = (locale: Locale, detailsEl: HTMLDetailsElement) => {
    void i18n.setLocale(locale);
    state.applySettings({ ...state.settings, locale });
    detailsEl.open = false;
  };

  return html`
    <details class="lang-toggle">
      <summary class="lang-toggle__button" aria-label="Language">
        <svg
          class="lang-toggle__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
          <path d="M2 12h20"></path>
        </svg>
        <span class="lang-toggle__label">${shortLabel}</span>
      </summary>
      <ul class="lang-toggle__menu" role="listbox" aria-label="Language">
        ${LOCALE_OPTIONS.map(
          ({ value, labelKey }) => html`
            <li
              role="option"
              aria-selected=${currentLocale === value}
              class="lang-toggle__option ${currentLocale === value
                ? "lang-toggle__option--active"
                : ""}"
              @click=${(e: MouseEvent) => {
                const details = (e.currentTarget as HTMLElement).closest(
                  "details",
                ) as HTMLDetailsElement;
                setLocale(value, details);
              }}
            >
              ${t(labelKey)}
            </li>
          `,
        )}
      </ul>
    </details>
  `;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd ui && pnpm build` (or `pnpm tsgo` if faster)
Expected: No TypeScript errors. If `i18n` or `Locale` import path is wrong, fix the import to match whatever `overview.ts` uses.

**Step 4: Commit**

```bash
scripts/committer "feat(ui): add renderLangToggle helper for topbar" \
  ui/src/ui/app-render.helpers.ts
```

---

### Task 3: Wire renderLangToggle into the topbar in app-render.ts

**Files:**

- Modify: `ui/src/ui/app-render.ts`

**Step 1: Add `renderLangToggle` to the import from helpers**

Find the line in `app-render.ts` that imports from `./app-render.helpers.ts`. It currently imports `renderThemeToggle` (and others). Add `renderLangToggle` to that same import:

```typescript
import {
  renderChatControls,
  renderLangToggle,
  renderTab,
  renderThemeToggle,
} from "./app-render.helpers.ts";
```

**Step 2: Insert `renderLangToggle` in the topbar-status div**

Find line ~255 in `app-render.ts`:

```typescript
          ${renderThemeToggle(state)}
```

Insert `renderLangToggle` just before it:

```typescript
          ${renderLangToggle(state)}
          ${renderThemeToggle(state)}
```

**Step 3: Verify TypeScript compiles**

Run: `cd ui && pnpm build`
Expected: No errors.

**Step 4: Commit**

```bash
scripts/committer "feat(ui): wire language toggle into topbar" \
  ui/src/ui/app-render.ts
```

---

### Task 4: Add CSS for the language toggle

**Files:**

- Modify: `ui/src/styles/layout.css`

**Step 1: Add CSS block after the `.topbar-status .theme-toggle` block (around line 182)**

Find this existing block in `layout.css`:

```css
.topbar-status .theme-toggle {
  --theme-item: 24px;
  --theme-gap: 2px;
  --theme-pad: 3px;
}
```

Add the following CSS block immediately after it:

```css
/* Language toggle */
.lang-toggle {
  position: relative;
}

.lang-toggle__button {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  list-style: none;
  transition:
    background var(--duration-fast) ease,
    border-color var(--duration-fast) ease;
  user-select: none;
}

.lang-toggle__button::-webkit-details-marker {
  display: none;
}

.lang-toggle__button:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}

.lang-toggle__icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  opacity: 0.7;
}

.lang-toggle__label {
  line-height: 1;
}

.lang-toggle__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 50;
  min-width: 140px;
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg);
  box-shadow: var(--shadow-md);
}

.lang-toggle__option {
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 400;
  color: var(--text);
  cursor: pointer;
  transition: background var(--duration-fast) ease;
}

.lang-toggle__option:hover {
  background: var(--bg-hover);
}

.lang-toggle__option--active {
  font-weight: 600;
  color: var(--accent);
}
```

**Step 2: Verify no lint errors**

Run: `cd ui && pnpm check`
Expected: No lint errors.

**Step 3: Visually verify in browser**

Run: `cd ui && pnpm dev`
Open the UI in browser, check:

- Globe icon + short locale label appears in topbar to the left of the theme toggle
- Clicking it opens the dropdown with 4 language options
- Current language is highlighted in accent color
- Selecting a language closes the dropdown and immediately switches the UI language
- Clicking away (outside the `<details>`) also closes the dropdown (native behavior)

**Step 4: Commit**

```bash
scripts/committer "feat(ui): add lang-toggle CSS to layout" \
  ui/src/styles/layout.css
```

---

### Task 5: Final check — run full test suite and build

**Step 1: Run tests**

```bash
cd ui && pnpm test
```

Expected: All tests pass.

**Step 2: Run build**

```bash
cd ui && pnpm build
```

Expected: Build succeeds with no errors or warnings.

**Step 3: Run lint**

```bash
cd ui && pnpm check
```

Expected: No lint or format errors. If format errors, run `pnpm format:fix` then re-check.

---

## Key Notes

- **`<details>` close behavior:** The dropdown closes automatically when clicking outside because that's native browser behavior for `<details>`. No click-outside handler needed.
- **Locale state reactivity:** `renderLangToggle` reads `i18n.getLocale()` on each render. Because `app.ts` has an `I18nController` that calls `requestUpdate()` on locale change, the topbar will re-render and the short label will update automatically after switching.
- **`applySettings` is on `AppViewState`:** the `state` param passed to helpers already has this method. Same pattern as `renderThemeToggle`.
- **Import path for `i18n` manager:** look at `ui/src/ui/views/overview.ts` — it uses `import { i18n, isSupportedLocale } from "../../i18n/index.ts"`. Use the same relative path adjusted for `app-render.helpers.ts` location: `"../i18n/index.ts"`.
