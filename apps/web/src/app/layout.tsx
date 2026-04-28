import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "routrip",
  description: "지도에서 스팟을 담으면 가장 짧은 여행 경로를 짜드려요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-100 dark:bg-zinc-950">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm dark:bg-black">
          {children}
        </div>
      </body>
    </html>
  );
}
