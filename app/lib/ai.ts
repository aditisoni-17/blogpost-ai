/*
 * Public AI utilities - frontend and server may import these, but actual API-key operations
 * occur in server-only code paths (e.g. service routes, not client UI).
 */

export { generateSummary, generateMultipleSummaries } from "./ai/ai";
export type { GenerateContentRequest } from "./ai/ai";
export {
  canGenerateSummary,
  getRemainingCalls,
  resetRateLimit,
  getAICallStats,
} from "./aiRateLimit";
export {
  logAICall,
  getAIMetrics,
  estimateCost,
  getMetricsByUser,
  clearOldMetrics,
} from "./aiMonitoring";
export type { AICallMetrics } from "./aiMonitoring";
