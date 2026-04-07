export function getThemeName(): string {
  return process.env.OPENCLAW_THEME ?? "dark";
}
