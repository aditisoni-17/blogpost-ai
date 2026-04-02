import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  verifyAuth,
  verifyRole,
} from "@/app/lib/middleware";
import { supabase } from "@/app/lib/supabase";

// GET /api/comments - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return errorResponse("postId query parameter is required", 400);
    }

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
        users:user_id(name, email)
      `
      )
      .eq("post_id", postId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse("Failed to fetch comments", 500);
    }

    return successResponse({ comments });
  } catch (error) {
    console.error("GET comments error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST /api/comments - Create a comment (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { post_id, comment_text } = await request.json();

    if (!post_id || !comment_text) {
      return errorResponse("post_id and comment_text are required", 400);
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return errorResponse("Post not found", 404);
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert([
        {
          post_id,
          user_id: user.id,
          comment_text,
          is_approved: false, // Comments need admin approval
        },
      ])
      .select()
      .single();

    if (commentError) {
      return errorResponse("Failed to create comment", 500);
    }

    return successResponse(
      {
        message: "Comment created. Awaiting admin approval.",
        comment,
      },
      201
    );
  } catch (error) {
    console.error("POST comment error:", error);
    return errorResponse("Internal server error", 500);
  }
}
