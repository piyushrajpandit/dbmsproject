import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Hospital Management System",
  description: "Advanced hospital operations and clinical tracking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#08080c] text-gray-100 antialiased min-h-screen flex flex-col md:flex-row`}>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0d0d15",
              color: "#f3f4f6",
              border: "1px solid #1f2937",
            },
            success: {
              iconTheme: {
                primary: "#4ade80",
                secondary: "#08080c",
              },
            },
          }}
        />

        {/* Sidebar Component */}
        <Sidebar />

        {/* Main Content Workspace */}
        <main className="flex-1 md:pl-64 min-w-0 min-h-screen flex flex-col">
          <div className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
