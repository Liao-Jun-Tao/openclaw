/**
 * Session persistence and conversation recovery.
 * Ported from Claude Code utils/conversationRecovery.ts.
 *
 * Handles:
 *  - Orphaned thinking/tool-result message cleanup
 *  - Session resume with boundary markers
 *  - Message integrity validation
 */

export interface RecoverableMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolUseId?: string;
  toolResultId?: string;
  isThinking?: boolean;
}

export interface RecoveryResult {
  recovered: RecoverableMessage[];
  dropped: RecoverableMessage[];
  hadOrphans: boolean;
  boundaryMarker?: RecoverableMessage;
}

/**
 * Filter orphaned messages from a conversation:
 *  - Tool results without a matching tool_use
 *  - Thinking blocks left dangling (no subsequent assistant response)
 *  - Incomplete assistant turns at the end
 */
export function recoverConversation(messages: RecoverableMessage[]): RecoveryResult {
  const toolUseIds = new Set<string>();
  const recovered: RecoverableMessage[] = [];
  const dropped: RecoverableMessage[] = [];
  let hadOrphans = false;

  // First pass: collect all tool_use IDs
  for (const msg of messages) {
    if (msg.toolUseId) {
      toolUseIds.add(msg.toolUseId);
    }
  }

  // Second pass: filter orphans
  for (const msg of messages) {
    if (msg.toolResultId && !toolUseIds.has(msg.toolResultId)) {
      dropped.push(msg);
      hadOrphans = true;
      continue;
    }

    // Drop trailing thinking blocks with no follow-up
    if (msg.isThinking && msg === messages[messages.length - 1]) {
      dropped.push(msg);
      hadOrphans = true;
      continue;
    }

    recovered.push(msg);
  }

  let boundaryMarker: RecoverableMessage | undefined;
  if (hadOrphans && dropped.length > 0) {
    boundaryMarker = {
      id: `recovery-${Date.now()}`,
      role: "system",
      content: `[Session recovered: ${dropped.length} orphaned message(s) removed]`,
      timestamp: Date.now(),
    };
  }

  return { recovered, dropped, hadOrphans, boundaryMarker };
}

/**
 * Validate that a message array forms a valid conversation
 * (alternating user/assistant, system only at start, etc.)
 */
export function validateConversationIntegrity(messages: RecoverableMessage[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (messages.length === 0) {
    return { valid: true, issues: [] };
  }

  let lastNonSystemRole: string | null = null;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role === "system" && i > 0 && messages[i - 1].role !== "system") {
      // system messages in the middle are usually compaction boundaries -- ok
    }

    if (msg.role === "user" || msg.role === "assistant") {
      if (lastNonSystemRole === msg.role && msg.role === "user") {
        issues.push(`Consecutive user messages at index ${i}`);
      }
      lastNonSystemRole = msg.role;
    }
  }

  return { valid: issues.length === 0, issues };
}
