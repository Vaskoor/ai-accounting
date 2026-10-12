import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accounting UI",
  description: "A small accounting dashboard built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-800">{children}</body>
    </html>
  );
}
