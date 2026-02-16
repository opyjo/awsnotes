import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { AmplifyProvider } from "@/components/providers/AmplifyProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWS Study Notes",
  description: "Study notes and flashcards for AWS certification preparation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AmplifyProvider>
          <QueryProvider>
            <ThemeProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <AuthProvider>{children}</AuthProvider>
                </ConfirmProvider>
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
