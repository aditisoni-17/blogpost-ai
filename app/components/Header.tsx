"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { logout } from "@/app/lib";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const { isAuthenticated, userProfile, isAuthor, isAdmin, loading: authLoading } = useAuth();
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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-semibold tracking-tight text-slate-900">
            BlogPost AI
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-700">
              Home
            </Link>

            {isAuthenticated && isAuthor && (
              <Link href="/blog/create" className="text-sm font-medium text-slate-600 hover:text-blue-700">
                Create Post
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link href="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-700">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <nav className="flex items-center gap-3">
          {authLoading ? (
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:block">
                {userProfile?.name || "Account"}
                {userProfile?.role ? ` • ${userProfile.role}` : ""}
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing out..." : "Logout"}
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
