import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@pinecone-database/pinecone", "groq-sdk"],
  turbopack: {},
};

export default nextConfig;
