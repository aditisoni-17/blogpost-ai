"use client";

import Link from "next/link";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    summary: string | null;
    image_url: string | null;
    created_at: string;
    view_count: number;
    users?: {
      name?: string;
      email?: string;
    };
  };
}

export default function PostCard({ post }: PostCardProps) {
  const summary =
    post.summary?.trim() ||
    "Read the full post to explore the ideas, details, and key takeaways.";

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group surface-card flex h-full flex-col overflow-hidden rounded-3xl"
    >
      <div className="relative h-52 overflow-hidden bg-slate-100">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-6 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Featured Post
              </p>
              <p className="mt-3 text-sm text-slate-500">
                No cover image provided
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span>{post.view_count} views</span>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold leading-tight text-slate-900 transition group-hover:text-blue-700">
            {post.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">
            {summary}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-600">
            By {post.users?.name || "Unknown author"}
          </span>
          <span className="font-medium text-blue-700">Read article</span>
        </div>
      </div>
    </Link>
  );
}
