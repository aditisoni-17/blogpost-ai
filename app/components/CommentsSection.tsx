/**
 * Comments section component - Displays comments and handles creation
 * Production-ready with proper UX and error handling
 */

"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useAuthFetch } from "@/app/hooks/useAuthFetch";
import Link from "next/link";
import { COMMENT_VALIDATION, getCommentTextStats } from "@/app/lib";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded?: (comment: Comment) => void;
}

interface FormState {
  text: string;
}

interface ValidationErrors {
  text?: string;
}

export function CommentsSection({
  postId,
  comments: initialComments,
  onCommentAdded,
}: CommentsSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const { fetchWithAuth } = useAuthFetch();

  // State
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [form, setForm] = useState<FormState>({ text: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation
  const validateComment = useCallback((text: string): string | undefined => {
    text = text.trim();

    if (!text) {
      return "Comment cannot be empty";
    }
    if (text.length < COMMENT_VALIDATION.commentText.minLength) {
      return `Comment must be at least ${COMMENT_VALIDATION.commentText.minLength} characters`;
    }
    if (text.length > COMMENT_VALIDATION.commentText.maxLength) {
      return `Comment must not exceed ${COMMENT_VALIDATION.commentText.maxLength} characters`;
    }

    return undefined;
  }, []);

  // Handle field change
  const handleChange = (value: string) => {
    setForm({ text: value });
    setSubmitError(null);

    if (touched.text) {
      const error = validateComment(value);
      setErrors((prev) => {
        if (error) {
          return { ...prev, text: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors.text;
          return newErrors;
        }
      });
    }
  };

  const handleBlur = () => {
    setTouched((prev) => ({ ...prev, text: true }));
    const error = validateComment(form.text);
    setErrors((prev) => {
      if (error) {
        return { ...prev, text: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors.text;
        return newErrors;
      }
    });
  };

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateComment(form.text);
    if (error) {
      setErrors({ text: error });
      setTouched({ text: true });
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const response = await fetchWithAuth("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          post_id: postId,
          comment_text: form.text.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || "Failed to submit comment");
        return;
      }

      // Success
      setForm({ text: "" });
      setTouched({});
      setErrors({});

      // Add to comments if approved, otherwise add temp indicator
      if (onCommentAdded) {
        onCommentAdded(data.comment);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetchWithAuth(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete comment");
        return;
      }

      // Remove from list
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting comment");
    }
  };

  // Get stats for display
  const stats = getCommentTextStats(form.text);
  const isFormValid = form.text.trim() && !errors.text;

  return (
    <section className="border-t pt-8 mt-12">
      <h2 className="text-2xl font-bold mb-6">💬 Comments ({comments.length})</h2>

      {/* Comment Form */}
      {isAuthenticated ? (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Add Your Comment</h3>

          {submitError && (
            <div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Comment
                </label>
                <span className="text-xs text-gray-500">
                  {stats.length} / {COMMENT_VALIDATION.commentText.maxLength}
                </span>
              </div>

              <textarea
                value={form.text}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="Share your thoughts about this post..."
                className={`w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 transition ${
                  touched.text && errors.text
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                rows={4}
                aria-invalid={touched.text && !!errors.text}
                aria-describedby={touched.text && errors.text ? "comment-error" : undefined}
              />

              {/* Progress bar */}
              <div className="mt-2 h-1 bg-gray-200 rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    stats.length > COMMENT_VALIDATION.commentText.maxLength * 0.9
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.length / COMMENT_VALIDATION.commentText.maxLength) * 100
                    )}%`,
                  }}
                />
              </div>

              {/* Error message */}
              {touched.text && errors.text && (
                <p id="comment-error" className="mt-2 text-sm text-red-600">
                  {errors.text}
                </p>
              )}

              {/* Stats */}
              {!errors.text && form.text.trim() && (
                <p className="mt-2 text-sm text-gray-600">
                  {stats.words} words
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Posting..." : "Post Comment"}
              </button>
              {form.text && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ text: "" });
                    setTouched({});
                    setErrors({});
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded font-medium hover:bg-gray-400 transition"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="text-xs text-gray-600">
              Your comment will be visible after admin approval.
            </p>
          </form>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-700 mb-3">Please login to comment</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
          >
            Login here
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No approved comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition"
            >
              {/* Comment header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {comment.users?.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Delete button - show for comment author or admin */}
                {isAuthenticated &&
                  (user?.id === comment.user_id || user?.role === "admin") && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  )}
              </div>

              {/* Comment text */}
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {comment.comment_text}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
