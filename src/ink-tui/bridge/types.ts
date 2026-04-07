export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type StreamingStatus = "idle" | "streaming" | "running" | "error" | "aborted";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: unknown };

export type Message = {
  role: "user" | "assistant" | "system";
  content: ContentBlock[] | string;
  timestamp?: number;
};

export type ToolEvent = {
  toolCallId: string;
  name: string;
  phase: "start" | "update" | "result";
  args?: unknown;
  partialResult?: unknown;
  result?: unknown;
  isError?: boolean;
};

export type StreamEvent = {
  type: "content_delta";
  text: string;
  runId: string;
};

export type ThinkingEvent = {
  type: "thinking_delta";
  thinking: string;
  runId: string;
};

export type FinalEvent = {
  type: "final";
  message: Message;
  runId: string;
  stopReason?: string;
  errorMessage?: string;
};

export type AbortEvent = {
  type: "aborted";
  runId: string;
};

export type ErrorEvent = {
  type: "error";
  runId: string;
  errorMessage: string;
};

export type BridgeEvent =
  | StreamEvent
  | ThinkingEvent
  | FinalEvent
  | AbortEvent
  | ErrorEvent
  | ToolEvent;

export type SessionInfo = {
  sessionKey: string;
  agentId: string;
  model?: string;
  thinkingLevel?: string;
  fastMode?: boolean;
  verboseLevel?: string;
  contextTokens?: number | null;
  totalTokens?: number | null;
};

export type AgentInfo = {
  id: string;
  name?: string;
};

export type BridgeState = {
  connectionStatus: ConnectionStatus;
  streamingStatus: StreamingStatus;
  activeRunId: string | null;
  sessionInfo: SessionInfo;
  agents: AgentInfo[];
  messages: Message[];
  tools: Map<string, ToolEvent>;
};
