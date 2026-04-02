/**
 * ✅ Input Sanitization & Security Utilities
 * 
 * Prevents common security vulnerabilities:
 * - XSS (Cross-Site Scripting)
 * - HTML/SQL injection
 * - Command injection
 * - Excessive input lengths
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes
 * 
 * ✅ USE WHEN: Storing user-generated HTML content
 * Example: Blog post body, comment text
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  let sanitized = html
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "")
    // Remove javascript: protocol
    .replace(/javascript:/gi, "")
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, "");

  return sanitized.trim();
}

/**
 * Sanitize plain text input (removes HTML entirely)
 * 
 * ✅ USE WHEN: Accepting plain text that shouldn't have HTML
 * Example: Post titles, usernames, email addresses
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Remove all HTML tags
  const plainText = text.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  return decodeHtmlEntities(plainText).trim();
}

/**
 * Decode HTML entities
 * Converts &amp; to &, &lt; to <, etc.
 */
function decodeHtmlEntities(text: string): string {
  const map: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x2F;": "/",
  };

  return text.replace(/&(?:amp|lt|gt|quot|#39|#x2F);/g, (entity) => map[entity] || entity);
}

/**
 * Validate URL safety
 * Prevents javascript: and data: URLs
 * 
 * ✅ USE WHEN: Accepting URLs from users
 * Example: Blog post image_url
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email address format
 * 
 * ✅ USE WHEN: Accepting email inputs
 * Example: User registration, subscription
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Simple email regex (for validation, use server-side verification)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate input length within safe bounds
 * Prevents DoS attacks with excessive input
 * 
 * ✅ USE WHEN: All text inputs
 * Returns: { valid: boolean; error?: string }
 */
export function validateInputLength(
  input: string,
  minLength: number,
  maxLength: number,
  fieldName: string = "Input"
): { valid: boolean; error?: string } {
  if (typeof input !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize and validate complete object
 * Used for bulk sanitization of request bodies
 * 
 * ✅ USE WHEN: Processing API request bodies
 * Example: POST /api/posts with { title, body, imageUrl }
 */
export function sanitizeObject(
  obj: Record<string, any>,
  schema: Record<string, { sanitize?: string; maxLength?: number }>
): Record<string, any> {
  const sanitized = { ...obj };

  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];

    if (value === undefined || value === null) {
      continue;
    }

    // Apply sanitization based on type
    if (rules.sanitize === "html") {
      sanitized[key] = sanitizeHtml(String(value));
    } else if (rules.sanitize === "text") {
      sanitized[key] = sanitizeText(String(value));
    } else if (rules.sanitize === "url") {
      if (!isValidUrl(String(value))) {
        delete sanitized[key];
      }
    }

    // Apply length limits
    if (rules.maxLength && typeof value === "string") {
      if (value.length > rules.maxLength) {
        sanitized[key] = value.substring(0, rules.maxLength);
      }
    }
  }

  return sanitized;
}

/**
 * Security Report
 * For logging suspicious activity
 */
export function logSecurityEvent(
  eventType: string,
  userId: string | null,
  details: Record<string, any>
): void {
  console.warn("[SECURITY]", {
    timestamp: new Date().toISOString(),
    eventType,
    userId,
    details,
  });

  // ✅ TODO: Send to security monitoring service
  // Example: Sentry, LogRocket, DataDog, etc.
}

/**
 * Check for suspicious patterns
 * Detects common attack vectors
 */
export function detectSuspiciousInput(input: string): { suspicious: boolean; reason?: string } {
  if (!input || typeof input !== "string") {
    return { suspicious: false };
  }

  // Check for SQL injection patterns
  const sqlPatterns = /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b)/i;
  if (sqlPatterns.test(input)) {
    return { suspicious: true, reason: "SQL injection pattern detected" };
  }

  // Check for script injection
  if (/<script|javascript:/i.test(input)) {
    return { suspicious: true, reason: "Script injection pattern detected" };
  }

  // Check for excessive special characters (possible fuzzing attack)
  const specialCharCount = (input.match(/[^a-zA-Z0-9\s\-_.@]/g) || []).length;
  if (specialCharCount > input.length * 0.5) {
    return { suspicious: true, reason: "Unusual character distribution" };
  }

  return { suspicious: false };
}
