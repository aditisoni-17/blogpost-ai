"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">📝 BlogPost AI</h3>
            <p className="text-gray-600">
              Intelligent blogging platform with AI-powered summaries.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/" className="hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-blue-600">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">About</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a
                  href="https://github.com/aditisoni-17/blogpost-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://hivon.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  Hivon Automations
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
          <p>
            © 2024 BlogPost AI. Built with Next.js, Supabase & Google AI API.
          </p>
          <p className="text-sm mt-2">
            Assignment: Hivon Automations LLP | New Delhi, India
          </p>
        </div>
      </div>
    </footer>
  );
}
