"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PostCard from "./components/PostCard";

interface Post {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  created_at: string;
  view_count: number;
  users: {
    name: string;
    email: string;
  };
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [page, searchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const endpoint = searchQuery
        ? `/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}`
        : `/api/posts?page=${page}`;

      // No auth needed for public endpoints
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch posts");
        setPosts([]);
        return;
      }

      setPosts(data.posts || []);
      setTotalPages(data.pagination?.pages || 1);
      setError(null);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("An error occurred while fetching posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  return (
    <div className="w-full space-y-10">
      <section className="surface-card overflow-hidden rounded-[2rem]">
        <div className="grid gap-10 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
              Modern blogging platform
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Publish thoughtful writing with clean presentation and AI-assisted summaries.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Browse recent posts, discover concise summaries, and share polished articles through a focused publishing experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white hover:bg-blue-800"
              >
                Start writing
              </Link>
              <Link
                href="/auth/login"
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 md:grid-cols-3 lg:grid-cols-1">
            <div>
              <p className="text-3xl font-semibold text-slate-900">{posts.length}</p>
              <p className="mt-1 text-sm text-slate-600">
                Posts on this page
              </p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-slate-900">{totalPages}</p>
              <p className="mt-1 text-sm text-slate-600">Pages available</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-slate-900">
                {searchQuery ? "Filtered" : "Latest"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Clean reading-first layout
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-6 md:p-8">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Explore posts
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Search by title, content, or summary
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="min-h-12 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Search
          </button>
        </form>
      </section>

      {loading && (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="surface-card overflow-hidden rounded-3xl"
            >
              <div className="h-52 animate-pulse bg-slate-200" />
              <div className="space-y-4 p-6">
                <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="h-6 w-4/5 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </section>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              {searchQuery ? "Search results" : "Latest posts"}
            </h2>
            <p className="text-sm text-slate-500">
              {posts.length} article{posts.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="surface-card rounded-[2rem] px-6 py-14 text-center md:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Nothing here yet
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-900">
            {searchQuery
              ? "No posts matched your search."
              : "Your blog feed is ready for its first story."}
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            {searchQuery
              ? "Try a broader keyword or clear the search field to browse the latest published articles."
              : "Create an account to publish the first post and start building a thoughtful collection of articles."}
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-flex rounded-full bg-blue-700 px-6 py-3 text-sm font-medium text-white hover:bg-blue-800"
          >
            Create your first post
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3 py-2">
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Previous
            </button>
          )}

          <div className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm text-slate-600">
            Page {page} of {totalPages}
          </div>

          {page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
