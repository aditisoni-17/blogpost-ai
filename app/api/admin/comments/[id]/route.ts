/**
 * Admin comment moderation by ID
 * POST /api/admin/comments/[id]
 */

import { NextRequest } from "next/server";
import {
  validateCommentId,
  approveComment,
  rejectComment,
} from "@/app/lib";
import { errorResponse, successResponse, verifyRole } from "@/app/lib/middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify admin role
    const verification = await verifyRole(request, ["admin"]);

    if (!verification.valid) {
      return errorResponse("Unauthorized. Admin access required.", 401);
    }

    // 2. Validate comment ID
    const resolvedParams = await params;
    let commentId;
    try {
      commentId = validateCommentId(resolvedParams.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid comment ID";
      return errorResponse(message, 400);
    }

    // 3. Get action from request body
    const { action } = await request.json().catch(() => ({ action: "approve" }));

    if (!action || (action !== "approve" && action !== "reject")) {
      return errorResponse(
        "Invalid action. Use 'approve' or 'reject'.",
        400
      );
    }

    // 4. Perform action
    if (action === "approve") {
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
    } else {
      // reject
      const result = await rejectComment(commentId);

      if (!result.success) {
        return errorResponse(
          result.error || "Failed to reject comment",
          result.statusCode
        );
      }

      return successResponse({
        message: "Comment rejected and deleted successfully",
      });
    }
  } catch (error) {
    console.error("[API] POST /api/admin/comments/[id] error:", error);
    return errorResponse("Internal server error", 500);
  }
}
