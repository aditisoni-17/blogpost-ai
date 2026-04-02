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
  validateCommentId,
  getAllCommentsByPost,
  getUnapprovedComments,
  approveComment,
  rejectComment,
  getCommentStats,
} from "@/app/lib";

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
