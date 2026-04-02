import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  verifyRole,
} from "@/app/lib/middleware";
import { supabase } from "@/app/lib/supabase";

// GET /api/posts/[id] - Get a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const { data: post, error } = await supabase
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
      .eq("id", postId)
      .single();

    if (error || !post) {
      return errorResponse("Post not found", 404);
    }

    // Increment view count
    await supabase
      .from("posts")
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq("id", postId);

    return successResponse({ post });
  } catch (error) {
    console.error("GET post error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// PUT /api/posts/[id] - Update a post (author can update own, admin can update any)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const verification = await verifyRole(request, ["author", "admin"]);

    if (!verification.valid) {
      return errorResponse(
        verification.error || "Unauthorized",
        verification.status || 401
      );
    }

    // Get the post
    const { data: post, error: getError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (getError || !post) {
      return errorResponse("Post not found", 404);
    }

    // Check authorization
    const isOwner = post.author_id === verification.user!.id;
    const isAdmin = verification.role === "admin";

    if (!isOwner && !isAdmin) {
      return errorResponse("You can only edit your own posts", 403);
    }

    const { title, body, image_url } = await request.json();

    if (!title || !body) {
      return errorResponse("Title and body are required", 400);
    }

    // ✅ Get current post to check if body changed
    const { data: currentPost } = await supabase
      .from("posts")
      .select("body, summary")
      .eq("id", postId)
      .single();

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update({
        title,
        body,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (updateError) {
      return errorResponse("Failed to update post", 500);
    }

    // ✅ ONLY regenerate summary if body actually changed
    let summaryUpdated = false;
    if (body !== currentPost?.body) {
      console.log(
        `[AI] Post body changed, regenerating summary for post ${postId}`
      );

      const { generateSummary } = await import("@/app/lib/ai");
      const summary = await generateSummary(body);

      if (summary) {
        await supabase
          .from("posts")
          .update({ summary })
          .eq("id", postId);

        updatedPost.summary = summary;
        summaryUpdated = true;
      }
    } else {
      // Keep existing summary
      updatedPost.summary = currentPost?.summary || null;
    }

    return successResponse({
      message: "Post updated successfully",
      post: updatedPost,
      summaryUpdated,
    });
  } catch (error) {
    console.error("PUT post error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// DELETE /api/posts/[id] - Delete a post (author can delete own, admin can delete any)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const verification = await verifyRole(request, ["author", "admin"]);

    if (!verification.valid) {
      return errorResponse(
        verification.error || "Unauthorized",
        verification.status || 401
      );
    }

    // Get the post
    const { data: post, error: getError } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (getError || !post) {
      return errorResponse("Post not found", 404);
    }

    // Check authorization
    const isOwner = post.author_id === verification.user!.id;
    const isAdmin = verification.role === "admin";

    if (!isOwner && !isAdmin) {
      return errorResponse("You can only delete your own posts", 403);
    }

    // Delete post
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      return errorResponse("Failed to delete post", 500);
    }

    return successResponse({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE post error:", error);
    return errorResponse("Internal server error", 500);
  }
}
