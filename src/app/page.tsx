import { CaptainQuiz } from "@/components/CaptainQuiz";
import { CaptainSectionNav } from "@/components/CaptainSectionNav";
import { Hero } from "@/components/Hero";
import { JsonLdHome } from "@/components/JsonLd";
import { NicheSections } from "@/components/NicheSections";
import { Policies } from "@/components/Policies";
import { ProductShowcase } from "@/components/ProductShowcase";
import { SiteHeader } from "@/components/SiteHeader";
import { listStorefrontProducts } from "@/lib/catalog";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: `${siteConfig.brand} — ${siteConfig.tagline}`,
  description: siteConfig.positioning,
  path: "/",
  image: "/brand/logo.png",
});

export default async function HomePage() {
  const fromDb = await listStorefrontProducts();
  const quizProducts = fromDb.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    blurb: p.blurb,
    price: p.price,
    image: p.image,
    category: p.category,
    approved: p.approved,
    isNew: p.isNew,
  }));

  const jsonLdProducts = fromDb.slice(0, 8).map((p) => ({
    name: p.name,
    blurb: p.blurb,
    image: p.image,
    price: p.price,
    slug: p.slug,
    inStock: p.variants.some((v) => v.stock > 0),
  }));

  return (
    <>
      <JsonLdHome products={jsonLdProducts} />
      <SiteHeader variant="hero" />
      <Hero />
      <CaptainSectionNav />
      <CaptainQuiz products={quizProducts} />
      <NicheSections />
      <ProductShowcase />
      <Policies />
    </>
  );
}
