"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">BlogPost AI</h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
              Intelligent blogging platform with AI-powered summaries.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Links</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-blue-700">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-blue-700">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-blue-700">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">About</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <a
                  href="https://github.com/aditisoni-17/blogpost-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://hivon.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700"
                >
                  Hivon Automations
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>
            © 2024 BlogPost AI. Built with Next.js, Supabase & Google AI API.
          </p>
          <p className="mt-2">
            Assignment: Hivon Automations LLP | New Delhi, India
          </p>
        </div>
      </div>
    </footer>
  );
}
