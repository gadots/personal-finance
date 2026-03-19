import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Mobile-first portfolio manager for tracking positions, portfolios, and cash flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-ink)] text-[var(--color-paper)]">
        {children}
      </body>
    </html>
  );
}
