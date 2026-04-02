/**
 * Post creation API route - Production-ready version
 * 
 * Responsibilities:
 * - Request validation and authentication
 * - Input parsing and normalization
 * - Delegate business logic to service layer
 * - Shape API response consistently
 * - Error handling and logging
 */

import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  verifyRole,
} from "@/app/lib/middleware";
import {
  validateCreatePostInput,
  validatePaginationParams,
  getContentStats,
  estimateReadingTime,
} from "@/app/lib/validation";
import { createPost, fetchPublishedPosts } from "@/app/lib/postService";

/**
 * GET /api/posts
 *
 * Fetch published posts with pagination
 * Public endpoint (no authentication required)
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Posts per page (max: 100, default: 10)
 *
 * Response: { posts: Post[], pagination: { page, limit, total, pages } }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate pagination
    const { page, limit } = validatePaginationParams(
      searchParams.get("page"),
      searchParams.get("limit")
    );

    // Fetch posts
    const { posts, total, pages } = await fetchPublishedPosts(page, limit);

    // Add computed fields (reading time, stats)
    const postsWithMeta = posts.map((post) => ({
      ...post,
      readingTime: estimateReadingTime(post.body),
      contentStats: getContentStats(post.body),
    }));

    return successResponse({
      posts: postsWithMeta,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/posts error:", error);
    return errorResponse("Failed to fetch posts", 500);
  }
}

/**
 * POST /api/posts
 *
 * Create a new blog post
 * Requires authentication as author or admin
 *
 * Request body:
 * {
 *   title: string (5-200 chars)
 *   body: string (50-100000 chars)
 *   image_url?: string (optional, valid URL)
 * }
 *
 * Response: {
 *   message: string
 *   post: Post
 *   summaryPending: boolean
 * }
 *
 * Errors:
 * - 400: Invalid input
 * - 401: Not authenticated
 * - 403: Not authorized (not author/admin)
 * - 429: Rate limit exceeded (too many summaries)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication and role
    const verification = await verifyRole(request, ["author", "admin"]);

    if (!verification.valid) {
      return errorResponse(
        verification.error || "Unauthorized",
        verification.status || 401
      );
    }

    const userId = verification.user?.id;
    if (!userId) {
      return errorResponse("User ID not found", 401);
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
      validatedInput = validateCreatePostInput(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed";
      return errorResponse(message, 400);
    }

    // 4. Create post (handles rate limiting, DB insertion, AI generation)
    const result = await createPost(userId, validatedInput);

    if (!result.success) {
      return errorResponse(result.error || "Failed to create post", result.statusCode);
    }

    // 5. Return success response
    return successResponse(
      {
        message:
          "Post created successfully! AI summary is being generated and will appear shortly.",
        post: {
          ...result.post,
          contentStats: getContentStats(result.post!.body),
          readingTime: estimateReadingTime(result.post!.body),
        },
        summaryPending: result.summaryPending,
      },
      result.statusCode
    );
  } catch (error) {
    console.error("[API] POST /api/posts error:", error);
    return errorResponse("Internal server error", 500);
  }
}
