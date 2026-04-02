"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useAuthFetch } from "@/app/hooks/useAuthFetch";
import { useParams, useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  summary: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  view_count: number;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthor: currentUserIsAuthor, isAdmin } = useAuth();
  const { fetchWithAuth } = useAuthFetch();
  
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

 useEffect(() => {
    fetchPost();
    fetchComments();
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
      setError(null);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!commentText.trim()) {
      alert("Please enter a comment");
      return;
    }

    setSubmittingComment(true);

    try {
      const response = await fetchWithAuth("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          post_id: postId,
          comment_text: commentText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCommentText("");
        alert("Comment submitted! It will appear after admin approval.");
        fetchComments();
      } else {
        alert(data.error || "Failed to submit comment");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error submitting comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetchWithAuth(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting post");
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

  const isAuthor = user?.id === post.author_id;
  const canEdit = isAuthor || isAdmin;

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      {/* Featured Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.title}
          className="w-full h-96 object-cover rounded-lg"
        />
      )}

      {/* Title and Meta */}
      <header className="space-y-4">
        <h1 className="text-4xl font-bold">{post.title}</h1>
        
        <div className="flex justify-between items-start">
          <div className="text-gray-600">
            <p className="font-medium">By {post.users?.name || "Unknown"}</p>
            <p className="text-sm">
              {new Date(post.created_at).toLocaleDateString()} • {post.view_count} views
            </p>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/blog/${post.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ✏️ Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {post.summary && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="font-bold text-blue-900 mb-2">🤖 AI Summary</h3>
          <p className="text-blue-800">{post.summary}</p>
        </div>
      )}

      {/* Content */}
      <div className="prose max-w-none">
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.body}
        </div>
      </div>

      {/* Comments Section */}
      <section className="border-t pt-8 mt-12">
        <h2 className="text-2xl font-bold mb-6">💬 Comments</h2>

        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              rows={4}
            />
            <button
              type="submit"
              disabled={submittingComment}
              className="mt-3 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submittingComment ? "Submitting..." : "Post Comment"}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Your comment will be visible after admin approval.
            </p>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-100 rounded text-center">
            <p className="text-gray-700 mb-2">Please login to comment</p>
            <Link
              href="/auth/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Login here
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-gray-200 rounded p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{comment.users?.name || "Anonymous"}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-gray-800">{comment.comment_text}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}
