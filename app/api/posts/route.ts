import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  verifyAuth,
  verifyRole,
} from "@/app/lib/middleware";
import { supabase } from "@/app/lib/supabase";
import { generateSummary } from "@/app/lib/ai";

// GET /api/posts - Get all published posts with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    // Get paginated posts
    const { data: posts, error } = await supabase
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
        users:author_id(name, email)
      `
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse("Failed to fetch posts", 500);
    }

    return successResponse({
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("GET posts error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST /api/posts - Create a new post (author only)
export async function POST(request: NextRequest) {
  try {
    const verification = await verifyRole(request, ["author", "admin"]);

    if (!verification.valid) {
      return errorResponse(
        verification.error || "Unauthorized",
        verification.status || 401
      );
    }

    const { title, body, image_url } = await request.json();

    if (!title || !body) {
      return errorResponse("Title and body are required", 400);
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert([
        {
          title,
          body,
          image_url,
          author_id: verification.user!.id,
          is_published: true,
        },
      ])
      .select()
      .single();

    if (postError) {
      return errorResponse("Failed to create post", 500);
    }

    // Generate summary asynchronously
    const summary = await generateSummary(body);
    if (summary) {
      await supabase
        .from("posts")
        .update({ summary })
        .eq("id", post.id);

      post.summary = summary;
    }

    return successResponse(
      { message: "Post created successfully", post },
      201
    );
  } catch (error) {
    console.error("POST posts error:", error);
    return errorResponse("Internal server error", 500);
  }
}
