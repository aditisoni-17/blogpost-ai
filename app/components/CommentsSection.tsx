/**
 * Comments section component - Displays comments and handles creation
 * Production-ready with proper UX and error handling
 */

"use client";

import { useState, useCallback, useEffect } from "react";
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
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { fetchWithAuth } = useAuthFetch();

  // State
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [form, setForm] = useState<FormState>({ text: "" });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

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
    setSubmitMessage(null);

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
      setSubmitMessage(
        data.message || "Comment submitted successfully! It will appear after admin approval."
      );

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
    <section className="surface-card mt-12 rounded-[2rem] p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Discussion
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Comments ({comments.length})
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Approved comments appear below after moderation.
        </p>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <div className="mb-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Add your comment</h3>

          {submitError && (
            <div
              className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
              aria-live="assertive"
            >
              {submitError}
            </div>
          )}

          {submitMessage && (
            <div
              className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Your Comment
                </label>
                <span className="text-xs text-slate-500">
                  {stats.length} / {COMMENT_VALIDATION.commentText.maxLength}
                </span>
              </div>

              <textarea
                value={form.text}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="Share your thoughts about this post..."
                className={`w-full rounded-[1.5rem] border px-4 py-3 text-slate-900 outline-none focus:ring-4 transition ${
                  touched.text && errors.text
                    ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100"
                }`}
                rows={4}
                aria-invalid={touched.text && !!errors.text}
                aria-describedby={touched.text && errors.text ? "comment-error" : undefined}
              />

              {/* Progress bar */}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full transition-all ${
                    stats.length > COMMENT_VALIDATION.commentText.maxLength * 0.9
                      ? "bg-red-500"
                      : "bg-blue-600"
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
                <p id="comment-error" className="mt-3 text-sm text-red-600">
                  {errors.text}
                </p>
              )}

              {/* Stats */}
              {!errors.text && form.text.trim() && (
                <p className="mt-3 text-sm text-slate-500">
                  {stats.words} words
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="rounded-full bg-blue-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                aria-busy={loading}
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
                    setSubmitMessage(null);
                  }}
                  className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-white"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Your comment will be visible after admin approval.
            </p>
          </form>
        </div>
      ) : (
        <div className="mb-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="mb-3 text-slate-700">Please login to comment</p>
          <Link
            href="/auth/login"
            className="inline-flex rounded-full bg-blue-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
          >
            Login here
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-600">
            No approved comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:shadow-sm"
            >
              {/* Comment header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {comment.users?.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(comment.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Delete button - show for comment author or admin */}
                {isAuthenticated &&
                  (user?.id === comment.user_id || isAdmin) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="rounded-full px-3 py-1 text-sm text-red-600 transition hover:bg-red-50 hover:text-red-700"
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  )}
              </div>

              {/* Comment text */}
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                {comment.comment_text}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
