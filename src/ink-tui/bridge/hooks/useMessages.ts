import { useCallback, useRef, useState } from "react";
import type { BridgeEvent, Message, ToolEvent } from "../types.js";

type ToolState = {
  id: string;
  name: string;
  phase: "start" | "update" | "result";
  result?: unknown;
  isError?: boolean;
};

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [thinkingText, setThinkingText] = useState("");
  const [activeTools, setActiveTools] = useState(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  const currentRunIdRef = useRef<string | null>(null);

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content: text, timestamp: Date.now() },
    ]);
  }, []);

  const handleBridgeEvent = useCallback(
    (event: BridgeEvent) => {
      if ("type" in event) {
        switch (event.type) {
          case "content_delta":
            currentRunIdRef.current = event.runId;
            setStreamingText((prev) => prev + event.text);
            setIsStreaming(true);
            break;

          case "thinking_delta":
            setThinkingText((prev) => prev + event.thinking);
            break;

          case "final":
            setMessages((prev) => [...prev, event.message]);
            setStreamingText("");
            setThinkingText("");
            setIsStreaming(false);
            setActiveTools(new Map());
            currentRunIdRef.current = null;
            break;

          case "aborted":
          case "error": {
            const text = streamingText;
            if (text) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant" as const,
                  content: text,
                  timestamp: Date.now(),
                },
              ]);
            }
            setStreamingText("");
            setThinkingText("");
            setIsStreaming(false);
            setActiveTools(new Map());
            currentRunIdRef.current = null;
            break;
          }
        }
      }

      if ("toolCallId" in event) {
        const toolEvt = event;
        setActiveTools((prev) => {
          const next = new Map(prev);
          next.set(toolEvt.toolCallId, {
            id: toolEvt.toolCallId,
            name: toolEvt.name,
            phase: toolEvt.phase,
            result: toolEvt.result,
            isError: toolEvt.isError,
          });
          return next;
        });
      }
    },
    [streamingText],
  );

  const loadHistory = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingText("");
    setThinkingText("");
    setActiveTools(new Map());
  }, []);

  return {
    messages,
    streamingText,
    thinkingText,
    activeTools,
    isStreaming,
    addUserMessage,
    handleBridgeEvent,
    loadHistory,
    clearMessages,
  };
}
