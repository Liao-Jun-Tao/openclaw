// Phase 2: Build tool factory
export { buildTool, type BuiltTool, type ToolDef, type ToolMetadata } from "./src/build-tool.js";

// Phase 3: Thinking system
export {
  type ThinkingConfig,
  type ThinkingLevel,
  type ThinkingBlock,
  type RedactedThinkingBlock,
  resolveThinkingConfig,
  modelSupportsThinking,
  modelSupportsAdaptiveThinking,
  parseThinkingBlocks,
} from "./src/thinking.js";

// Phase 4: Context management
export {
  TokenBudgetManager,
  createCompactBoundaryMessage,
  type CompactBoundaryMessage,
  checkCompactTrigger,
  type CompactTrigger,
  estimateTokenCount,
} from "./src/context/compact.js";

export {
  estimateMessageTokens,
  computeContextStats,
  formatContextStats,
  type ContextWindowStats,
  type MessageTokenEstimate,
} from "./src/context/tokens.js";

export {
  recoverConversation,
  validateConversationIntegrity,
  type RecoverableMessage,
  type RecoveryResult,
} from "./src/context/recovery.js";

// Phase 5: Permissions
export {
  type PermissionMode,
  type PermissionBehavior,
  type PermissionRule,
  type PermissionResult,
  type PermissionContext,
  type RiskLevel,
  type CommandRiskAssessment,
  assessCommandRisk,
  checkToolPermission,
  isPathWithinWorkspace,
  isSensitivePath,
} from "./src/permissions.js";

// Phase 6: Streaming executor
export {
  StreamingToolExecutor,
  type ToolExecution,
  type ToolStatus,
  type ExecutorStats,
  type ToolProgressCallback,
} from "./src/executor.js";

// Progress tracking
export { ProgressTracker } from "./src/progress.js";
