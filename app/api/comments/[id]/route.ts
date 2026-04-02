/**
 * Delete comment by ID
 * DELETE /api/comments/[id]
 */

import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  verifyAuth,
  verifyRole,
} from "@/app/lib/middleware";
import { validateCommentId } from "@/app/lib/commentValidation";
import { deleteComment } from "@/app/lib/commentService";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify authentication
    const user = await verifyAuth(request);

    if (!user) {
      return errorResponse("Unauthorized. Please login.", 401);
    }

    // 2. Validate comment ID (basic format check)
    let commentId;
    try {
      commentId = validateCommentId(params.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid comment ID";
      return errorResponse(message, 400);
    }

    // 3. Check if user is admin
    const verification = await verifyRole(request, ["user", "author", "admin"]);
    const isAdmin = verification.role === "admin";

    // 4. Delete comment (service checks ownership)
    const result = await deleteComment(commentId, user.id, isAdmin);

    if (!result.success) {
      return errorResponse(
        result.error || "Failed to delete comment",
        result.statusCode
      );
    }

    return successResponse({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("[API] DELETE /api/comments/[id] error:", error);
    return errorResponse("Internal server error", 500);
  }
}
