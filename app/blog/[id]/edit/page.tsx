"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  author_id: string;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { isAuthenticated, user, isAuthor, isAdmin } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Post not found");
        setLoading(false);
        return;
      }

      setPost(data.post);
      setTitle(data.post.title);
      setBody(data.post.body);
      setImageUrl(data.post.image_url || "");
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading post...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-12">Post not found</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-700 mb-4">Please login to edit this post</p>
        <Link
          href="/auth/login"
          className="text-blue-600 hover:underline font-medium"
        >
          Login here
        </Link>
      </div>
    );
  }

  const isAuthorOfPost = user?.id === post.author_id;
  if (!isAuthorOfPost && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-700">You can only edit your own posts</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await (await import("@/app/lib/supabase")).supabase.auth.getSession();

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
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
        setError(data.error || "Failed to update post");
        return;
      }

      router.push(`/blog/${postId}`);
    } catch (err) {
      console.error("Error updating post:", err);
      setError("An error occurred while updating the post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">✏️ Edit Post</h1>

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
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
            rows={16}
          />
          <p className="mt-2 text-sm text-gray-600">
            💡 Note: Updating the content will regenerate the AI summary
          </p>
        </div>

        {/* Submit and Cancel */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Updating..." : "💾 Save Changes"}
          </button>
          <Link
            href={`/blog/${postId}`}
            className="flex-1 py-3 bg-gray-300 text-gray-800 rounded font-medium hover:bg-gray-400 text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
