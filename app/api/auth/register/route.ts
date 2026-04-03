import { NextRequest } from "next/server";
import { supabase } from "@/app/lib";
import { errorResponse, successResponse } from "@/app/lib/middleware";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return errorResponse("Email, password, and name are required", 400);
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return errorResponse(authError.message, 400);
    }

    if (!authData.user) {
      return errorResponse("Failed to create user account", 400);
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          role: "viewer",
        },
      ]);

    if (profileError) {
      // Delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return errorResponse(
        "Failed to create user profile: " + profileError.message,
        500
      );
    }

    return successResponse({
      message: "Registration successful. Please check your email to verify your account.",
      user: authData.user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Internal server error", 500);
  }
}
