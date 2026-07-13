import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { captainScoreFor } from "@/data/captain";
import {
  categoryLabels,
  categoryOrder,
  type ProductCategory,
} from "@/data/products";
import { listStorefrontProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos — Os 200 mais bem avaliados",
};

type Props = {
  searchParams: Promise<{
    cat?: string;
    novidades?: string;
    preco?: string;
    ordem?: string;
    q?: string;
  }>;
};

function isCategory(v: string | undefined): v is ProductCategory {
  return Boolean(v && categoryOrder.includes(v as ProductCategory));
}

/** Busca sem acento e sem caixa. */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `/produtos?${s}` : "/produtos";
}

const ORDER_OPTIONS = [
  { id: "nota", label: "Melhor nota" },
  { id: "preco-menor", label: "Menor preço" },
  { id: "preco-maior", label: "Maior preço" },
] as const;

const PRICE_OPTIONS = [
  { id: "50", label: "Até R$50" },
  { id: "100", label: "Até R$100" },
] as const;

export default async function ProductsPage({ searchParams }: Props) {
  const q = await searchParams;
  const products = await listStorefrontProducts();

  const onlyNew = q.novidades === "1";
  const cat = isCategory(q.cat) ? q.cat : null;
  const preco = q.preco === "50" || q.preco === "100" ? q.preco : null;
  const ordem = ORDER_OPTIONS.some((o) => o.id === q.ordem) ? q.ordem : null;
  const busca = (q.q || "").trim().slice(0, 60);

  let filtered = products;
  if (onlyNew) filtered = filtered.filter((p) => p.isNew);
  if (cat) filtered = filtered.filter((p) => p.category === cat);
  if (preco) filtered = filtered.filter((p) => p.price <= Number(preco));
  if (busca) {
    const nq = normalize(busca);
    filtered = filtered.filter(
      (p) =>
        normalize(p.name).includes(nq) ||
        normalize(p.blurb || "").includes(nq) ||
        normalize(categoryLabels[p.category] || "").includes(nq),
    );
  }

  if (ordem === "preco-menor") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (ordem === "preco-maior") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (ordem === "nota") {
    filtered = [...filtered].sort(
      (a, b) => captainScoreFor(b.slug) - captainScoreFor(a.slug),
    );
  }

  const title = busca
    ? `Busca: "${busca}"`
    : onlyNew
      ? "Novidades do Capitão"
      : preco
        ? `Achados até R$${preco}`
        : cat
          ? categoryLabels[cat]
          : "Os 200 mais bem avaliados";

  // Estado atual (para os links de filtro manterem o resto da seleção)
  const current = {
    cat: cat || undefined,
    novidades: onlyNew ? "1" : undefined,
    preco: preco || undefined,
    ordem: ordem || undefined,
    q: busca || undefined,
  };

  const pillActive = "bg-gold text-black";
  const pillIdle =
    "border border-line text-muted hover:border-gold hover:text-gold";

  return (
    <div className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-[#888]">
          {busca || cat || preco || onlyNew
            ? `${filtered.length} ${filtered.length === 1 ? "produto" : "produtos"} · curadoria do Capitão`
            : `O Capitão garimpou a internet inteira e selecionou os ${products.length} produtos mais bem avaliados — todos com estoque e rastreio no site.`}
        </p>

        <form action="/produtos" method="get" className="mt-6 flex max-w-xl gap-2">
          {cat ? <input type="hidden" name="cat" value={cat} /> : null}
          {preco ? <input type="hidden" name="preco" value={preco} /> : null}
          {ordem ? <input type="hidden" name="ordem" value={ordem} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={busca}
            placeholder="Buscar produto pelo nome…"
            className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-2.5 text-sm text-white placeholder:text-[#666] focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Buscar
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/produtos"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !cat && !onlyNew && !preco && !busca ? pillActive : pillIdle
            }`}
          >
            Todos
          </Link>
          {PRICE_OPTIONS.map((p) => (
            <Link
              key={p.id}
              href={buildQuery({
                ...current,
                preco: preco === p.id ? undefined : p.id,
              })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                preco === p.id ? pillActive : pillIdle
              }`}
            >
              {p.label}
            </Link>
          ))}
          <Link
            href={buildQuery({
              ...current,
              novidades: onlyNew ? undefined : "1",
            })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              onlyNew ? pillActive : pillIdle
            }`}
          >
            Novidades
          </Link>
          {categoryOrder.map((c) => (
            <Link
              key={c}
              href={buildQuery({
                ...current,
                cat: cat === c ? undefined : c,
              })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                cat === c ? pillActive : pillIdle
              }`}
            >
              {categoryLabels[c]}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#777]">
            Ordenar:
          </span>
          {ORDER_OPTIONS.map((o) => (
            <Link
              key={o.id}
              href={buildQuery({
                ...current,
                ordem: ordem === o.id ? undefined : o.id,
              })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                ordem === o.id ? pillActive : pillIdle
              }`}
            >
              {o.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-muted">
            {busca
              ? `Nada encontrado para "${busca}". Tente outra palavra ou navegue pelas categorias acima.`
              : "O Capitão está repondo a vitrine com itens que têm estoque agora. Volte em breve."}{" "}
            <Link href="/sugestoes" className="text-gold hover:underline">
              Sugerir um produto
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
