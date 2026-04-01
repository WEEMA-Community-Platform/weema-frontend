import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "WEEMA Facilitator",
  description: "WEEMA Community Platform Facilitator Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={lato.variable}>
      <body className="antialiased font-medium font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
