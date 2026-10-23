import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma collecte · Saint-Augustin",
  description: "Calendrier des collectes et rappels Telegram à Saint-Augustin-de-Desmaures.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CA">
      <body className="antialiased">{children}</body>
    </html>
  );
}
