/**
 * Streaming tool executor with concurrency control.
 * Ported from Claude Code services/tools/StreamingToolExecutor.ts.
 *
 * Concurrency rules (fail-closed, matching Claude Code):
 *  - Concurrent-safe tools can run in parallel with each other.
 *  - Non-concurrent tools run exclusively (no other tools executing).
 *  - Results are emitted in the order tools were received.
 */

import type { BuiltTool, ToolMetadata } from "./build-tool.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolStatus = "queued" | "executing" | "completed" | "error";

export interface ToolExecution {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  status: ToolStatus;
  isConcurrencySafe: boolean;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  result?: unknown;
  error?: string;
  activityDescription?: string | null;
}

export interface ExecutorStats {
  total: number;
  queued: number;
  executing: number;
  completed: number;
  errored: number;
  totalDurationMs: number;
}

export type ToolProgressCallback = (execution: ToolExecution) => void;

// ---------------------------------------------------------------------------
// StreamingToolExecutor
// ---------------------------------------------------------------------------

export class StreamingToolExecutor {
  private executions: ToolExecution[] = [];
  private toolRegistry = new Map<string, BuiltTool>();
  private onProgress?: ToolProgressCallback;
  private aborted = false;

  constructor(tools: BuiltTool[], options?: { onProgress?: ToolProgressCallback }) {
    for (const tool of tools) {
      this.toolRegistry.set(tool.name, tool);
    }
    this.onProgress = options?.onProgress;
  }

  /**
   * Queue a tool for execution and start processing immediately.
   */
  async addTool(
    id: string,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<ToolExecution> {
    const tool = this.toolRegistry.get(toolName);
    const isConcurrencySafe = tool?.metadata.isConcurrencySafe ?? false;
    const activityDescription = tool?.getActivityDescription?.(input) ?? null;

    const execution: ToolExecution = {
      id,
      toolName,
      input,
      status: "queued",
      isConcurrencySafe,
      activityDescription,
    };

    this.executions.push(execution);
    await this.processQueue();
    return execution;
  }

  abort(): void {
    this.aborted = true;
  }

  getStats(): ExecutorStats {
    const total = this.executions.length;
    const queued = this.executions.filter((e) => e.status === "queued").length;
    const executing = this.executions.filter((e) => e.status === "executing").length;
    const completed = this.executions.filter((e) => e.status === "completed").length;
    const errored = this.executions.filter((e) => e.status === "error").length;
    const totalDurationMs = this.executions.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);
    return { total, queued, executing, completed, errored, totalDurationMs };
  }

  getExecutions(): readonly ToolExecution[] {
    return this.executions;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private canExecute(isConcurrencySafe: boolean): boolean {
    const executing = this.executions.filter((e) => e.status === "executing");
    return (
      executing.length === 0 || (isConcurrencySafe && executing.every((e) => e.isConcurrencySafe))
    );
  }

  private async processQueue(): Promise<void> {
    for (const execution of this.executions) {
      if (execution.status !== "queued") {
        continue;
      }
      if (this.aborted) {
        break;
      }

      if (this.canExecute(execution.isConcurrencySafe)) {
        await this.executeTool(execution);
      } else if (!execution.isConcurrencySafe) {
        // Non-concurrent tool blocks the queue until executing tools finish
        break;
      }
    }
  }

  private async executeTool(execution: ToolExecution): Promise<void> {
    const tool = this.toolRegistry.get(execution.toolName);
    if (!tool) {
      execution.status = "error";
      execution.error = `Unknown tool: ${execution.toolName}`;
      this.onProgress?.(execution);
      return;
    }

    if (!tool.metadata.isEnabled) {
      execution.status = "error";
      execution.error = `Tool ${execution.toolName} is disabled`;
      this.onProgress?.(execution);
      return;
    }

    execution.status = "executing";
    execution.startedAt = Date.now();
    this.onProgress?.(execution);

    try {
      const result = await tool.execute(execution.id, execution.input);

      // Truncate to maxResultSizeChars
      const maxChars = tool.metadata.maxResultSizeChars;
      if (result.content?.[0]?.text && result.content[0].text.length > maxChars) {
        result.content[0].text =
          result.content[0].text.slice(0, maxChars) +
          `\n\n[Output truncated at ${maxChars.toLocaleString()} chars]`;
      }

      execution.status = "completed";
      execution.result = result;
    } catch (err) {
      execution.status = "error";
      execution.error = err instanceof Error ? err.message : String(err);
    }

    execution.completedAt = Date.now();
    execution.durationMs = execution.completedAt - (execution.startedAt ?? execution.completedAt);
    this.onProgress?.(execution);

    // After completion, try to start next queued tools
    await this.processQueue();
  }
}
