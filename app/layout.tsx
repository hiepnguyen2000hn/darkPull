import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import { JotaiProvider } from "@/providers/JotaiProvider";
import { PreloadTokenIcons } from "@/components/PreloadTokenIcons";
import { ToastProvider } from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Zenigma",
    template: "%s | Zenigma",
  },
  description: "Zenigma - Privacy-First Dark Pool Trading",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PreloadTokenIcons />
        <ToastProvider />
        <JotaiProvider>
          <ContextProvider cookies={cookies}>{children}</ContextProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
