import { AddToCartButtons } from "@/components/AddToCartButtons";
import { ApprovedSeal } from "@/components/ApprovedSeal";
import { ProductImage } from "@/components/ProductImage";
import {
  categoryLabels,
  formatBRL,
  products as seedProducts,
} from "@/data/products";
import { getStorefrontBySlug } from "@/lib/catalog";
import type { Metadata } from "next";
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
  const product = fromDb ?? seedProducts.find((p) => p.slug === slug);
  if (!product) notFound();

  return (
    <div className="bg-bg py-8 md:py-12">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-6">
        <div className="overflow-hidden rounded-[14px] border border-[#333] bg-[#1a1a1a]">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
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
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gold">
              {formatBRL(product.price)}
            </span>
            {product.compareAt ? (
              <span className="text-lg text-[#666] line-through">
                {formatBRL(product.compareAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-5 text-base leading-relaxed text-[#888]">
            {product.description}
          </p>
          <AddToCartButtons productId={product.id} />
          <p className="mt-5 text-sm text-[#666]">
            Frete calculado após o pedido · Pix / cartão via Mercado Pago
          </p>
        </div>
      </div>
    </div>
  );
}
