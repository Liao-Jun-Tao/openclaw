import semverPkg from "semver";

export function gt(a: string, b: string): boolean {
  return semverPkg.gt(a, b, { loose: true });
}

export function gte(a: string, b: string): boolean {
  return semverPkg.gte(a, b, { loose: true });
}

export function satisfies(version: string, range: string): boolean {
  return semverPkg.satisfies(version, range, { loose: true });
}
