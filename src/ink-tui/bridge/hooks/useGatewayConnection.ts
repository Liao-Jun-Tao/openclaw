import { useCallback, useEffect, useRef, useState } from "react";
import { GatewayQueryBridge } from "../gateway-query-bridge.js";
import type {
  BridgeEvent,
  ConnectionStatus,
  Message,
  SessionInfo,
  StreamingStatus,
} from "../types.js";

type ConnectionOptions = {
  url: string;
  token?: string;
  password?: string;
  sessionKey: string;
  onEvent?: (event: BridgeEvent) => void;
  onBtw?: (params: { question: string; text: string; isError?: boolean }) => void;
  onHistoryLoaded?: (messages: Message[]) => void;
  onSessionInfoChange?: (info: Partial<SessionInfo>) => void;
};

export function useGatewayConnection(options: ConnectionOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>("idle");
  const bridgeRef = useRef<GatewayQueryBridge | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const bridge = new GatewayQueryBridge(
      {
        url: options.url,
        token: options.token,
        password: options.password,
      },
      {
        onConnectionChange: setConnectionStatus,
        onStreamingChange: setStreamingStatus,
        onStreamEvent: (evt) => optionsRef.current.onEvent?.(evt),
        onSessionInfoChange: (info) => optionsRef.current.onSessionInfoChange?.(info),
        onBtw: (params) => optionsRef.current.onBtw?.(params),
        onHistoryLoaded: (msgs) => optionsRef.current.onHistoryLoaded?.(msgs),
      },
    );
    bridge.setSessionKey(options.sessionKey);
    bridgeRef.current = bridge;

    bridge.connect().catch(() => {
      setConnectionStatus("error");
    });

    return () => {
      bridge.disconnect().catch(() => {});
    };
  }, [options.url, options.token, options.password, options.sessionKey]);

  const sendMessage = useCallback(async (text: string) => {
    if (!bridgeRef.current) {
      return;
    }
    return bridgeRef.current.sendMessage(text);
  }, []);

  const abortRun = useCallback(async () => {
    if (!bridgeRef.current) {
      return;
    }
    return bridgeRef.current.abortRun();
  }, []);

  const loadHistory = useCallback(async (limit?: number) => {
    if (!bridgeRef.current) {
      return;
    }
    return bridgeRef.current.loadHistory(limit);
  }, []);

  const resetSession = useCallback(async () => {
    if (!bridgeRef.current) {
      return;
    }
    return bridgeRef.current.resetSession();
  }, []);

  return {
    bridge: bridgeRef.current,
    connectionStatus,
    streamingStatus,
    sendMessage,
    abortRun,
    loadHistory,
    resetSession,
  };
}
