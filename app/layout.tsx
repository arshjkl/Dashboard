import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BGMI Arena",
  description:
    "Competitive BGMI team command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="tactical-app">
        {children}
      </body>
    </html>
  );
}