/**
 * Validation for comments system
 * Ensures data integrity and provides consistent error messages
 */

export interface CreateCommentInput {
  post_id: string;
  comment_text: string;
}

export interface CreateCommentValidated {
  post_id: string;
  comment_text: string;
}

export const COMMENT_VALIDATION = {
  commentText: {
    minLength: 3,
    maxLength: 5000,
    description: "Comment must be 3-5000 characters",
  },
} as const;

/**
 * Validate comment creation input
 * @throws Error with specific validation message
 */
export function validateCreateCommentInput(
  input: unknown
): CreateCommentValidated {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input: expected object");
  }

  const data = input as Record<string, unknown>;

  // Validate post_id
  const postId = String(data.post_id || "").trim();
  if (!postId) {
    throw new Error("Post ID is required");
  }

  // Validate comment text
  const commentText = String(data.comment_text || "").trim();
  if (!commentText) {
    throw new Error("Comment cannot be empty");
  }
  if (commentText.length < COMMENT_VALIDATION.commentText.minLength) {
    throw new Error(
      `Comment must be at least ${COMMENT_VALIDATION.commentText.minLength} characters`
    );
  }
  if (commentText.length > COMMENT_VALIDATION.commentText.maxLength) {
    throw new Error(
      `Comment must not exceed ${COMMENT_VALIDATION.commentText.maxLength} characters`
    );
  }

  return {
    post_id: postId,
    comment_text: commentText,
  };
}

/**
 * Validate comment ID (UUID format)
 */
export function validateCommentId(id: unknown): string {
  const commentId = String(id || "").trim();
  if (!commentId) {
    throw new Error("Comment ID is required");
  }
  // Basic UUID validation - adjust regex if needed
  if (!commentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error("Invalid comment ID format");
  }
  return commentId;
}

/**
 * Sanitize and normalize comment text
 */
export function sanitizeCommentText(text: string): string {
  return text
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
    .trim();
}

/**
 * Calculate stats about comment text
 */
export function getCommentStats(text: string): {
  length: number;
  words: number;
} {
  const trimmed = sanitizeCommentText(text);
  return {
    length: trimmed.length,
    words: trimmed.split(/\s+/).filter(w => w.length > 0).length,
  };
}
