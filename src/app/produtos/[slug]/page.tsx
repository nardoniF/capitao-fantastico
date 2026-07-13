import { ApprovedSeal } from "@/components/ApprovedSeal";
import { medalsForProduct } from "@/components/CaptainMedals";
import { ProductDetailsAccordion } from "@/components/ProductDetailsAccordion";
import { ProductPurchase } from "@/components/ProductPurchase";
import { captainScoreFor } from "@/data/captain";
import { categoryLabels } from "@/data/products";
import { getStorefrontBySlug, type StorefrontVariant } from "@/lib/catalog";
import type { ProductDetails } from "@/lib/product-details";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontBySlug(slug);
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
  const product = fromDb;
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
  // Blurbs que são só ficha técnica (Cores/Tamanhos/SKU) já aparecem no
  // acordeão "Medidas, cores e tamanhos" — não repetir no topo.
  const blurbIsSpecBlob = /^(cores|tamanhos)\s*:|sku\s*:/i.test(
    product.blurb.trim(),
  );

  return (
    <div className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-[1100px] px-6 md:px-10 lg:px-12">
        <p className="mb-6 text-sm text-muted">
          <Link href="/produtos" className="hover:text-gold">
            Produtos
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">{product.name}</span>
        </p>

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">
            {categoryLabels[product.category]}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
            {product.name}
          </h1>
          {product.blurb && !blurbIsSpecBlob ? (
            <p className="mt-3 max-w-3xl text-lg font-medium leading-relaxed text-white">
              {product.blurb}
            </p>
          ) : null}
        </div>

        {product.approved ? (
          <div className="mb-8">
            <ApprovedSeal
              wide
              score={captainScoreFor(product.slug)}
              medals={medals}
            />
          </div>
        ) : null}

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
          <div id="video-capitao" className="mt-12 md:mt-14">
            <h2 className="mb-4 font-[family-name:var(--font-syne)] text-xl font-bold text-white">
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
