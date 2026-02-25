# Design: Topbar Language Toggle

**Date:** 2026-02-25
**Status:** Approved

## Goal

Make language switching discoverable and accessible from any page in the Web UI, with a focus on Chinese users. Currently the language selector is buried in the Overview tab's access settings card.

## Scope

Two parts:

1. **Topbar language toggle** — a globe icon button + dropdown in `.topbar-status`, next to the existing theme toggle.
2. **Translation text fixes** — fix redundant/mixed-script language labels in `zh-CN.ts` (and matching cleanup in `en.ts`).

## Architecture

### Topbar Language Toggle

**Location in render tree:**
`app-render.ts` → `topbar-status` div → add `${renderLangToggle(state)}` before `${renderThemeToggle(state)}`.

**Implementation:**
New `renderLangToggle(state: AppViewState)` function in `app-render.helpers.ts`, symmetric to `renderThemeToggle`.

**Interaction:**

- Displays a globe icon (SVG) + short label for current locale (`EN` / `中文` / `繁中` / `PT`)
- Uses a `<details>/<summary>` element for the dropdown — no new state, no new deps, keyboard-accessible natively
- Clicking an option calls the existing `i18n.setLocale(v)` and `state.applySettings({ ...state.settings, locale: v })`
- Closes automatically when an option is selected (via `details.open = false`)

**HTML structure:**

```html
<details class="lang-toggle">
  <summary class="lang-toggle__button" aria-label="Language">
    <!-- globe SVG icon -->
    <span class="lang-toggle__label">中文</span>
  </summary>
  <ul class="lang-toggle__menu" role="listbox">
    <li role="option" class="lang-toggle__option [--active]" @click>English</li>
    <li role="option" class="lang-toggle__option [--active]" @click>简体中文</li>
    <li role="option" class="lang-toggle__option [--active]" @click>繁體中文</li>
    <li role="option" class="lang-toggle__option [--active]" @click>Português</li>
  </ul>
</details>
```

**Short labels per locale:**
| Locale | Short label |
|--------|-------------|
| `en` | `EN` |
| `zh-CN` | `中文` |
| `zh-TW` | `繁中` |
| `pt-BR` | `PT` |

### Translation Text Fixes

File: `ui/src/i18n/locales/zh-CN.ts`, `languages` section:

| Key    | Before                | After                      |
| ------ | --------------------- | -------------------------- |
| `zhCN` | `简体中文 (简体中文)` | `简体中文`                 |
| `zhTW` | `繁體中文 (繁体中文)` | `繁體中文`                 |
| `ptBR` | unchanged             | `Português (巴西葡萄牙语)` |

File: `ui/src/i18n/locales/en.ts`, `languages` section:

| Key    | Before                           | After      |
| ------ | -------------------------------- | ---------- |
| `zhCN` | `简体中文 (Simplified Chinese)`  | `简体中文` |
| `zhTW` | `繁體中文 (Traditional Chinese)` | `繁體中文` |

> Rationale: language names should be written in their own script, without English parentheticals. The dropdown in the UI is self-explanatory.

### Overview Selector

Keep the existing `<select>` in the Overview access card unchanged — it remains useful as a settings panel entry point.

## Files to Change

| File                              | Change                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| `ui/src/ui/app-render.helpers.ts` | Add `renderLangToggle(state)` function + globe SVG              |
| `ui/src/ui/app-render.ts`         | Insert `${renderLangToggle(state)}` in topbar-status            |
| `ui/src/styles/layout.css`        | Add `.lang-toggle` CSS block (position, dropdown, active state) |
| `ui/src/i18n/locales/zh-CN.ts`    | Fix `languages.zhCN`, `languages.zhTW`                          |
| `ui/src/i18n/locales/en.ts`       | Fix `languages.zhCN`, `languages.zhTW`                          |

## Out of Scope

- No new i18n keys needed (reuses `languages.*` already in all locale files)
- No changes to `AppViewState` or `app.ts`
- No new npm dependencies
- No changes to `zh-TW.ts` or `pt-BR.ts` structure
