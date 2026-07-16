import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
  title: {
    default: "PlayRank",
    template: "%s | PlayRank",
  },
  description: "India's Esports Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
          <Navbar />

          <main id="main-content">
            {children}
          </main>

          <Footer />
        </div>
      </body>
    </html>
  );
}
