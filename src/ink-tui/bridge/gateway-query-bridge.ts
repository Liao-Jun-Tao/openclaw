import { randomUUID } from "node:crypto";
import {
  GatewayChatClient,
  resolveGatewayConnection,
  type GatewayEvent,
} from "../../tui/gateway-chat.js";
import type { AgentEvent, BtwEvent, ChatEvent } from "../../tui/tui-types.js";
import type {
  BridgeEvent,
  ConnectionStatus,
  Message,
  SessionInfo,
  StreamingStatus,
  ToolEvent,
} from "./types.js";

type BridgeOptions = {
  url: string;
  token?: string;
  password?: string;
};

type BridgeCallbacks = {
  onConnectionChange: (status: ConnectionStatus) => void;
  onStreamingChange: (status: StreamingStatus) => void;
  onStreamEvent: (event: BridgeEvent) => void;
  onSessionInfoChange: (info: Partial<SessionInfo>) => void;
  onBtw: (params: { question: string; text: string; isError?: boolean }) => void;
  onHistoryLoaded: (messages: Message[]) => void;
};

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter((b: Record<string, unknown>) => b.type === "text")
    .map((b: Record<string, unknown>) => b.text ?? "")
    .join("");
}

function extractThinkingFromContent(content: unknown): string {
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter((b: Record<string, unknown>) => b.type === "thinking")
    .map((b: Record<string, unknown>) => b.thinking ?? "")
    .join("");
}

/**
 * Bridge between OpenClaw's Gateway WebSocket protocol and the React TUI.
 * Wraps GatewayChatClient to translate gateway events into typed BridgeEvents.
 */
export class GatewayQueryBridge {
  private client: GatewayChatClient | null = null;
  private callbacks: BridgeCallbacks;
  private opts: BridgeOptions;
  private currentSessionKey = "";
  private activeRunId: string | null = null;

  constructor(options: BridgeOptions, callbacks: BridgeCallbacks) {
    this.opts = options;
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    this.callbacks.onConnectionChange("connecting");

    const connection = await resolveGatewayConnection({
      url: this.opts.url,
      token: this.opts.token,
      password: this.opts.password,
    });

    this.client = new GatewayChatClient(connection);

    this.client.onEvent = (evt: GatewayEvent) => {
      this.handleEvent(evt);
    };

    this.client.onConnected = () => {
      this.callbacks.onConnectionChange("connected");
    };

    this.client.onDisconnected = () => {
      this.callbacks.onConnectionChange("disconnected");
    };

    this.client.start();
    await this.client.waitForReady();
  }

  async disconnect(): Promise<void> {
    this.client?.stop();
    this.callbacks.onConnectionChange("disconnected");
  }

  setSessionKey(key: string): void {
    this.currentSessionKey = key;
  }

  async sendMessage(text: string, thinking?: string): Promise<string> {
    if (!this.client) {
      throw new Error("Not connected");
    }
    const runId = randomUUID();
    this.activeRunId = runId;
    this.callbacks.onStreamingChange("running");

    await this.client.sendChat({
      sessionKey: this.currentSessionKey,
      message: text,
      thinking,
      runId,
    });

    return runId;
  }

  async abortRun(): Promise<void> {
    if (!this.client || !this.activeRunId) {
      return;
    }
    await this.client.abortChat({
      sessionKey: this.currentSessionKey,
      runId: this.activeRunId,
    });
  }

  async loadHistory(limit = 50): Promise<void> {
    if (!this.client) {
      return;
    }
    const result = await this.client.loadHistory({
      sessionKey: this.currentSessionKey,
      limit,
    });
    const messages = this.parseHistoryResult(result);
    this.callbacks.onHistoryLoaded(messages);
  }

  async listSessions() {
    if (!this.client) {
      return { sessions: [] };
    }
    return this.client.listSessions();
  }

  async listAgents() {
    if (!this.client) {
      return { defaultId: "", mainKey: "main", scope: "per-sender" as const, agents: [] };
    }
    return this.client.listAgents();
  }

  async listModels() {
    if (!this.client) {
      return { models: [] };
    }
    return this.client.listModels();
  }

  async resetSession(): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.resetSession({ sessionKey: this.currentSessionKey });
  }

  private handleEvent(evt: GatewayEvent): void {
    switch (evt.event) {
      case "chat":
        this.handleChatEvent(evt.payload as ChatEvent);
        break;
      case "agent":
        this.handleAgentEvent(evt.payload as AgentEvent);
        break;
      case "chat.side_result":
        this.handleBtwEvent(evt.payload as BtwEvent);
        break;
    }
  }

  private handleChatEvent(evt: ChatEvent): void {
    if (evt.sessionKey !== this.currentSessionKey) {
      return;
    }

    const msg = evt.message as Record<string, unknown> | undefined;
    const content = msg?.content;

    switch (evt.state) {
      case "delta": {
        const text = extractTextFromContent(content);
        if (text) {
          this.callbacks.onStreamEvent({
            type: "content_delta",
            text,
            runId: evt.runId,
          });
        }
        const thinking = extractThinkingFromContent(content);
        if (thinking) {
          this.callbacks.onStreamEvent({
            type: "thinking_delta",
            thinking,
            runId: evt.runId,
          });
        }
        this.callbacks.onStreamingChange("streaming");
        break;
      }
      case "final": {
        const finalMessage: Message = {
          role: "assistant",
          content: extractTextFromContent(content),
          timestamp: Date.now(),
        };
        this.callbacks.onStreamEvent({
          type: "final",
          message: finalMessage,
          runId: evt.runId,
          errorMessage: evt.errorMessage,
        });
        this.activeRunId = null;
        this.callbacks.onStreamingChange("idle");
        break;
      }
      case "aborted":
        this.callbacks.onStreamEvent({
          type: "aborted",
          runId: evt.runId,
        });
        this.activeRunId = null;
        this.callbacks.onStreamingChange("idle");
        break;
      case "error":
        this.callbacks.onStreamEvent({
          type: "error",
          runId: evt.runId,
          errorMessage: evt.errorMessage ?? "Unknown error",
        });
        this.activeRunId = null;
        this.callbacks.onStreamingChange("error");
        break;
    }
  }

  private handleAgentEvent(evt: AgentEvent): void {
    if (!evt.data) {
      return;
    }

    if (evt.stream === "tool") {
      const data = evt.data;
      const toolCallId = (data.toolCallId as string) ?? "";
      if (!toolCallId) {
        return;
      }

      const toolEvent: ToolEvent = {
        toolCallId,
        name: (data.name as string) ?? "tool",
        phase: (data.phase as "start" | "update" | "result") ?? "start",
        args: data.args,
        partialResult: data.partialResult,
        result: data.result,
        isError: Boolean(data.isError),
      };
      this.callbacks.onStreamEvent(toolEvent);
    }

    if (evt.stream === "lifecycle") {
      const phase = evt.data.phase as string;
      if (phase === "start") {
        this.callbacks.onStreamingChange("running");
      }
      if (phase === "end") {
        this.callbacks.onStreamingChange("idle");
      }
      if (phase === "error") {
        this.callbacks.onStreamingChange("error");
      }
    }
  }

  private handleBtwEvent(evt: BtwEvent): void {
    if (evt.kind !== "btw") {
      return;
    }
    this.callbacks.onBtw({
      question: evt.question,
      text: evt.text,
      isError: evt.isError,
    });
  }

  private parseHistoryResult(result: unknown): Message[] {
    if (!result || typeof result !== "object") {
      return [];
    }
    const data = result as Record<string, unknown>;
    const entries = data.entries ?? data.messages ?? [];
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .filter((e: Record<string, unknown>) => e && typeof e === "object")
      .map((e: Record<string, unknown>) => ({
        role: (e.role as "user" | "assistant" | "system") ?? "assistant",
        content: extractTextFromContent(e.content),
        timestamp: typeof e.timestamp === "number" ? e.timestamp : undefined,
      }));
  }
}
