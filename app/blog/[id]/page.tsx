"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CommentsSection } from "@/app/components/CommentsSection";
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

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { fetchWithAuth } = useAuthFetch();
  
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<
    Array<{
      id: string;
      post_id: string;
      user_id: string;
      comment_text: string;
      is_approved: boolean;
      created_at: string;
      users: {
        id: string;
        name: string;
        email: string;
      };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 py-12">
        <div className="h-72 animate-pulse rounded-[2rem] bg-slate-200" />
        <div className="surface-card rounded-[2rem] p-8">
          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 h-12 w-3/4 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-10/12 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-red-700">
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Post not found</h1>
        <p className="mt-4 text-slate-600">
          The article may have been removed or the link may be incorrect.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white hover:bg-blue-800"
        >
          Back to posts
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.author_id;
  const canEdit = isAuthor || isAdmin;

  return (
    <article className="mx-auto w-full max-w-5xl space-y-8">
      {post.image_url && (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100">
          <img
            src={post.image_url}
            alt={post.title}
            className="h-[260px] w-full object-cover md:h-[420px]"
          />
        </div>
      )}

      <div className="surface-card rounded-[2rem] p-6 md:p-10">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
            <span>{post.view_count} views</span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                {post.title}
              </h1>
              <div className="text-slate-600">
                <p className="font-medium text-slate-800">
                  By {post.users?.name || "Unknown"}
                </p>
                <p className="mt-1 text-sm">
                  Updated {new Date(post.updated_at || post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-3">
                <Link
                  href={`/blog/${post.id}/edit`}
                  className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </header>

        {post.summary && (
          <section className="mt-8 rounded-[1.5rem] border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              AI Summary
            </p>
            <p className="mt-3 leading-7 text-blue-950">{post.summary}</p>
          </section>
        )}

        <section className="mt-8 border-t border-slate-200 pt-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Full article
          </p>
          <div className="whitespace-pre-wrap text-base leading-8 text-slate-700">
            {post.body}
          </div>
        </section>
      </div>

      <CommentsSection
        postId={postId}
        comments={comments}
        onCommentAdded={() => {
          fetchComments();
        }}
      />
    </article>
  );
}
