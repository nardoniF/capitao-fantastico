import { ApprovedSeal } from "@/components/ApprovedSeal";
import { ProductDetailsAccordion } from "@/components/ProductDetailsAccordion";
import { ProductPurchase } from "@/components/ProductPurchase";
import {
  categoryLabels,
  products as seedProducts,
} from "@/data/products";
import { getStorefrontBySlug, type StorefrontVariant } from "@/lib/catalog";
import type { ProductDetails } from "@/lib/product-details";
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

  return (
    <div className="bg-bg py-8 md:py-12">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
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
            <div className="mt-4">
              <ApprovedSeal />
            </div>
          ) : null}
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#aaa]">
            {product.blurb}
          </p>

          {details.useCases?.length ? (
            <div className="mt-5 max-w-2xl rounded-[14px] border border-[#333] bg-[#141414] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Casos de uso
              </p>
              <ul className="mt-2 space-y-1.5">
                {details.useCases.slice(0, 4).map((u) => (
                  <li key={u} className="flex gap-2 text-sm text-[#ccc]">
                    <span className="text-gold" aria-hidden>
                      →
                    </span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {details.highlights?.length ? (
            <ul className="mt-5 max-w-2xl space-y-2">
              {details.highlights.map((h) => (
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
          <div className="mt-10">
            <h2 className="mb-3 font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Vídeo do produto
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
        />
      </div>
    </div>
  );
}
