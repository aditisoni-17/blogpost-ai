/**
 * Comments API routes - Production-ready
 * 
 * Responsibilities:
 * - Request validation and authentication
 * - Input parsing and normalization
 * - Delegate to service layer
 * - Shape API responses consistently
 * - Error handling and logging
 */

import { NextRequest } from "next/server";
import {
  validateCreateCommentInput,
  createComment,
  getApprovedCommentsByPost,
} from "@/app/lib";
import { errorResponse, successResponse, verifyAuth } from "@/app/lib/middleware";

/**
 * GET /api/comments
 *
 * Fetch approved comments for a post (public endpoint)
 * Only returns comments that have been approved by admin
 *
 * Query parameters:
 * - postId: Post ID (required)
 *
 * Response: { comments: Comment[] }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId || !postId.trim()) {
      return errorResponse("Post ID is required", 400);
    }

    // Fetch only approved comments
    const { comments, error } = await getApprovedCommentsByPost(postId);

    if (error) {
      return errorResponse(error, 500);
    }

    return successResponse({
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("[API] GET /api/comments error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/comments
 *
 * Create a new comment on a post
 * Requires authentication
 *
 * Request body:
 * {
 *   post_id: string (UUID)
 *   comment_text: string (3-5000 chars)
 * }
 *
 * Response: {
 *   message: string
 *   comment: Comment
 * }
 *
 * Errors:
 * - 400: Invalid input
 * - 401: Not authenticated
 * - 404: Post not found
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const user = await verifyAuth(request);

    if (!user) {
      return errorResponse("Unauthorized. Please login to comment.", 401);
    }

    // 2. Parse request body
    let input;
    try {
      input = await request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    // 3. Validate input
    let validatedInput;
    try {
      validatedInput = validateCreateCommentInput(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed";
      return errorResponse(message, 400);
    }

    // 4. Create comment (handles post validation, DB insertion)
    const result = await createComment(user.id, validatedInput);

    if (!result.success) {
      return errorResponse(result.error || "Failed to create comment", result.statusCode);
    }

    // 5. Return success response
    return successResponse(
      {
        message: "Comment submitted successfully! It will appear after admin approval.",
        comment: result.comment,
      },
      201
    );
  } catch (error) {
    console.error("[API] POST /api/comments error:", error);
    return errorResponse("Internal server error", 500);
  }
}
