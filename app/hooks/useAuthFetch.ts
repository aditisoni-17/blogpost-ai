import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/lib/supabase";

export function useAuthFetch() {
  const { user } = useAuth();

  const fetchWithAuth = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Get current session with token
    const { data } = await supabase.auth.getSession();
    let token = data.session?.access_token;

    if (!token) {
      throw new Error("Not authenticated - no valid session");
    }

    const makeRequest = (accessToken: string): Promise<Response> => {
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    };

    let response = await makeRequest(token);

    // Handle 401 - token expired, try refresh
    if (response.status === 401) {
      console.log("Token expired, attempting refresh...");
      const { data: refreshData, error } = await supabase.auth.refreshSession();

      if (error || !refreshData.session?.access_token) {
        throw new Error("Session expired - please login again");
      }

      token = refreshData.session.access_token;
      response = await makeRequest(token);
    }

    return response;
  };

  return { fetchWithAuth, isAuthenticated: !!user };
}
