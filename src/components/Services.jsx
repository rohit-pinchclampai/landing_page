import React from "react";
import { Link } from "react-router-dom";

const services = [
  {
    name: "RAG",
    description:
      "Boost LLMs with real-time knowledge retrieval for accurate, fact-based answers.",
    link: "/rag-demo",
    icon: (
      <svg
        className="w-12 h-12 mb-4 text-accent mx-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Database icon for retrieval */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6a8 3 0 0116 0v12a8 3 0 01-16 0V6zM4 6v12M20 6v12"
        />
      </svg>
    ),
  },
  {
    name: "Agentic AI",
    description:
      "Deploy autonomous AI agents that can plan, reason, and seamlessly execute complex workflows.",
    link: "/agentic-demo",
    icon: (
      <svg
        className="w-12 h-12 mb-4 text-accent mx-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Robot/agent icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2a2 2 0 012 2v2a2 2 0 01-4 0V4a2 2 0 012-2zm6 18a6 6 0 00-12 0v2h12v-2z"
        />
      </svg>
    ),
  },
  {
    name: "AI Chatbot",
    description:
      "Build conversational assistants that engage users with natural, human-like interactions.",
    link: "/chatbot-demo",
    icon: (
      <svg
        className="w-12 h-12 mb-4 text-accent mx-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chat bubble icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 8h10M7 12h6m-3 8a9 9 0 100-18 9 9 0 000 18z"
        />
      </svg>
    ),
  },
  {
    name: "Finetune LLM",
    description:
      "Customize large language models with your data for domain-specific expertise and precision.",
    link: "/finetune-demo",
    icon: (
      <svg
        className="w-12 h-12 mb-4 text-accent mx-auto"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Code / AI tuning icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4v16m8-8H4m5-5l7 7m0-7l-7 7"
        />
      </svg>
    ),
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="py-20 px-4 bg-gradient-to-b from-bgLight to-white"
    >
      <h3 className="text-4xl font-bold text-center text-primary mb-12">
        Our Services
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
        {services.map((service) => (
          <div
            key={service.name}
            className="bg-cardBg p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transition transform duration-300 text-center animate-fadeUp relative overflow-hidden"
          >
            {/* Background shape animation */}
            <span className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-3xl animate-pulse"></span>

            {/* Icon */}
            {service.icon}

            {/* Title & Description */}
            <h4 className="text-xl font-semibold text-primary mb-2">
              {service.name}
            </h4>
            <p className="text-textGray mb-4">{service.description}</p>

            <Link
              to={service.link}
              className="inline-block bg-secondary text-white px-4 py-2 rounded hover:scale-105 transform transition shadow-md"
            >
              View Demo
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
