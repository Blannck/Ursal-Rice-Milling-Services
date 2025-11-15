import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../lib/stack";

import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Ursal Rice Milling Services",
  description: "Ursal Rice Milling Services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-fixed bg-cover bg-center min-h-screen bg-[url('/login.jpeg')]`}
      >
        <div className="bg-black/50 w-screen min-h-screen">
        <div className="fixed inset-0 bg-black/30 -z-10" />
        <StackProvider app={stackServerApp}><StackTheme>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >

              <Toaster/>
              <Navbar />
              

              {children}
            </ThemeProvider>
          </StackTheme>
        </StackProvider>
      </StackTheme></StackProvider></div></body>
    </html>
  );
}
