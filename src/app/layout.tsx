import { AppShell } from "@/components/AppShell";
import { CartProvider } from "@/components/CartProvider";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { seoKeywords, siteUrl } from "@/lib/seo";
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

const defaultTitle = `${siteConfig.brand} — Loja online curada · ${siteConfig.catalogTarget} produtos aprovados`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: defaultTitle,
    template: `%s · ${siteConfig.brand}`,
  },
  description: siteConfig.positioning,
  keywords: [...seoKeywords],
  applicationName: siteConfig.brand,
  authors: [{ name: siteConfig.company, url: siteUrl() }],
  creator: siteConfig.brand,
  publisher: siteConfig.company,
  category: "shopping",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/brand/favicon-f.png", type: "image/png" }],
    apple: [{ url: "/brand/apple-touch-icon.png" }],
  },
  openGraph: {
    title: defaultTitle,
    description: siteConfig.positioning,
    url: siteUrl(),
    siteName: siteConfig.brand,
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand/logo.png", alt: siteConfig.brand }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteConfig.tagline,
    images: ["/brand/logo.png"],
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
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
