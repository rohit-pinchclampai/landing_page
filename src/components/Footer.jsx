import React from "react";

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-6 text-center">
      &copy; {new Date().getFullYear()} PinchClampAI. All rights reserved.
    </footer>
  );
}
