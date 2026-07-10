import { AppShell } from "@/components/AppShell";
import { CartProvider } from "@/components/CartProvider";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.brand} — Utilidades do lar e tecnologia inteligente`,
    template: `%s · ${siteConfig.brand}`,
  },
  description: siteConfig.slogan,
  icons: {
    icon: [{ url: "/brand/favicon-f.png", type: "image/png" }],
    apple: [{ url: "/brand/apple-touch-icon.png" }],
  },
  openGraph: {
    title: siteConfig.brand,
    description: siteConfig.slogan,
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <CartProvider>
          <AppShell>{children}</AppShell>
        </CartProvider>
      </body>
    </html>
  );
}
