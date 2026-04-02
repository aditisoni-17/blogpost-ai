"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { logout } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const { isAuthenticated, userProfile, isAuthor, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            📝 BlogPost AI
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>

            {isAuthenticated && isAuthor && (
              <Link href="/blog/create" className="text-gray-700 hover:text-blue-600">
                ✍️ Create Post
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-600">
                ⚙️ Admin
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {userProfile?.name} ({userProfile?.role})
                </span>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
