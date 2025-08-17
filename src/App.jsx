import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RagDemo from "./pages/RagDemo";
import AgenticDemo from "./pages/AgenticDemo";
import ChatbotDemo from "./pages/ChatbotDemo";
import FinetuneDemo from "./pages/FinetuneDemo";
import LowerSections from "./components/LowerSections";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rag-demo" element={<RagDemo />} />
        <Route path="/agentic-demo" element={<AgenticDemo />} />
        <Route path="/chatbot-demo" element={<ChatbotDemo />} />
        <Route path="/finetune-demo" element={<FinetuneDemo />} />
      </Routes>
    </Router>
  );
}

export default App;
