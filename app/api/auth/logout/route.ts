import { NextRequest } from "next/server";
import { supabase } from "@/app/lib";
import { errorResponse, successResponse } from "@/app/lib/middleware";

export async function POST(request: NextRequest) {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return errorResponse(error.message, 400);
    }

    return successResponse({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
