import { execFile } from "node:child_process";

export function execFileNoThrow(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    execFile(cmd, args, (error, stdout, stderr) => {
      resolve({
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        exitCode: error ? ((error.code as unknown as number) ?? 1) : 0,
      });
    });
  });
}
