import { CaptainQuiz } from "@/components/CaptainQuiz";
import { CaptainSectionNav } from "@/components/CaptainSectionNav";
import { Hero } from "@/components/Hero";
import { JsonLdHome } from "@/components/JsonLd";
import { NicheSections } from "@/components/NicheSections";
import { Policies } from "@/components/Policies";
import { ProductShowcase } from "@/components/ProductShowcase";
import { SiteHeader } from "@/components/SiteHeader";
import { listStorefrontProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <JsonLdHome />
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
