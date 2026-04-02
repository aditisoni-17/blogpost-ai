import { supabase } from "./supabase";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }

  return user;
}

export async function getCurrentUserProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getCurrentUserProfile:", error);
    return null;
  }
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function register(
  email: string,
  password: string,
  name: string
) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    // Create user profile with default role 'viewer'
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
      throw new Error(profileError.message);
    }

    return authData;
  } catch (error) {
    throw error;
  }
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function checkRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking role:", error);
      return "viewer"; // Default to viewer if error
    }

    return data?.role;
  } catch (error) {
    console.error("Error in checkRole:", error);
    return "viewer";
  }
}

export function isAuthor(role: string): boolean {
  return role === "author" || role === "admin";
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}
