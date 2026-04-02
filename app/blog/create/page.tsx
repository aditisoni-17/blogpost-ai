/**
 * Create Post Page - Production-ready version
 *
 * Features:
 * - Real-time validation feedback
 * - Character/word counters
 * - Reading time estimate
 * - Better error handling and UX
 * - Accessibility improvements
 * - Loading states
 * - Draft auto-save (placeholder for future)
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useAuthFetch } from "@/app/hooks/useAuthFetch";
import Link from "next/link";
import {
  POST_VALIDATION,
  getContentStats,
  estimateReadingTime,
} from "@/app/lib/validation";

interface FormState {
  title: string;
  body: string;
  imageUrl: string;
}

interface ValidationErrors {
  title?: string;
  body?: string;
  imageUrl?: string;
  form?: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthor } = useAuth();
  const { fetchWithAuth } = useAuthFetch();

  // Form state
  const [form, setForm] = useState<FormState>({
    title: "",
    body: "",
    imageUrl: "",
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Loading state
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Compute stats for display
  const stats = useMemo(() => {
    return {
      title: getContentStats(form.title),
      body: getContentStats(form.body),
      readingTime: estimateReadingTime(form.body),
    };
  }, [form.title, form.body]);

  // Validation functions
  const validateField = useCallback(
    (field: string, value: string): string | undefined => {
      value = value.trim();

      if (field === "title") {
        if (!value) return "Title is required";
        if (value.length < POST_VALIDATION.title.minLength) {
          return `Title must be at least ${POST_VALIDATION.title.minLength} characters`;
        }
        if (value.length > POST_VALIDATION.title.maxLength) {
          return `Title must not exceed ${POST_VALIDATION.title.maxLength} characters`;
        }
      }

      if (field === "body") {
        if (!value) return "Body is required";
        if (value.length < POST_VALIDATION.body.minLength) {
          return `Body must be at least ${POST_VALIDATION.body.minLength} characters`;
        }
        if (value.length > POST_VALIDATION.body.maxLength) {
          return `Body must not exceed ${POST_VALIDATION.body.maxLength} characters`;
        }
      }

      if (field === "imageUrl") {
        if (value) {
          try {
            new URL(value);
          } catch {
            return "Invalid image URL format";
          }
          if (value.length > POST_VALIDATION.imageUrl.maxLength) {
            return "Image URL is too long";
          }
        }
      }

      return undefined;
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    const titleError = validateField("title", form.title);
    if (titleError) newErrors.title = titleError;

    const bodyError = validateField("body", form.body);
    if (bodyError) newErrors.body = bodyError;

    const imageError = validateField("imageUrl", form.imageUrl);
    if (imageError) newErrors.imageUrl = imageError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, validateField]);

  // Event handlers
  const handleFieldChange = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field if it passes validation
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  };

  const handleFieldBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageFailed(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageFailed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrors((prev) => ({
        ...prev,
        form: "Please fix the errors above before submitting",
      }));
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetchWithAuth("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          image_url: form.imageUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          form:
            data.error ||
            "Failed to create post. Please try again or contact support.",
        });
        return;
      }

      // Success - redirect to new post
      router.push(`/blog/${data.post.id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      setErrors({
        form:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Access control
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
          Only authors can create posts. Please contact an admin to upgrade your
          role.
        </p>
      </div>
    );
  }

  // Helper functions for progress indicators
  const getTitleProgress = () => {
    return Math.min(
      100,
      (stats.title.characters / POST_VALIDATION.title.maxLength) * 100
    );
  };

  const getBodyProgress = () => {
    return Math.min(
      100,
      (stats.body.characters / POST_VALIDATION.body.maxLength) * 100
    );
  };

  const isFormValid =
    Object.keys(errors).filter((k) => k !== "form").length === 0 &&
    form.title.trim() &&
    form.body.trim();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">✍️ Create New Post</h1>

      {/* Form-level errors */}
      {errors.form && (
        <div
          className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded"
          role="alert"
        >
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title field */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Post Title
              <span className="text-red-500 ml-1">*</span>
            </label>
            <span className="text-xs text-gray-500">
              {stats.title.characters} / {POST_VALIDATION.title.maxLength}
            </span>
          </div>

          <input
            type="text"
            value={form.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            onBlur={() => handleFieldBlur("title")}
            placeholder="e.g., Getting Started with Next.js 14"
            className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 transition ${
              touched.title && errors.title
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            aria-invalid={touched.title && !!errors.title}
            aria-describedby={touched.title && errors.title ? "title-error" : undefined}
          />

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-gray-200 rounded overflow-hidden">
            <div
              className={`h-full transition-all ${
                getTitleProgress() > 90 ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${getTitleProgress()}%` }}
            />
          </div>

          {/* Error message */}
          {touched.title && errors.title && (
            <p id="title-error" className="mt-2 text-sm text-red-600">
              {errors.title}
            </p>
          )}

          {/* Hint */}
          {!errors.title && (
            <p className="mt-2 text-sm text-gray-600">
              💡 Make it descriptive and compelling
            </p>
          )}
        </div>

        {/* Featured Image field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image URL
          </label>

          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
            onBlur={() => handleFieldBlur("imageUrl")}
            placeholder="https://example.com/image.jpg"
            className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 transition ${
              touched.imageUrl && errors.imageUrl
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            aria-invalid={touched.imageUrl && !!errors.imageUrl}
            aria-describedby={
              touched.imageUrl && errors.imageUrl ? "image-error" : undefined
            }
          />

          {/* Error message */}
          {touched.imageUrl && errors.imageUrl && (
            <p id="image-error" className="mt-2 text-sm text-red-600">
              {errors.imageUrl}
            </p>
          )}

          {/* Image preview */}
          {form.imageUrl && !imageFailed && (
            <div className="mt-4 relative">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
              )}
              <img
                src={form.imageUrl}
                alt="Preview"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="w-full max-h-64 object-cover rounded border border-gray-200"
              />
            </div>
          )}

          {imageFailed && (
            <p className="mt-2 text-sm text-red-600">
              Could not load image. Please check the URL.
            </p>
          )}

          {!errors.imageUrl && (
            <p className="mt-2 text-sm text-gray-600">
              📸 Optional: Add a featured image to make your post stand out
            </p>
          )}
        </div>

        {/* Body field */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Post Content
              <span className="text-red-500 ml-1">*</span>
            </label>
            <span className="text-xs text-gray-500">
              {stats.body.words} words • {stats.body.characters} /
              {POST_VALIDATION.body.maxLength} chars
            </span>
          </div>

          <textarea
            value={form.body}
            onChange={(e) => handleFieldChange("body", e.target.value)}
            onBlur={() => handleFieldBlur("body")}
            placeholder="Write your blog post content here... (Markdown supported)"
            className={`w-full px-4 py-3 border rounded focus:outline-none focus:ring-2 transition font-mono text-sm ${
              touched.body && errors.body
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            rows={20}
            aria-invalid={touched.body && !!errors.body}
            aria-describedby={touched.body && errors.body ? "body-error" : undefined}
          />

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-gray-200 rounded overflow-hidden">
            <div
              className={`h-full transition-all ${
                getBodyProgress() > 90 ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${getBodyProgress()}%` }}
            />
          </div>

          {/* Error message */}
          {touched.body && errors.body && (
            <p id="body-error" className="mt-2 text-sm text-red-600">
              {errors.body}
            </p>
          )}

          {/* Stats */}
          {!errors.body && (
            <div className="mt-3 flex gap-4 text-sm text-gray-600">
              <span>⏱️ Reading time: ~{stats.readingTime} min</span>
              <span>📊 {stats.body.words} words</span>
            </div>
          )}
        </div>

        {/* Submit buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex-1 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="mr-2">⏳</span> Creating...
              </>
            ) : (
              <>
                <span className="mr-2">📤</span> Publish Post
              </>
            )}
          </button>
          <Link
            href="/"
            className="flex-1 py-3 bg-gray-300 text-gray-800 rounded font-medium hover:bg-gray-400 text-center transition"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* AI Summary Info Card */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          🤖 About AI Summaries
        </h3>
        <p className="text-blue-800 mb-3">
          When you publish your post, our AI will automatically generate a concise
          100-150 word summary. This helps readers quickly understand your post
          without reading the entire content.
        </p>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>✨ Benefits: Improves discoverability and click-through rates</li>
          <li>⚡ Speed: Usually takes 2-5 seconds to generate</li>
          <li>📝 Content: Summarizes your post body, not title or image</li>
          <li>🔄 Can be regenerated: Edit your post to update the summary</li>
        </ul>
      </div>

      {/* Best practices card */}
      <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="text-lg font-bold text-purple-900 mb-3">
          💻 Writing Tips for Better Results
        </h3>
        <ul className="text-purple-800 space-y-2 text-sm">
          <li>
            • <strong>Aim for at least {POST_VALIDATION.body.minLength} characters</strong> — Longer
            content gets better summaries
          </li>
          <li>
            • <strong>Start with a clear hook</strong> — First paragraph sets the tone
          </li>
          <li>
            • <strong>Use descriptive title</strong> — Helps with search and sharing
          </li>
          <li>
            • <strong>Include subheadings</strong> — Better structure for summarization
          </li>
        </ul>
      </div>
    </div>
  );
}
