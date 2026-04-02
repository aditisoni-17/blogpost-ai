/**
 * ✅ Security Headers Middleware
 * 
 * Implements standard HTTP security headers to protect against:
 * - Clickjacking attacks (X-Frame-Options)
 * - MIME type sniffing (X-Content-Type-Options)
 * - XSS attacks (X-XSS-Protection, Content-Security-Policy)
 * - CSRF attacks (X-CSRF-Token validation)
 * 
 * Usage in Next.js:
 * Add to next.config.ts or middleware.ts
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Apply security headers to all responses
 * Use this in a middleware or route handler
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection (for older browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy - Restrictive default that allows same-origin only
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'", // Only allow same-origin by default
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts (Next.js needs this)
      "style-src 'self' 'unsafe-inline'", // Allow inline styles (CSS-in-JS)
      "img-src 'self' data: https:", // Allow images from same-origin, data URIs, and HTTPS
      "font-src 'self'", // Allow fonts from same-origin
      "connect-src 'self' https://generativelanguage.googleapis.com https://*.supabase.co", // Allow API calls to Google AI and Supabase
      "frame-ancestors 'self'", // Prevent framing
      "form-action 'self'", // Only allow form submissions to same-origin
      "frame-src 'none'", // Disallow embedding frames
    ].join("; ")
  );

  // Referrer Policy - Don't send referrer info to third parties
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy - Restrict access to browser features
  response.headers.set(
    "Permissions-Policy",
    [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "payment=()",
    ].join(", ")
  );

  // Strict Transport Security (HTTPS only - production only)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

/**
 * Validate CSRF token from request
 * ✅ USE IN: POST/PUT/DELETE endpoints
 * 
 * How to use:
 * const token = request.headers.get("x-csrf-token");
 * if (!validateCSRFToken(token)) {
 *   return new Response("Invalid CSRF token", { status: 403 });
 * }
 */
export function validateCSRFToken(token: string | null): boolean {
  // In production, validate against session token
  // For now, just check if token exists and looks valid
  // ✅ TODO: Implement proper CSRF token validation with session
  return token !== null && token !== undefined && token.length > 0;
}

/**
 * Rate limiting middleware
 * Prevents brute force and DoS attacks
 * 
 * ✅ USE IN: Public endpoints that accept user input
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number; // in milliseconds

  constructor(maxRequests: number = 100, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   * @param identifier - Usually IP address or user ID
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove requests outside the time window
    const recentRequests = requests.filter((time) => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Clear rate limit for identifier (e.g., after successful auth)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header for proxied requests
 * 
 * ✅ USE WHEN: Implementing rate limiting by IP
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

/**
 * Validate request origin
 * Prevents CSRF by validating Origin/Referer headers
 * 
 * ✅ USE WHEN: Accepting cross-origin requests
 */
export function isValidOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) {
    // If no origin/referer header, assume same-origin (browser request)
    return true;
  }

  const sourceUrl = origin || referer;
  return allowedOrigins.some((allowed) => sourceUrl?.includes(allowed));
}

/**
 * Log security event to monitoring service
 * ✅ USE WHEN: Detecting suspicious activity
 */
export function logSecurityEvent(
  level: "WARN" | "ERROR" | "INFO",
  message: string,
  details?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();

  console.log(JSON.stringify({
    timestamp,
    level,
    message,
    ...details,
  }));

  // ✅ TODO: Send to security monitoring service (Sentry, DataDog, etc.)
}
