/**
 * Admin comments API routes - For comment moderation
 * 
 * Requires admin role
 * Allows approving, rejecting, and viewing all comments
 */

import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  successResponse,
  verifyRole,
} from "@/app/lib/middleware";
import { validateCommentId } from "@/app/lib/commentValidation";
import {
  getAllCommentsByPost,
  getUnapprovedComments,
  approveComment,
  rejectComment,
  getCommentStats,
} from "@/app/lib/commentService";

/**
 * GET /api/admin/comments
 *
 * Get all unapproved comments for moderation
 * Admin only endpoint
 *
 * Response: { comments: Comment[], stats: {...} }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    const verification = await verifyRole(request, ["admin"]);

    if (!verification.valid) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    // Get request purpose from query
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const purpose = searchParams.get("purpose");

    // If postId provided, get all comments for that post
    if (postId && postId.trim()) {
      const { comments, error } = await getAllCommentsByPost(postId);

      if (error) {
        return errorResponse(error, 500);
      }

      const approved = comments.filter((c) => c.is_approved).length;
      const unapproved = comments.filter((c) => !c.is_approved).length;

      return successResponse({
        comments,
        stats: {
          total: comments.length,
          approved,
          unapproved,
        },
      });
    }

    // Otherwise get all unapproved comments globally
    const { comments, error } = await getUnapprovedComments();

    if (error) {
      return errorResponse(error, 500);
    }

    // Get stats
    const stats = await getCommentStats();

    return successResponse({
      comments,
      stats: {
        total: stats.totalComments,
        approved: stats.approvedComments,
        unapproved: stats.unapprovedComments,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/admin/comments error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/admin/comments/[commentId]/approve
 *
 * Approve a comment for public display
 * Admin only endpoint
 *
 * Response: { comment: Comment }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    const verification = await verifyRole(request, ["admin"]);

    if (!verification.valid) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    // Check action type from request body or path
    const { action } = await request.json().catch(() => ({ action: "approve" }));

    if (action === "approve") {
      // Validate comment ID
      let commentId;
      try {
        commentId = validateCommentId(params.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid comment ID";
        return errorResponse(message, 400);
      }

      // Approve comment
      const result = await approveComment(commentId);

      if (!result.success) {
        return errorResponse(
          result.error || "Failed to approve comment",
          result.statusCode
        );
      }

      return successResponse({
        message: "Comment approved successfully",
        comment: result.comment,
      });
    } else if (action === "reject") {
      // Validate comment ID
      let commentId;
      try {
        commentId = validateCommentId(params.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid comment ID";
        return errorResponse(message, 400);
      }

      // Reject/delete comment
      const result = await rejectComment(commentId);

      if (!result.success) {
        return errorResponse(
          result.error || "Failed to reject comment",
          result.statusCode
        );
      }

      return successResponse({ message: "Comment rejected and deleted" });
    } else {
      return errorResponse("Invalid action. Use 'approve' or 'reject'.", 400);
    }
  } catch (error) {
    console.error("[API] POST /api/admin/comments error:", error);
    return errorResponse("Internal server error", 500);
  }
}
