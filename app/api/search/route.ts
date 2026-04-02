import { NextRequest } from "next/server";
import { errorResponse, successResponse, supabase } from "@/app/lib";

// GET /api/search - Search posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return errorResponse("Search query is required", 400);
    }

    const offset = (page - 1) * limit;

    // Full-text search using Postgres
    const { data: posts, error, count } = await supabase
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
      `,
        { count: "exact" }
      )
      .eq("is_published", true)
      .or(
        `title.ilike.%${query}%,body.ilike.%${query}%,summary.ilike.%${query}%`
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse("Search failed", 500);
    }

    return successResponse({
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      query,
    });
  } catch (error) {
    console.error("Search error:", error);
    return errorResponse("Internal server error", 500);
  }
}
