export function isEnvTruthy(name: string): boolean {
  const val = process.env[name];
  return val === "1" || val === "true" || val === "yes";
}
