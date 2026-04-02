"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Access Denied: Admin privileges required
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">⚙️ Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistics Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📊 Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Posts</span>
              <span className="font-bold">Loading...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Comments</span>
              <span className="font-bold">Loading...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Comments</span>
              <span className="font-bold text-yellow-600">Loading...</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🔧 Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/comments"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              💬 Moderate Comments
            </Link>
            <Link
              href="/admin/users"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              👥 Manage Users
            </Link>
            <Link
              href="/admin/posts"
              className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              📝 Manage Posts
            </Link>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">📋 Admin Functions</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>✅ View and manage all blog posts</li>
          <li>✅ Approve or reject pending comments</li>
          <li>✅ Manage user roles (viewer, author, admin)</li>
          <li>✅ View platform analytics and statistics</li>
          <li>✅ Delete or moderate inappropriate content</li>
        </ul>
      </div>

      {/* Coming Soon */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-bold text-yellow-900 mb-2">🚀 Coming Soon</h3>
        <p className="text-yellow-800 text-sm">
          Detailed admin pages for specific features are being developed. Use the quick actions above to access key functions.
        </p>
      </div>
    </div>
  );
}
