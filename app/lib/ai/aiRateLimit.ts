/**
 * Rate limiting utilities for AI API calls
 * Prevents excessive usage and cost overruns
 */

// In-memory store for rate limiting (use Redis in production)
const aiCallsByUser = new Map<string, number[]>();
const CALLS_PER_HOUR = 10; // Max 10 API calls per user per hour
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds

/**
 * Check if user can make an AI API call
 * Returns true if within rate limit, false otherwise
 */
export function canGenerateSummary(userId: string): boolean {
  const now = Date.now();
  const timestamps = aiCallsByUser.get(userId) || [];

  // Remove timestamps older than 1 hour
  const recentCalls = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  // Check if at limit
  if (recentCalls.length >= CALLS_PER_HOUR) {
    console.warn(
      `[RateLimit] User ${userId} has exceeded AI call limit (${CALLS_PER_HOUR}/hour)`
    );
    return false;
  }

  // Record this call
  recentCalls.push(now);
  aiCallsByUser.set(userId, recentCalls);

  return true;
}

/**
 * Get remaining AI calls for user
 * Useful for informing users when approaching limit
 */
export function getRemainingCalls(userId: string): number {
  const now = Date.now();
  const timestamps = aiCallsByUser.get(userId) || [];

  const recentCalls = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  return Math.max(0, CALLS_PER_HOUR - recentCalls.length);
}

/**
 * Reset rate limit for a user (for testing)
 */
export function resetRateLimit(userId: string): void {
  aiCallsByUser.delete(userId);
}

/**
 * Get statistics for monitoring
 */
export function getAICallStats(): {
  totalUsers: number;
  totalCallsTracked: number;
} {
  const now = Date.now();
  let totalCallsTracked = 0;

  // Clean up old entries and count calls
  for (const [userId, timestamps] of aiCallsByUser.entries()) {
    const recentCalls = timestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    if (recentCalls.length === 0) {
      aiCallsByUser.delete(userId);
    } else {
      totalCallsTracked += recentCalls.length;
    }
  }

  return {
    totalUsers: aiCallsByUser.size,
    totalCallsTracked,
  };
}
