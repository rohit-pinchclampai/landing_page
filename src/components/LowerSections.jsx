import React from "react";

export default function LowerSections() {
  return (
    <div className="bg-gray-900 text-white">

      {/* Why Choose PinchClampAI Section */}
      <section className="max-w-6xl mx-auto py-20 px-6 lg:flex lg:items-center lg:justify-between gap-12">
        <div className="lg:w-1/2">
          <h2 className="text-4xl font-bold mb-6">
            Why Choose <span className="text-gradient bg-gradient-to-r">PinchClamp AI</span>?
          </h2>
          <p className="text-gray-300 mb-6">
            We're not just another AI consultancy. We're your strategic partners
            in AI transformation, delivering solutions that truly clamp to your
            business needs.
          </p>
          <ul className="space-y-3 text-gray-200 mb-6">
            <li>✅ Expert team with 10+ years in AI/ML</li>
            <li>✅ 99.9% uptime for production systems</li>
            <li>✅ Reduced operational costs by 40% on average</li>
          </ul>
          <button className="bg-gradient-to-r from-blue-500 px-6 py-3 rounded-lg font-semibold hover:scale-105 transform transition">
            Partner With Us
          </button>
        </div>

        <div className="lg:w-1/2 grid grid-cols-2 gap-6 mt-10 lg:mt-0">
          <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-blue-500">10+</h3>
            <p className="text-gray-300 mt-2">Years Experience</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-blue-500">100%</h3>
            <p className="text-gray-300 mt-2">Client Satisfaction</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-blue-500">24/7</h3>
            <p className="text-gray-300 mt-2">Support Available</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center shadow-lg">
            <h3 className="text-3xl font-bold text-blue-500">5+</h3>
            <p className="text-gray-300 mt-2">Projects Delivered</p>
          </div>
        </div>
      </section>

      {/* Contact / Ready to Transform Section */}
      <section className="max-w-6xl mx-auto py-20 px-6 lg:flex lg:gap-12">
        {/* Contact Form */}
        <div className="lg:w-1/2 bg-gray-800 rounded-lg p-8 shadow-lg mb-10 lg:mb-0">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-gray-300 mb-6">Send us a message and we'll respond within 24 hours.</p>
          <form className="space-y-4">
            <div className="flex gap-4">
              <input type="text" placeholder="First Name" className="w-1/2 p-3 rounded bg-gray-700 text-white border border-gray-600" />
              <input type="text" placeholder="Last Name" className="w-1/2 p-3 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <input type="email" placeholder="Email" className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" />
            <input type="text" placeholder="Company" className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" />
            <textarea placeholder="Tell us about your AI requirements..." className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 h-32" />
            <button type="submit" disabled className="bg-gray-500 text-gray-300 px-6 py-3 rounded-lg font-semibold w-full cursor-not-allowed opacity-70">
              Send Message ✈️
            </button>
          </form>
        </div>

        {/* Contact Info / CTA */}
        <div className="lg:w-1/2 flex flex-col justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-4">Let's Start a Conversation</h2>
            <p className="text-gray-300 mb-6">
              Whether you're looking to implement your first AI solution or scale existing systems,
              we're here to help you navigate the possibilities.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 bg-gray-800 p-4 rounded shadow">
                <span className="bg-blue-600 p-2 rounded text-white">📧</span>
                <span>team@pinchclamp.ai</span>
              </li>
              <li className="flex items-center gap-3 bg-gray-800 p-4 rounded shadow">
                <span className="bg-blue-600 p-2 rounded text-white">📞</span>
                <span>+91 9611901656</span>
              </li>
              <li className="flex items-center gap-3 bg-gray-800 p-4 rounded shadow">
                <span className="bg-blue-600 p-2 rounded text-white">📍</span>
                <span>Bangalore, India
                </span>
              </li>
            </ul>
          </div>
          {/* <div className="bg-gradient-to-r bg-primary p-6 rounded-lg shadow-lg mt-6">
            <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
            <p className="text-gray-100 mb-4">Schedule a free consultation to discuss your AI needs.</p>
            <button className="bg-black text-white px-6 py-2 rounded hover:scale-105 transform transition">
              Book Consultation
            </button>
          </div> */}
        </div>
      </section>
    </div>
  );
}
