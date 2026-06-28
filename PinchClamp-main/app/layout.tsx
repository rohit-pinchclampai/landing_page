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
  title: "PinchClamp AI | Enterprise AI Solutions & Insights",
  description:
    "Your enterprise partner for RAG, Agentic AI, chatbot solutions, and fine-tuning large language models. Explore insights on healthcare AI and intelligent communication.",
  icons: {
    icon: "/pinchclamplogo.png",
  },
  openGraph: {
    title: "PinchClamp AI | Enterprise AI Solutions & Insights",
    description:
      "Your enterprise partner for RAG, Agentic AI, chatbot solutions, and fine-tuning large language models.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for Blog/Insights */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              name: "PinchClamp AI Insights",
              description:
                "Deep dives into AI solutions for healthcare, communication, and enterprise.",
              url: "https://pinchclamp.ai/#insights",
              publisher: {
                "@type": "Organization",
                name: "PinchClamp AI",
                url: "https://pinchclamp.ai",
              },
              blogPost: [
                {
                  "@type": "BlogPosting",
                  headline:
                    "The Future of Telehealth: How AI Is Transforming Virtual Healthcare",
                  description:
                    "Healthcare has undergone a dramatic digital transformation. The next generation of virtual healthcare is about creating intelligent ecosystems that automate documentation and enhance clinical decision-making.",
                  datePublished: "2026-06-14",
                  author: {
                    "@type": "Organization",
                    name: "PinchClamp AI",
                  },
                  image: {
                    "@type": "ImageObject",
                    url: "https://pinchclamp.ai/blog/telehealth-featured.png",
                  },
                },
                {
                  "@type": "BlogPosting",
                  headline:
                    "Why AI-Powered Call Intelligence Is Becoming a Competitive Advantage",
                  description:
                    "AI is transforming sales conversations into actionable business intelligence that helps teams qualify leads faster and improve conversion rates across the entire pipeline.",
                  datePublished: "2026-06-14",
                  author: {
                    "@type": "Organization",
                    name: "PinchClamp AI",
                  },
                  image: {
                    "@type": "ImageObject",
                    url: "https://pinchclamp.ai/blog/call-intelligence-featured.png",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      {/* FIX: Added font-sans, bg-pinch-bg, text-pinch-text, min-h-screen, 
        and custom highlight selection colors.
      */}
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased font-sans bg-pinch-bg text-pinch-text min-h-screen selection:bg-pinch-cyan/30 selection:text-pinch-cyan`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
          enableColorScheme={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}