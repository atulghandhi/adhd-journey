import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Thing",
  description: "Task-first ADHD support for real-world momentum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-focuslab-background font-sans text-focuslab-primaryDark antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
