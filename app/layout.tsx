import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "TallyWeb - Accounting",
  description: "A Tally-style double-entry accounting app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-slate-800 bg-slate-50">
        <Nav />
        {children}
      </body>
    </html>
  );
}