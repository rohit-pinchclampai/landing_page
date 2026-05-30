import React, { useState } from "react";
import axios from "axios";

export default function RagDemo() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Upload message
  const [isUploaded, setIsUploaded] = useState(false);
  const [docId, setDocId] = useState("");

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamically choose API base for local vs deployed
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:8000"
      : "https://be-r8l1.onrender.com";

  // ------------------- Upload File -------------------
  const handleFileUpload = async (e) => {
    e.preventDefault();
    setUploadStatus("");
    setIsUploaded(false);
    setDocId("");

    if (!file) {
      setUploadStatus("⚠️ Please select a file first.");
      return;
    }

    setUploadStatus("📤 Uploading file...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadStatus(res.data.message || "✅ File uploaded successfully!");
      setIsUploaded(true);
      setDocId(res.data.doc_id || "");
    } catch (err) {
      console.error("Upload error:", err);
      const msg =
        err.response?.data?.detail || "❌ Error uploading file. Check backend.";
      setUploadStatus(msg);
      setIsUploaded(false);
    }
  };

  // ------------------- Query -------------------
  const handleQuery = async (e) => {
    e.preventDefault();
    setAnswer("");

    if (!isUploaded) {
      setAnswer("⚠️ Please upload a document first.");
      return;
    }

    if (!query.trim()) {
      setAnswer("⚠️ Please enter a question.");
      return;
    }

    setLoading(true);
    try {
      // Send JSON body for /query
      const res = await axios.post(
        `${API_BASE}/query`,
        { question: query, file_id: docId }, // match backend model
        { headers: { "Content-Type": "application/json" } }
      );

      setAnswer(res.data.answer || "🤔 No answer found.");
    } catch (err) {
      console.error("Query error:", err);
      const msg =
        err.response?.data?.detail || "❌ Error fetching answer. Check backend.";
      setAnswer(msg);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- JSX -------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">PinchClampAI RAG Demo</h1>
      <p className="text-gray-600 mb-10 text-center max-w-xl">
        Upload a document and ask questions. Answers are fetched from your uploaded content.
      </p>

      {/* Upload Section */}
      <form
        onSubmit={handleFileUpload}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6 mb-8"
      >
        <label className="block text-gray-700 font-medium mb-2">Upload Document:</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-gray-700 mb-4"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          Upload
        </button>
        {uploadStatus && (
          <p
            className={`mt-3 text-sm font-medium ${
              isUploaded ? "text-green-600" : "text-red-600"
            }`}
          >
            {uploadStatus}
          </p>
        )}
      </form>

      {/* Query Section */}
      <form
        onSubmit={handleQuery}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6 mb-8"
      >
        <label className="block text-gray-700 font-medium mb-2">Ask a Question:</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          rows="4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your question here..."
        />
        <button
          type="submit"
          disabled={loading}
          className={`mt-4 px-6 py-3 rounded-lg text-white font-medium transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Searching..." : "Get Answer"}
        </button>
      </form>

      {/* Answer */}
      {answer && (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Answer:</h2>
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
