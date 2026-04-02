/**
 * AI module exports
 * Public API for AI utilities including generation, rate limiting, and monitoring
 */

// AI generation
export { generateSummary, generateMultipleSummaries } from "./ai";
export type { GenerateContentRequest } from "./ai";

// Rate limiting
export {
  canGenerateSummary,
  getRemainingCalls,
  resetRateLimit,
  getAICallStats,
} from "./aiRateLimit";

// Monitoring
export {
  logAICall,
  getAIMetrics,
  estimateCost,
  getMetricsByUser,
  clearOldMetrics,
} from "./aiMonitoring";
export type { AICallMetrics } from "./aiMonitoring";
