import React from "react";
import { Link } from "react-router-dom";

export default function BlogCTA() {
  return (
    <section
      className="py-20 px-4 text-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1350&q=80')",
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 max-w-xl mx-auto">
        <h3 className="text-3xl font-bold text-white mb-6">Our Blog</h3>
        <p className="text-gray-200 mb-6">
          Explore articles on AI integration, RAG, Agentic AI, and cutting-edge
          AI trends.
        </p>
        <Link
          to="/blogs"
          className="bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transform transition shadow-md"
        >
          Visit Blog
        </Link>
      </div>
    </section>
  );
}
