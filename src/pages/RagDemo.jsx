import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function RagDemo() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-bgLight">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
        <h2 className="text-4xl font-bold text-primary mb-6">RAG Demo Project</h2>
        <p className="text-textGray max-w-2xl">
          This is a placeholder for the Retrieval-Augmented Generation demo.
          You can showcase your AI integration projects here.
        </p>
      </main>
      <Footer />
    </div>
  );
}
