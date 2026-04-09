import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next"

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "WEEMA Admin",
  description: "WEEMA Community Platform Admin Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={lato.variable}>
      <body suppressHydrationWarning className="antialiased font-medium font-sans">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
