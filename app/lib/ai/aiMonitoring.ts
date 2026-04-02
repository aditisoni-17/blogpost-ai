/**
 * AI Summary monitoring and cost tracking
 * Helps track usage patterns and identify optimization opportunities
 */

export interface AICallMetrics {
  timestamp: Date;
  postId: string;
  userId: string;
  success: boolean;
  summaryLength: number;
  costEstimate: number;
  errorMessage?: string;
}

// In-memory metrics store (use database in production)
const metrics: AICallMetrics[] = [];

/**
 * Log an AI API call for monitoring
 */
export function logAICall(
  postId: string,
  userId: string,
  success: boolean,
  summaryLength: number = 0,
  errorMessage?: string
) {
  // Estimate cost: $0.01 per request (Google Gemini 1.5 Flash pricing)
  const costPerCall = 0.01;

  const metric: AICallMetrics = {
    timestamp: new Date(),
    postId,
    userId,
    success,
    summaryLength,
    costEstimate: success ? costPerCall : 0, // Don't count failed calls
    errorMessage,
  };

  metrics.push(metric);

  // Log to console for debugging
  const logLevel = success ? "info" : "error";
  console[logLevel as "info" | "error"](
    `[AI] Post: ${postId} | User: ${userId} | Success: ${success} | Length: ${summaryLength}`
  );

  // In production, send to analytics/logging service
  // analytics.track("ai_summary", { postId, userId, success, summaryLength });
}

/**
 * Get AI usage statistics
 */
export function getAIMetrics() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Filter recent metrics
  const last24h = metrics.filter((m) => m.timestamp > oneDayAgo);
  const lastHour = metrics.filter((m) => m.timestamp > oneHourAgo);

  // Calculate statistics
  const stats = {
    last24h: {
      total: last24h.length,
      successful: last24h.filter((m) => m.success).length,
      failed: last24h.filter((m) => !m.success).length,
      totalCost: last24h.reduce((sum, m) => sum + m.costEstimate, 0),
      avgSummaryLength: last24h.length
        ? last24h.reduce((sum, m) => sum + m.summaryLength, 0) / last24h.length
        : 0,
      uniqueUsers: new Set(last24h.map((m) => m.userId)).size,
    },
    lastHour: {
      total: lastHour.length,
      successful: lastHour.filter((m) => m.success).length,
      failed: lastHour.filter((m) => !m.success).length,
      totalCost: lastHour.reduce((sum, m) => sum + m.costEstimate, 0),
    },
  };

  return stats;
}

/**
 * Get cost estimate for a date range
 */
export function estimateCost(startDate: Date, endDate: Date): number {
  return metrics
    .filter((m) => m.timestamp >= startDate && m.timestamp <= endDate && m.success)
    .reduce((sum, m) => sum + m.costEstimate, 0);
}

/**
 * Get metrics by user (for rate limiting insights)
 */
export function getMetricsByUser(userId: string) {
  const userMetrics = metrics.filter((m) => m.userId === userId);
  return {
    totalCalls: userMetrics.length,
    successfulCalls: userMetrics.filter((m) => m.success).length,
    failedCalls: userMetrics.filter((m) => !m.success).length,
    totalCost: userMetrics.reduce((sum, m) => sum + m.costEstimate, 0),
  };
}

/**
 * Clear old metrics (run periodically to prevent memory bloat)
 * In production, use a proper database
 */
export function clearOldMetrics(olderThanDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const initialLength = metrics.length;
  metrics.splice(
    0,
    metrics.findIndex((m) => m.timestamp > cutoffDate)
  );

  console.log(
    `[Monitoring] Cleared ${initialLength - metrics.length} metrics older than ${olderThanDays} days`
  );
}
