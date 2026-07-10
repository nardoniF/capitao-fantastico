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
    <div className="bg-paper py-12 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:gap-14 md:px-8">
        <div className="overflow-hidden rounded-sm bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover md:aspect-[4/5]"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal-deep">
            {product.category === "tech"
              ? "Tecnologia inteligente"
              : "Utilidades do lar"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-ink md:text-4xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-ink">
              {formatBRL(product.price)}
            </span>
            {product.compareAt ? (
              <span className="text-ink/40 line-through">
                {formatBRL(product.compareAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-6 text-base leading-relaxed text-ink-soft/90">
            {product.description}
          </p>
          <AddToCartButtons productId={product.id} />
          <p className="mt-6 text-sm text-ink/50">
            Frete sob consulta no WhatsApp · Pix e cartão via Mercado Pago
          </p>
        </div>
      </div>
    </div>
  );
}
