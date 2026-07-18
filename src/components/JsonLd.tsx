import { faqItems } from "@/data/content";
import { siteConfig } from "@/lib/site-config";
import { absoluteUrl, productAvailability } from "@/lib/seo";

type ProductSnippet = {
  name: string;
  blurb: string;
  image: string;
  price: number;
  slug: string;
  inStock?: boolean;
};

export function JsonLdHome({ products = [] }: { products?: ProductSnippet[] }) {
  const base = absoluteUrl("/");

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}#organization`,
        name: siteConfig.brand,
        legalName: siteConfig.company,
        url: base,
        email: siteConfig.email,
        taxID: siteConfig.cnpj,
        sameAs: [siteConfig.social.instagram],
      },
      {
        "@type": "OnlineStore",
        "@id": `${base}#store`,
        name: siteConfig.brand,
        url: base,
        description: siteConfig.positioning,
        priceRange: "$$",
        currenciesAccepted: "BRL",
        paymentAccepted: "Pix, Cartão de crédito, Cartão de débito",
        areaServed: { "@type": "Country", name: "Brasil" },
        parentOrganization: { "@id": `${base}#organization` },
      },
      {
        "@type": "WebSite",
        "@id": `${base}#website`,
        name: siteConfig.brand,
        url: base,
        publisher: { "@id": `${base}#organization` },
        inLanguage: "pt-BR",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${absoluteUrl("/produtos")}?q={search_term_string}`,
          },
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
      ...products.slice(0, 8).map((p) => ({
        "@type": "Product",
        name: p.name,
        description: p.blurb,
        image: p.image,
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: p.price.toFixed(2),
          availability: productAvailability(p.inStock !== false),
          url: absoluteUrl(`/produtos/${p.slug}`),
          seller: { "@id": `${base}#store` },
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

export function JsonLdProduct({
  name,
  description,
  image,
  price,
  slug,
  inStock,
  category,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  slug: string;
  inStock: boolean;
  category?: string;
}) {
  const url = absoluteUrl(`/produtos/${slug}`);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    category,
    url,
    brand: { "@type": "Brand", name: siteConfig.brand },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: price.toFixed(2),
      availability: productAvailability(inStock),
      url,
      seller: {
        "@type": "OnlineStore",
        name: siteConfig.brand,
        url: absoluteUrl("/"),
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
