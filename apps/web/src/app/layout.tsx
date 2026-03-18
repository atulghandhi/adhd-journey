import type { Metadata } from "next";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusLab",
  description: "A mobile-first ADHD journey with mobile and web clients.",
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
      </body>
    </html>
  );
}
