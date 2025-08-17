import React from "react";

export default function Hero() {
  return (
    <section
      className="relative py-32 px-4 text-center text-white"
      style={{

        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-blue-900 bg-black/40"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-extrabold animate-slideIn mb-6">
          Clamping AI to your needs.  
        </h2>
        <p className="text-xl text-black-100 mb-10 animate-fadeIn">
        Your enterprise partner for RAG, Agentic AI, chatbot solutions, and fine-tuned large language models.
        </p>
        <a
          href="#services"
          className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transform transition shadow-md"
        >
          Explore Services
        </a>
      </div>
    </section>
  );
}
