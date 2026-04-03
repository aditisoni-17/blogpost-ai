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
  const { isAuthenticated, isAuthor, loading: authLoading } = useAuth();
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

    if (field === "imageUrl") {
      setImageFailed(false);
      setImageLoading(Boolean(value.trim()));
    }

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
  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl py-8 md:py-12">
        <div className="surface-card rounded-[2rem] p-8 md:p-10">
          <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 h-10 w-1/2 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="h-14 animate-pulse rounded-3xl bg-slate-200" />
              <div className="h-14 animate-pulse rounded-3xl bg-slate-200" />
              <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
            </div>
            <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-3xl py-12">
        <div className="surface-card rounded-[2rem] px-6 py-14 text-center md:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Author access required
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            Please login to create a post
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Sign in first so the platform can connect your article to your account and permissions.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/login"
              className="inline-flex rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white hover:bg-blue-800"
            >
              Login here
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="mx-auto w-full max-w-3xl py-12">
        <div className="surface-card rounded-[2rem] px-6 py-14 text-center md:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Restricted action
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            Only authors can create posts
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Your account is active, but it does not have author permissions yet. Contact an admin to upgrade your role.
          </p>
        </div>
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
    <div className="mx-auto w-full max-w-6xl py-6 md:py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Author workspace
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          Create a new post
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Draft a polished article with clear structure, an optional cover image, and a summary generated after publishing.
        </p>
      </div>

      {errors.form && (
        <div
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {errors.form}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_360px]">
        <form onSubmit={handleSubmit} className="surface-card rounded-[2rem] p-6 md:p-8">
          <div className="space-y-8">
            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <label className="block text-sm font-medium text-slate-700">
                  Post Title
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  {stats.title.characters} / {POST_VALIDATION.title.maxLength}
                </span>
              </div>

              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={() => handleFieldBlur("title")}
                placeholder="e.g., Getting Started with Next.js 16"
                className={`min-h-13 w-full rounded-3xl border px-5 py-3.5 text-base text-slate-900 outline-none ${
                  touched.title && errors.title
                    ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                }`}
                aria-invalid={touched.title && !!errors.title}
                aria-describedby={touched.title && errors.title ? "title-error" : undefined}
              />

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all ${
                    getTitleProgress() > 90 ? "bg-red-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${getTitleProgress()}%` }}
                />
              </div>

              {touched.title && errors.title ? (
                <p id="title-error" className="mt-3 text-sm text-red-600">
                  {errors.title}
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Use a concise, descriptive headline that tells readers what they will learn.
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Featured Image URL
              </label>

              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
                onBlur={() => handleFieldBlur("imageUrl")}
                placeholder="https://example.com/image.jpg"
                className={`min-h-13 w-full rounded-3xl border px-5 py-3.5 text-base text-slate-900 outline-none ${
                  touched.imageUrl && errors.imageUrl
                    ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                }`}
                aria-invalid={touched.imageUrl && !!errors.imageUrl}
                aria-describedby={
                  touched.imageUrl && errors.imageUrl ? "image-error" : undefined
                }
              />

              {touched.imageUrl && errors.imageUrl ? (
                <p id="image-error" className="mt-3 text-sm text-red-600">
                  {errors.imageUrl}
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Optional. Add a strong cover image to make the listing card more engaging.
                </p>
              )}

              {form.imageUrl && !imageFailed && (
                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                  <div className="relative aspect-[16/9]">
                    {imageLoading && (
                      <div className="absolute inset-0 animate-pulse bg-slate-200" />
                    )}
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              {imageFailed && (
                <p className="mt-3 text-sm text-red-600">
                  Could not load image. Please check the URL.
                </p>
              )}
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <label className="block text-sm font-medium text-slate-700">
                  Post Content
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  {stats.body.words} words • {stats.body.characters} / {POST_VALIDATION.body.maxLength} chars
                </span>
              </div>

              <textarea
                value={form.body}
                onChange={(e) => handleFieldChange("body", e.target.value)}
                onBlur={() => handleFieldBlur("body")}
                placeholder="Write your article here..."
                className={`min-h-[420px] w-full rounded-[1.75rem] border px-5 py-4 font-mono text-sm leading-7 text-slate-900 outline-none ${
                  touched.body && errors.body
                    ? "border-red-300 bg-red-50/60 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                }`}
                rows={20}
                aria-invalid={touched.body && !!errors.body}
                aria-describedby={touched.body && errors.body ? "body-error" : undefined}
              />

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all ${
                    getBodyProgress() > 90 ? "bg-red-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${getBodyProgress()}%` }}
                />
              </div>

              {touched.body && errors.body ? (
                <p id="body-error" className="mt-3 text-sm text-red-600">
                  {errors.body}
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>Estimated reading time: ~{stats.readingTime} min</span>
                  <span>{stats.body.words} words</span>
                  <span>Markdown-friendly content</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 md:flex-row">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="min-h-12 flex-1 rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                aria-busy={loading}
              >
                {loading ? "Publishing..." : "Publish Post"}
              </button>
              <Link
                href="/"
                className="min-h-12 flex-1 rounded-full border border-slate-200 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Post snapshot
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Reading time
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  ~{stats.readingTime} min
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Word count
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.body.words}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Title length
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.title.characters}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              About AI summaries
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              After publishing, the platform generates a concise summary from your post body to improve scanability on the listing page.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Automatically generated after publishing</li>
              <li>Helps readers preview the article faster</li>
              <li>Works best when your content is clear and structured</li>
            </ul>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Writing tips
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Aim for at least {POST_VALIDATION.body.minLength} characters so the article has enough context.</li>
              <li>Lead with a clear opening paragraph that sets expectations.</li>
              <li>Break content into readable sections for better flow.</li>
              <li>Use a descriptive title to improve browsing and search.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
