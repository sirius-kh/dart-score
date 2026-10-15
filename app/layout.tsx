import type { Metadata, Viewport } from "next";
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
  title: "Дартсын оноо",
  description: "X01 (301/501/701) дартсын оноо бодогч",
  appleWebApp: { capable: true, title: "Дартс", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#10151f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        {/* Ар талын дартсын самбар зураг */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/dartboard.svg')] bg-contain bg-center bg-no-repeat opacity-[0.07]" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/60 to-neutral-950/90" />
        </div>
        {children}
      </body>
    </html>
  );
}
