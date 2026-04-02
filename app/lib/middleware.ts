import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

export async function verifyRole(
  request: NextRequest,
  requiredRoles: string[]
) {
  const user = await verifyAuth(request);

  if (!user) {
    return { 
      valid: false, 
      error: "Unauthorized", 
      status: 401 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return { 
        valid: false, 
        error: "User profile not found", 
        status: 404,
        user 
      };
    }

    if (!requiredRoles.includes(data.role)) {
      return { 
        valid: false, 
        error: "Insufficient permissions", 
        status: 403,
        user,
        role: data.role
      };
    }

    return { 
      valid: true, 
      user,
      role: data.role
    };
  } catch (error) {
    console.error("Role verification error:", error);
    return { 
      valid: false, 
      error: "Internal server error", 
      status: 500 
    };
  }
}

export async function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
