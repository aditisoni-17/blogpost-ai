import { NextRequest } from "next/server";
import { errorResponse, successResponse, verifyAuth } from "@/app/lib";
import { 
  canGenerateSummary, 
  logAICall, 
  getRemainingCalls,
  generateSummary 
} from "@/app/lib/ai";

/**
 * POST /api/ai/summarize
 * 
 * Generate an AI summary for blog post content
 * 
 * ✅ SECURITY FEATURES:
 * - Requires authentication (Bearer token)
 * - Rate limited to 5 summaries per day per user
 * - Input length validated (max 100,000 chars)
 * - API key never exposed to client (uses server-side GOOGLE_AI_API_KEY)
 * - All API calls logged for monitoring
 * 
 * Request body:
 * {
 *   content: string (50-100000 chars)
 *   postId?: string (for logging/tracking)
 * }
 * 
 * Response:
 * {
 *   message: "Summary generated successfully"
 *   summary: string
 *   remainingCalls: number
 * }
 * 
 * Errors:
 * - 400: Invalid content
 * - 401: Not authenticated
 * - 429: Rate limit exceeded
 * - 503: AI service unavailable
 */
export async function POST(request: NextRequest) {
  try {
    // 1. ✅ Verify authentication (only authenticated users can generate summaries)
    const user = await verifyAuth(request);

    if (!user) {
      return errorResponse("Unauthorized. Please login to generate summaries.", 401);
    }

    // 2. ✅ Check rate limit before processing
    const canGenerate = await canGenerateSummary(user.id);

    if (!canGenerate) {
      const remaining = await getRemainingCalls(user.id);
      return errorResponse(
        `Rate limit exceeded. You can generate ${remaining} more summaries today. Please try again tomorrow.`,
        429
      );
    }

    // 3. Parse and validate request
    let input;
    try {
      input = await request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const { content, postId } = input;

    if (!content || typeof content !== "string") {
      return errorResponse("Content is required and must be a string", 400);
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < 50) {
      return errorResponse("Content must be at least 50 characters long", 400);
    }

    if (trimmedContent.length > 100000) {
      return errorResponse("Content must not exceed 100,000 characters", 400);
    }

    // 4. Generate summary using server-side API key
    const summary = await generateSummary(trimmedContent);

    if (!summary) {
      return errorResponse(
        "Failed to generate summary. Please try again later.",
        503
      );
    }

    // 5. ✅ Log the API call for monitoring and cost tracking
    await logAICall(
      postId || "unknown",
      user.id,
      true,
      summary.length
    );

    // 6. Get remaining calls for user
    const remaining = await getRemainingCalls(user.id);

    return successResponse({
      message: "Summary generated successfully",
      summary,
      remainingCalls: remaining,
    });
  } catch (error) {
    console.error("[API] POST /api/ai/summarize error:", error);

    // ✅ Don't expose internal error details to client
    return errorResponse(
      "An error occurred while generating the summary. Please try again later.",
      500
    );
  }
}
