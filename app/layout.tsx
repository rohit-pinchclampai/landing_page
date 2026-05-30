import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PinchClamp AI",
  description:
    "Your enterprise partner for RAG, Agentic AI, chatbot solutions, and fine-tuning large language models.",
  icons: {
    icon: "/pinchclamplogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* FIX: Added font-sans, bg-pinch-bg, text-pinch-text, min-h-screen, 
        and custom highlight selection colors.
      */}
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased font-sans bg-pinch-bg text-pinch-text min-h-screen selection:bg-pinch-cyan/30 selection:text-pinch-cyan`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}