import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "PlayRank",
  description: "India's Esports Intelligence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-white">
        <div className="min-h-screen bg-black">
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}