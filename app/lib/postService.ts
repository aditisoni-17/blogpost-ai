/**
 * Post service - Encapsulates all post-related business logic
 * Separates concerns for better maintainability and testability
 */

import { supabase } from "./supabase";
import { generateSummary } from "./ai";
import {
  canGenerateSummary,
} from "./aiRateLimit";
import { logAICall } from "./aiMonitoring";
import { CreatePostValidated } from "./validation";

export interface PostCreationResult {
  success: boolean;
  post?: {
    id: string;
    title: string;
    body: string;
    image_url: string | null;
    author_id: string;
    summary: string | null;
    is_published: boolean;
    created_at: string;
  };
  summaryPending?: boolean;
  error?: string;
  statusCode: number;
}

/**
 * Create a new post in the database
 * Handles:
 * - Rate limiting check
 * - Database insertion
 * - Async AI summary generation
 * - Error handling and logging
 */
export async function createPost(
  userId: string,
  input: CreatePostValidated
): Promise<PostCreationResult> {
  try {
    // 1. Validate rate limit
    if (!canGenerateSummary(userId)) {
      return {
        success: false,
        error:
          "Rate limit exceeded. You can create up to 10 AI summaries per hour. Please try again later.",
        statusCode: 429,
      };
    }

    // 2. Insert post into database
    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert([
        {
          title: input.title,
          body: input.body,
          image_url: input.image_url,
          author_id: userId,
          is_published: true,
          summary: null, // Will be filled by async generation
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("[PostService] Database insertion failed:", insertError);
      return {
        success: false,
        error: "Failed to create post. Please try again.",
        statusCode: 500,
      };
    }

    if (!post) {
      return {
        success: false,
        error: "Post creation returned no data.",
        statusCode: 500,
      };
    }

    // 3. Generate summary asynchronously
    // Fire-and-forget: don't wait for completion
    generateSummaryAsync(post.id, input.body, userId).catch((err) => {
      console.error(`[AI] Failed to generate summary for post ${post.id}:`, err);
    });

    // 4. Return successful response
    return {
      success: true,
      post: {
        id: post.id,
        title: post.title,
        body: post.body,
        image_url: post.image_url,
        author_id: post.author_id,
        summary: post.summary,
        is_published: post.is_published,
        created_at: post.created_at,
      },
      summaryPending: true,
      statusCode: 201,
    };
  } catch (error) {
    console.error("[PostService] Unexpected error creating post:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
      statusCode: 500,
    };
  }
}

/**
 * Generate AI summary asynchronously
 * Updates post record when complete, logs metrics
 *
 * @param postId - Post ID to update
 * @param body - Post content to summarize
 * @param userId - User ID for metrics
 */
async function generateSummaryAsync(
  postId: string,
  body: string,
  userId: string
): Promise<void> {
  const startTime = Date.now();

  try {
    console.log(`[AI] Generating summary for post ${postId}...`);

    const summary = await generateSummary(body);

    if (!summary) {
      console.warn(
        `[AI] No summary generated for post ${postId} (API returned null)`
      );
      logAICall(postId, userId, false, 0);
      return;
    }

    // Update post with generated summary
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      console.error(
        `[AI] Failed to save summary for post ${postId}:`,
        updateError
      );
      logAICall(postId, userId, false, 0);
      return;
    }

    const duration = Date.now() - startTime;
    console.log(
      `[AI] Summary generated and saved for post ${postId} (${summary.length} chars, ${duration}ms)`
    );

    // Log successful generation
    logAICall(postId, userId, true, summary.length);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[AI] Unexpected error generating summary for post ${postId} after ${duration}ms:`,
      error
    );
    logAICall(postId, userId, false, 0);
  }
}

/**
 * Fetch posts with proper pagination and security
 */
export async function fetchPublishedPosts(
  page: number,
  limit: number
): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts: any[];
  total: number;
  pages: number;
}> {
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    if (!count) {
      return { posts: [], total: 0, pages: 0 };
    }

    // Get paginated posts
    const { data: posts, error: fetchError } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        body,
        image_url,
        summary,
        author_id,
        created_at,
        updated_at,
        is_published,
        view_count,
        users:author_id(id, name, email)
      `
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error("[PostService] Failed to fetch posts:", fetchError);
      throw new Error("Failed to fetch posts");
    }

    return {
      posts: posts || [],
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error("[PostService] Error in fetchPublishedPosts:", error);
    throw error;
  }
}

/**
 * Check if a user has permission to create posts
 */
export async function userCanCreatePosts(
  userId: string,
  userRole: string
): Promise<boolean> {
  // Admins and authors can always create posts
  return userRole === "admin" || userRole === "author";
}

/**
 * Get post creation statistics for a user
 */
export async function getUserPostStats(userId: string): Promise<{
  totalPosts: number;
  postsToday: number;
  lastPostTime: string | null;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total posts
    const { count: totalPosts, error: totalError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);

    // Get posts created today
    const { count: postsToday } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId)
      .gte("created_at", today.toISOString());

    // Get last post time
    const { data: lastPost } = await supabase
      .from("posts")
      .select("created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (totalError) {
      console.error("[PostService] Failed to get total post count:", totalError);
      return { totalPosts: 0, postsToday: 0, lastPostTime: null };
    }

    return {
      totalPosts: totalPosts || 0,
      postsToday: postsToday || 0,
      lastPostTime: lastPost?.created_at || null,
    };
  } catch (error) {
    console.error("[PostService] Error getting user post stats:", error);
    return { totalPosts: 0, postsToday: 0, lastPostTime: null };
  }
}
