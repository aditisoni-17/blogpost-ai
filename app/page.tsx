"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 rounded-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">📝 Welcome to BlogPost AI</h1>
          <p className="text-lg mb-6">
            Discover intelligent blog posts with AI-generated summaries
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-bold rounded hover:bg-gray-100"
          >
            Start Writing Today
          </Link>
        </div>
      </section>

      {/* Search Section */}
      <section>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔍 Search
          </button>
        </form>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Posts Grid */}
      {!loading && posts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.summary && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.summary}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>By {post.users?.name || "Unknown"}</span>
                      <span>👁️ {post.view_count} views</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* No Posts */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "No posts found matching your search."
              : "No posts yet. Be the first to write!"}
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create First Post
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 my-8">
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Previous
            </button>
          )}

          <div className="px-4 py-2">
            Page {page} of {totalPages}
          </div>

          {page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
