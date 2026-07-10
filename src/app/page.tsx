import { Hero } from "@/components/Hero";
import { JsonLdHome } from "@/components/JsonLd";
import { NicheSections } from "@/components/NicheSections";
import { Policies } from "@/components/Policies";
import { ProductShowcase } from "@/components/ProductShowcase";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <JsonLdHome />
      <SiteHeader variant="hero" />
      <Hero />
      <NicheSections />
      <ProductShowcase />
      <Policies />
    </>
  );
}
