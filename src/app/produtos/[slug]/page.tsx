import { ApprovedSeal } from "@/components/ApprovedSeal";
import { CaptainMedals, medalsForProduct } from "@/components/CaptainMedals";
import { CaptainStrip } from "@/components/CaptainStrip";
import { ProductDetailsAccordion } from "@/components/ProductDetailsAccordion";
import { ProductPurchase } from "@/components/ProductPurchase";
import {
  categoryLabels,
  products as seedProducts,
} from "@/data/products";
import { getStorefrontBySlug, type StorefrontVariant } from "@/lib/catalog";
import type { ProductDetails } from "@/lib/product-details";
import { siteConfig } from "@/lib/site-config";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return seedProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fromDb = await getStorefrontBySlug(slug);
  const product = fromDb ?? seedProducts.find((p) => p.slug === slug);
  if (!product) return { title: "Produto" };
  const title =
    ("seoTitle" in product && product.seoTitle) || product.name;
  const description =
    ("seoDescription" in product && product.seoDescription) || product.blurb;
  return {
    title: String(title),
    description: String(description),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const fromDb = await getStorefrontBySlug(slug);
  const seed = seedProducts.find((p) => p.slug === slug);
  const product = fromDb
    ? fromDb
    : seed
      ? {
          ...seed,
          gallery: [seed.image] as string[],
          details: {} as ProductDetails,
          variants: [] as StorefrontVariant[],
          videoUrl: null as string | null,
          seoTitle: null as string | null,
          seoDescription: null as string | null,
        }
      : null;
  if (!product) notFound();

  const details: ProductDetails =
    "details" in product && product.details ? product.details : {};
  const gallery =
    "gallery" in product && product.gallery.length
      ? product.gallery
      : [product.image];
  const sizes = details.sizes ?? [];
  const colors = details.colors ?? [];
  const variants: StorefrontVariant[] =
    "variants" in product ? [...product.variants] : [];
  const videoUrl = "videoUrl" in product ? product.videoUrl : null;
  const medals = medalsForProduct({
    approved: product.approved,
    isNew: product.isNew,
    rating: product.rating,
    price: product.price,
  });

  return (
    <div className="bg-bg py-8 md:py-12">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <div className="mb-6">
          <CaptainStrip message="Produto curado pelo Capitão — suporte em português e rastreio no site até chegar." />
        </div>

        <p className="mb-6 text-sm text-muted">
          <Link href="/produtos" className="hover:text-gold">
            Produtos
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">{product.name}</span>
        </p>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">
            {categoryLabels[product.category]}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
            {product.name}
          </h1>
          {product.approved ? (
            <div className="mt-4 space-y-3">
              <ApprovedSeal score={siteConfig.captainScore} />
              <CaptainMedals medals={medals} />
            </div>
          ) : null}
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#aaa]">
            {product.blurb}
          </p>

          {details.highlights?.length ? (
            <ul className="mt-5 max-w-2xl space-y-2">
              {details.highlights.slice(0, 4).map((h) => (
                <li key={h} className="flex gap-2 text-sm text-[#ccc]">
                  <span className="text-gold" aria-hidden>
                    ✓
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <ProductPurchase
          productId={product.id}
          name={product.name}
          gallery={gallery}
          price={product.price}
          compareAt={product.compareAt}
          sizes={sizes}
          colors={colors}
          sizeRequired={sizes.length > 0}
          variants={variants}
        />

        {videoUrl ? (
          <div id="video-capitao" className="mt-10">
            <h2 className="mb-3 font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Veja funcionando
            </h2>
            <div className="overflow-hidden rounded-[14px] border border-[#333] bg-black">
              <video
                src={videoUrl}
                controls
                playsInline
                className="aspect-video w-full"
                poster={gallery[0]}
              >
                Seu navegador não reproduz vídeo.
              </video>
            </div>
          </div>
        ) : null}

        <ProductDetailsAccordion
          description={product.description}
          details={details}
          productName={product.name}
        />
      </div>
    </div>
  );
}
