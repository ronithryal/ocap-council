import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Web3Provider } from "@/providers/Web3Provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OCAP Council | Agentic Procurement",
  description: "On-Chain Agentic Procurement for the B2B Economy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased selection:bg-blue-500/30`}>
        <Web3Provider>
          <div className="flex min-h-screen bg-black text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <Header />
              <main className="flex-1 p-8 relative">
                {children}
              </main>
              
              {/* Global Background Elements */}
              <div className="absolute inset-0 z-[-1] pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[120px]" />
              </div>
            </div>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
