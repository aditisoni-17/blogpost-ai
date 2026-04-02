/**
 * Comments service - Encapsulates all comment-related business logic
 * Handles database operations, validation, and workflows
 */

import { supabase } from "./supabase";
import { CreateCommentValidated } from "./commentValidation";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts?: any;
}

export interface CommentResponse {
  success: boolean;
  comment?: Comment;
  comments?: Comment[];
  error?: string;
  statusCode: number;
}

/**
 * Create a new comment on a post
 * Handles:
 * - Post existence check
 * - Comment insertion
 * - Initial approval status (false - awaiting admin)
 */
export async function createComment(
  userId: string,
  input: CreateCommentValidated
): Promise<CommentResponse> {
  try {
    // 1. Verify post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", input.post_id)
      .single();

    if (postError || !post) {
      return {
        success: false,
        error: "Post not found",
        statusCode: 404,
      };
    }

    // 2. Create comment (unapproved by default)
    const { data: comment, error: insertError } = await supabase
      .from("comments")
      .insert([
        {
          post_id: input.post_id,
          user_id: userId,
          comment_text: input.comment_text,
          is_approved: false, // Awaiting admin approval
        },
      ])
      .select(
        `
        id,
        post_id,
        user_id,
        comment_text,
        is_approved,
        created_at,
        updated_at,
        users:user_id(id, name, email)
      `
      )
      .single();

    if (insertError) {
      console.error("[CommentService] Failed to create comment:", insertError);
      return {
        success: false,
        error: "Failed to create comment",
        statusCode: 500,
      };
    }

    return {
      success: true,
      comment,
      statusCode: 201,
    };
  } catch (error) {
    console.error("[CommentService] Unexpected error creating comment:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      statusCode: 500,
    };
  }
}

/**
 * Get approved comments for a post (public view)
 * Only returns comments that have been approved by admin
 */
export async function getApprovedCommentsByPost(postId: string): Promise<{
  comments: Comment[];
  error?: string;
}> {
  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        comment_text,
        is_approved,
        created_at,
        updated_at,
        users:user_id(id, name, email)
      `
      )
      .eq("post_id", postId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[CommentService] Failed to fetch approved comments:", error);
      return {
        comments: [],
        error: "Failed to fetch comments",
      };
    }

    return {
      comments: comments || [],
    };
  } catch (error) {
    console.error("[CommentService] Error fetching approved comments:", error);
    return {
      comments: [],
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get all comments for a post (admin view)
 * Returns both approved and unapproved comments
 * Should only be called with admin verification
 */
export async function getAllCommentsByPost(postId: string): Promise<{
  comments: Comment[];
  error?: string;
}> {
  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        comment_text,
        is_approved,
        created_at,
        updated_at,
        users:user_id(id, name, email)
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[CommentService] Failed to fetch all comments:", error);
      return {
        comments: [],
        error: "Failed to fetch comments",
      };
    }

    return {
      comments: comments || [],
    };
  } catch (error) {
    console.error("[CommentService] Error fetching all comments:", error);
    return {
      comments: [],
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get all unapproved comments (admin moderation)
 * Used for admin dashboard to review pending comments
 */
export async function getUnapprovedComments(): Promise<{
  comments: Comment[];
  error?: string;
}> {
  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        comment_text,
        is_approved,
        created_at,
        updated_at,
        users:user_id(id, name, email),
        posts:post_id(id, title)
      `
      )
      .eq("is_approved", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[CommentService] Failed to fetch unapproved comments:", error);
      return {
        comments: [],
        error: "Failed to fetch unapproved comments",
      };
    }

    return {
      comments: comments || [],
    };
  } catch (error) {
    console.error("[CommentService] Error fetching unapproved comments:", error);
    return {
      comments: [],
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Approve a comment (admin only)
 */
export async function approveComment(commentId: string): Promise<CommentResponse> {
  try {
    const { data: comment, error } = await supabase
      .from("comments")
      .update({
        is_approved: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select(
        `
        id,
        post_id,
        user_id,
        comment_text,
        is_approved,
        created_at,
        updated_at,
        users:user_id(id, name, email)
      `
      )
      .single();

    if (error) {
      console.error("[CommentService] Failed to approve comment:", error);
      return {
        success: false,
        error: "Failed to approve comment",
        statusCode: 500,
      };
    }

    console.log(`[CommentService] Comment ${commentId} approved`);
    return {
      success: true,
      comment,
      statusCode: 200,
    };
  } catch (error) {
    console.error("[CommentService] Error approving comment:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      statusCode: 500,
    };
  }
}

/**
 * Reject/delete a comment (admin only)
 */
export async function rejectComment(commentId: string): Promise<{
  success: boolean;
  error?: string;
  statusCode: number;
}> {
  try {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("[CommentService] Failed to reject comment:", error);
      return {
        success: false,
        error: "Failed to reject comment",
        statusCode: 500,
      };
    }

    console.log(`[CommentService] Comment ${commentId} rejected/deleted`);
    return {
      success: true,
      statusCode: 200,
    };
  } catch (error) {
    console.error("[CommentService] Error rejecting comment:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      statusCode: 500,
    };
  }
}

/**
 * Delete a comment (user can delete own, admin can delete any)
 */
export async function deleteComment(
  commentId: string,
  userId: string,
  isAdmin: boolean
): Promise<{
  success: boolean;
  error?: string;
  statusCode: number;
}> {
  try {
    // Verify comment exists and user has permission
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return {
        success: false,
        error: "Comment not found",
        statusCode: 404,
      };
    }

    // Check if user owns comment or is admin
    const isOwner = comment.user_id === userId;
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "You can only delete your own comments",
        statusCode: 403,
      };
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("[CommentService] Failed to delete comment:", deleteError);
      return {
        success: false,
        error: "Failed to delete comment",
        statusCode: 500,
      };
    }

    console.log(`[CommentService] Comment ${commentId} deleted`);
    return {
      success: true,
      statusCode: 200,
    };
  } catch (error) {
    console.error("[CommentService] Error deleting comment:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      statusCode: 500,
    };
  }
}

/**
 * Get user's own comments
 */
export async function getUserComments(userId: string): Promise<{
  comments: Comment[];
  error?: string;
}> {
  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        comment_text,
        is_approved,
        created_at,
        updated_at,
        posts:post_id(id, title)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[CommentService] Failed to fetch user comments:", error);
      return {
        comments: [],
        error: "Failed to fetch your comments",
      };
    }

    return {
      comments: comments || [],
    };
  } catch (error) {
    console.error("[CommentService] Error fetching user comments:", error);
    return {
      comments: [],
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get comment statistics
 */
export async function getCommentStats(): Promise<{
  totalComments: number;
  approvedComments: number;
  unapprovedComments: number;
  error?: string;
}> {
  try {
    const { count: total } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    const { count: approved } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", true);

    const { count: unapproved } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false);

    return {
      totalComments: total || 0,
      approvedComments: approved || 0,
      unapprovedComments: unapproved || 0,
    };
  } catch (error) {
    console.error("[CommentService] Error getting comment stats:", error);
    return {
      totalComments: 0,
      approvedComments: 0,
      unapprovedComments: 0,
      error: "Failed to fetch statistics",
    };
  }
}
