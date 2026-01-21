import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Time Series Analysis - Quarterly Sales",
  description: "Time Series Analysis - Quarterly Sales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
