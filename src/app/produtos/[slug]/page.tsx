import { AddToCartButtons } from "@/components/AddToCartButtons";
import { formatBRL, getProductBySlug, products } from "@/data/products";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Produto" };
  return { title: product.name, description: product.blurb };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="bg-bg py-10 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-12 md:gap-12 md:px-8">
        {/* Produto grande — destaque visual */}
        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="aspect-[4/5] w-full object-cover md:aspect-square md:min-h-[560px]"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center md:col-span-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            {product.category === "tech"
              ? "Tecnologia inteligente"
              : "Utilidades do lar"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-5xl">
            {product.name}
          </h1>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-bold text-gold">
              {formatBRL(product.price)}
            </span>
            {product.compareAt ? (
              <span className="text-lg text-muted line-through">
                {formatBRL(product.compareAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
            {product.description}
          </p>
          <AddToCartButtons productId={product.id} />
          <p className="mt-6 text-sm text-muted">
            Frete sob consulta no WhatsApp · Pix e cartão via Mercado Pago
          </p>
        </div>
      </div>
    </div>
  );
}
