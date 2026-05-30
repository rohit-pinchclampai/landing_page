import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
import BlogCTA from "../components/BlogCTA";
import Footer from "../components/Footer";
import LowerSections from "../components/LowerSections";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <Hero />
      <Services />
      <LowerSections />
      <Footer />
    </div>
  );
}
