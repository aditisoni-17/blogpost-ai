"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function CreatePostPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthor } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-700 mb-4">Please login to create a post</p>
        <Link
          href="/auth/login"
          className="text-blue-600 hover:underline font-medium"
        >
          Login here
        </Link>
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-700">
          Only authors can create posts. Please contact an admin to upgrade your role.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await (await import("@/app/lib/supabase")).supabase.auth.getSession();

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create post");
        return;
      }

      router.push(`/blog/${data.post.id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("An error occurred while creating the post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">✍️ Create New Post</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Getting Started with Next.js"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Featured Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-4 w-full max-h-64 object-cover rounded border border-gray-200"
              onError={() => setImageUrl("")}
            />
          )}
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Content *
          </label>
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your blog post content here... (Markdown supported)"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
            rows={16}
          />
          <p className="mt-2 text-sm text-gray-600">
            💡 Tip: Aim for at least 200 words for better AI-generated summaries
          </p>
        </div>

        {/* Submit and Cancel */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "📤 Publish Post"}
          </button>
          <Link
            href="/"
            className="flex-1 py-3 bg-gray-300 text-gray-800 rounded font-medium hover:bg-gray-400 text-center"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold text-blue-900 mb-2">🤖 About AI Summaries</h3>
        <p className="text-blue-800 text-sm">
          When you publish your post, our AI will automatically generate a concise 200-word summary.
          This summary will appear on the blog listing to help readers understand your post quickly.
        </p>
      </div>
    </div>
  );
}
