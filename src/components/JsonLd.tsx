import { faqItems } from "@/data/content";
import { siteConfig } from "@/lib/site-config";
import { products } from "@/data/products";

export function JsonLdHome() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.capitaofantastico.com.br";

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteConfig.brand,
        url: base,
        email: siteConfig.email,
        legalName: siteConfig.company,
        taxID: siteConfig.cnpj,
      },
      {
        "@type": "WebSite",
        name: siteConfig.brand,
        url: base,
        potentialAction: {
          "@type": "SearchAction",
          target: `${base}/produtos`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      ...products.slice(0, 4).map((p) => ({
        "@type": "Product",
        name: p.name,
        description: p.blurb,
        image: p.image,
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: p.price.toFixed(2),
          availability: "https://schema.org/InStock",
          url: `${base}/produtos/${p.slug}`,
        },
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
