"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-red-700">
        Access Denied: Admin privileges required
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Administration
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          Admin Dashboard
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Review moderation tasks, verify role-based access, and move quickly to the core areas of the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="surface-card rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold text-slate-900">Admin access</h2>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Post moderation</span>
              <span className="font-medium text-slate-900">Enabled</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Comment review</span>
              <span className="font-medium text-slate-900">Enabled</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Role enforcement</span>
              <span className="font-medium text-slate-900">Active</span>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-[2rem] p-6">
          <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <Link
              href="/admin/comments"
              className="block rounded-full bg-blue-700 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-800"
            >
              Moderate comments
            </Link>
            <Link
              href="/"
              className="block rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Review published posts
            </Link>
            <Link
              href="/blog/create"
              className="block rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Create a post
            </Link>
          </div>
        </div>
      </div>

      <div className="surface-card rounded-[2rem] p-6">
        <h3 className="text-lg font-semibold text-slate-900">Admin responsibilities</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>Review and approve or reject pending comments.</li>
          <li>Verify that author and viewer permissions are enforced correctly.</li>
          <li>Access any post for moderation and content review.</li>
          <li>Use the public listing to inspect search, pagination, and summaries.</li>
        </ul>
      </div>
    </div>
  );
}
