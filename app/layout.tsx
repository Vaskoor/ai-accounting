import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import CommandPalette from "@/components/CommandPalette";
import ChatBot from "@/components/ChatBot";

export const metadata: Metadata = {
  title: "TallyWeb — Nepali AI Accounting",
  description: "A Tally-style double-entry accounting app with Nepali fiscal year + AI bill extraction",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <ThemeProvider>
          <div className="flex min-h-screen flex-1">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </div>
          <CommandPalette />
          <ChatBot />
        </ThemeProvider>
      </body>
    </html>
  );
}
