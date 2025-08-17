import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react"; // nice dropdown icon

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/images/IconOnly.png"   // <-- put your logo file inside public/ folder
            alt="PinchClamp AI Logo"
            className="h-8 w-8 object-contain"
          />
          <h1 className="text-2xl font-extrabold">PinchClamp AI</h1>
        </Link>

        <nav className="space-x-8 relative">
          <Link
            to="/"
            className="hover:text-accent transition duration-300 font-medium"
          >
            Home
          </Link>

          {/* Dropdown Menu */}
          <div className="inline-block relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center hover:text-accent transition duration-300 font-medium focus:outline-none"
            >
              Services <ChevronDown size={18} className="ml-1" />
            </button>

            {isOpen && (
              <div className="absolute mt-2 bg-white text-black rounded-lg shadow-lg py-2 w-48">
                <Link
                  to="/rag-demo"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  RAG
                </Link>
                <Link
                  to="/agentic-demo"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Agentic AI
                </Link>
                <Link
                  to="/chatbot-demo"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Chatbot
                </Link>
                <Link
                  to="/finetune-demo"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Fine-tune LLM
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/blogs"
            className="hover:text-accent transition duration-300 font-medium"
          >
            Blog
          </Link>
        </nav>
      </div>
    </header>
  );
}
