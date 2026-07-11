import { AddToCartButtons } from "@/components/AddToCartButtons";
import { ApprovedSeal } from "@/components/ApprovedSeal";
import { ProductDetailsAccordion } from "@/components/ProductDetailsAccordion";
import { ProductGallery } from "@/components/ProductGallery";
import {
  categoryLabels,
  formatBRL,
  products as seedProducts,
} from "@/data/products";
import { getStorefrontBySlug } from "@/lib/catalog";
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
  return { title: product.name, description: product.blurb };
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
          gallery: [seed.image],
          details: {},
        }
      : null;
  if (!product) notFound();

  const details = "details" in product ? product.details : {};
  const gallery =
    "gallery" in product && product.gallery.length
      ? product.gallery
      : [product.image];
  const sizes = details.sizes ?? [];

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

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <ProductGallery images={gallery} alt={product.name} />

          <div className="flex flex-col">
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

            <p className="mt-4 text-base leading-relaxed text-[#aaa]">
              {product.blurb}
            </p>

            {details.useCases?.length ? (
              <div className="mt-5 rounded-[14px] border border-[#333] bg-[#141414] p-4">
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
              <ul className="mt-5 space-y-2">
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

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gold">
                {formatBRL(product.price)}
              </span>
              {product.compareAt ? (
                <span className="text-lg text-[#666] line-through">
                  {formatBRL(product.compareAt)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted">
              Preço da unidade · frete calculado após o pedido
            </p>

            <AddToCartButtons
              productId={product.id}
              sizes={sizes}
              colors={details.colors ?? []}
              sizeRequired={sizes.length > 0}
            />

            <p className="mt-5 text-sm text-[#666]">
              Frete calculado após o pedido · Pix / cartão via Mercado Pago
            </p>
          </div>
        </div>

        <ProductDetailsAccordion
          description={product.description}
          details={details}
        />
      </div>
    </div>
  );
}
