import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function RagDemo() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4">
        <h2 className="text-4xl font-bold mb-6">RAG Demo Project</h2>
        <p className="text-lg max-w-2xl">
          This is a placeholder for the Retrieval-Augmented Generation demo.
        </p>
      </main>
      <Footer />
    </div>
  );
}
