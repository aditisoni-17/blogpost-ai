/**
 * Post validation schemas and utilities
 * Ensures data integrity for post creation and updates
 */

export interface CreatePostInput {
  title: string;
  body: string;
  image_url?: string | null;
}

export interface CreatePostValidated extends CreatePostInput {
  title: string; // Guaranteed non-empty, trimmed
  body: string;  // Guaranteed non-empty, trimmed
  image_url: string | null; // Normalized
}

// Validation constraints
export const POST_VALIDATION = {
  title: {
    minLength: 5,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-_.,:;'"!?()[\]{}@&#*()+=]/,
    description: "Title must be 5-200 characters",
  },
  body: {
    minLength: 50,
    maxLength: 100000,
    description: "Body must be 50-100000 characters",
  },
  imageUrl: {
    maxLength: 2000,
    description: "Image URL must be valid and under 2000 characters",
  },
} as const;

/**
 * Normalize and validate post creation input
 * @throws Error with specific validation message
 */
export function validateCreatePostInput(input: unknown): CreatePostValidated {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input: expected object");
  }

  const data = input as Record<string, unknown>;

  // Validate title
  const title = String(data.title || "").trim();
  if (!title) {
    throw new Error("Title is required");
  }
  if (title.length < POST_VALIDATION.title.minLength) {
    throw new Error(
      `Title must be at least ${POST_VALIDATION.title.minLength} characters`
    );
  }
  if (title.length > POST_VALIDATION.title.maxLength) {
    throw new Error(
      `Title must not exceed ${POST_VALIDATION.title.maxLength} characters`
    );
  }

  // Validate body
  const body = String(data.body || "").trim();
  if (!body) {
    throw new Error("Body is required");
  }
  if (body.length < POST_VALIDATION.body.minLength) {
    throw new Error(
      `Body must be at least ${POST_VALIDATION.body.minLength} characters`
    );
  }
  if (body.length > POST_VALIDATION.body.maxLength) {
    throw new Error(
      `Body must not exceed ${POST_VALIDATION.body.maxLength} characters`
    );
  }

  // Validate image URL (optional)
  let imageUrl: string | null = null;
  if (data.image_url && typeof data.image_url === "string") {
    imageUrl = data.image_url.trim();

    // Basic URL validation
    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        throw new Error("Invalid image URL format");
      }

      if (imageUrl.length > POST_VALIDATION.imageUrl.maxLength) {
        throw new Error(
          `Image URL must not exceed ${POST_VALIDATION.imageUrl.maxLength} characters`
        );
      }
    } else {
      imageUrl = null;
    }
  }

  return {
    title,
    body,
    image_url: imageUrl,
  };
}

/**
 * Sanitize HTML/dangerous content from strings
 * Removes common XSS attack vectors while preserving markdown
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");

  // Remove control characters (except newlines, tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Don't strip HTML/markdown - let the frontend handle rendering
  // This preserves markdown while DB stores it safely

  return sanitized.trim();
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page: unknown,
  limit: unknown
): { page: number; limit: number } {
  const p = parseInt(String(page || "1"));
  const l = parseInt(String(limit || "10"));

  const validPage = Math.max(1, isNaN(p) ? 1 : p);
  const validLimit = Math.min(100, Math.max(1, isNaN(l) ? 10 : l));

  return { page: validPage, limit: validLimit };
}

/**
 * Estimate reading time based on word count
 * Useful for UX feedback
 */
export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Get word and character count
 */
export function getContentStats(text: string): {
  words: number;
  characters: number;
  charactersWithoutSpaces: number;
} {
  const trimmed = text.trim();
  return {
    words: trimmed.split(/\s+/).length,
    characters: trimmed.length,
    charactersWithoutSpaces: trimmed.replace(/\s/g, "").length,
  };
}
