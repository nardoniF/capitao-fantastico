import { prisma } from "@/lib/db";
import { calculateSalePrice } from "@/lib/pricing";
import { listClicks, listOrders } from "@/lib/store-db";
import { listFeedback } from "@/lib/feedback";

export type PricingSnapshot = {
  markup: number;
  fxBrl: number;
  feePct: number;
  ruleId?: string;
};

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  active: boolean;
  imageUrl: string;
  /** Custo fornecedor USD */
  costUsd: number;
  shippingUsd: number;
  /** Custo estimado BRL (produto+frete×câmbio) */
  costBrl: number;
  /** Custo + taxa embutida no pricing */
  costWithFeesBrl: number;
  /** Preço cobrado na vitrine */
  salePrice: number;
  compareAt: number | null;
  /** Margem bruta antes de MP na venda unitária */
  marginBrl: number;
  marginPct: number;
  /** Comissão líquida estimada após taxa MP sobre o preço de venda */
  netAfterMpBrl: number;
  mpFeeBrl: number;
};

export type AdminOrderEconomics = {
  orderId: string;
  createdAt: string;
  status: string;
  nome: string;
  email: string;
  /** O que o cliente pagou */
  charged: number;
  /** Custo estimado dos itens (BRL) */
  costPaid: number;
  /** Taxa Mercado Pago estimada */
  mpFee: number;
  /** O que sobra pra você */
  commission: number;
  items: { name: string; qty: number; unitPrice: number; unitCostBrl: number }[];
  paymentRef?: string;
  supplierTracking?: string;
};

async function getPricing(): Promise<PricingSnapshot> {
  if (!process.env.DATABASE_URL) {
    return {
      markup: Number(process.env.PRICING_MARKUP || 2.3),
      fxBrl: Number(process.env.PRICING_FX_BRL || 5.6),
      feePct: 0.05,
    };
  }
  const rule = await prisma.pricingRule.findFirst({ where: { active: true } });
  if (!rule) {
    return {
      markup: Number(process.env.PRICING_MARKUP || 2.3),
      fxBrl: Number(process.env.PRICING_FX_BRL || 5.6),
      feePct: 0.05,
    };
  }
  return {
    ruleId: rule.id,
    markup: Number(rule.markup),
    fxBrl: Number(rule.fxBrl),
    feePct: Number(rule.feePct),
  };
}

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  const pricing = await getPricing();
  if (!process.env.DATABASE_URL) return [];

  const rows = await prisma.product.findMany({
    include: { supplierProduct: true },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((p) => {
    const costUsd = Number(p.supplierProduct?.supplierPrice || 0);
    const shippingUsd = Number(p.supplierProduct?.shippingEstimate || 0);
    const priced = calculateSalePrice({
      supplierPrice: costUsd,
      shippingEstimate: shippingUsd,
      currency: p.supplierProduct?.currency || "USD",
      markup: pricing.markup,
      fxBrl: pricing.fxBrl,
      feePct: pricing.feePct,
    });
    const salePrice = Number(p.salePrice);
    const mpFeeBrl = Number((salePrice * pricing.feePct).toFixed(2));
    const netAfterMpBrl = Number((salePrice - priced.costBrl - mpFeeBrl).toFixed(2));
    const marginBrl = Number((salePrice - priced.costBrl).toFixed(2));
    const marginPct =
      salePrice > 0 ? Number(((marginBrl / salePrice) * 100).toFixed(1)) : 0;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      active: p.active,
      imageUrl: p.imageUrl,
      costUsd,
      shippingUsd,
      costBrl: priced.costBrl,
      costWithFeesBrl: priced.withFees,
      salePrice,
      compareAt: p.compareAt != null ? Number(p.compareAt) : null,
      marginBrl,
      marginPct,
      netAfterMpBrl,
      mpFeeBrl,
    };
  });
}

export async function listAdminOrders(): Promise<AdminOrderEconomics[]> {
  const pricing = await getPricing();
  const products = await listAdminProducts();
  const byId = new Map(products.map((p) => [p.id, p]));
  const orders = await listOrders();

  return orders.map((o) => {
    const items = o.items.map((it) => {
      const p = byId.get(it.productId);
      const unitCostBrl = p?.costBrl ?? 0;
      return {
        name: it.name,
        qty: it.qty,
        unitPrice: it.price,
        unitCostBrl,
      };
    });
    const charged = o.total;
    const costPaid = Number(
      items.reduce((s, it) => s + it.unitCostBrl * it.qty, 0).toFixed(2),
    );
    const mpFee = Number((charged * pricing.feePct).toFixed(2));
    const commission = Number((charged - costPaid - mpFee).toFixed(2));

    return {
      orderId: o.orderId,
      createdAt: o.createdAt,
      status: o.status,
      nome: o.nome,
      email: o.email,
      charged,
      costPaid,
      mpFee,
      commission,
      items,
      paymentRef: o.paymentRef,
      supplierTracking: o.supplierTracking,
    };
  });
}

export async function getAdminApiStatus() {
  const checks: { name: string; ok: boolean; detail: string }[] = [];

  checks.push({
    name: "DATABASE_URL (Neon)",
    ok: Boolean(process.env.DATABASE_URL),
    detail: process.env.DATABASE_URL ? "Configurado" : "Ausente",
  });

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const n = await prisma.product.count();
      checks.push({
        name: "Postgres",
        ok: true,
        detail: `OK · ${n} produtos`,
      });
    } catch (e) {
      checks.push({
        name: "Postgres",
        ok: false,
        detail: e instanceof Error ? e.message : "Falha",
      });
    }
  }

  checks.push({
    name: "CJ_API_KEY",
    ok: Boolean(process.env.CJ_API_KEY || process.env.CJ_ACCESS_TOKEN),
    detail: process.env.CJ_API_KEY || process.env.CJ_ACCESS_TOKEN ? "Configurado" : "Ausente",
  });

  if (process.env.CJ_API_KEY || process.env.CJ_ACCESS_TOKEN) {
    try {
      const { getCJSupplier } = await import("@/lib/suppliers/cj");
      await getCJSupplier().ensureAuth();
      checks.push({ name: "CJ auth", ok: true, detail: "Token OK" });
    } catch (e) {
      checks.push({
        name: "CJ auth",
        ok: false,
        detail: e instanceof Error ? e.message : "Falha",
      });
    }
  }

  checks.push({
    name: "MP_ACCESS_TOKEN",
    ok: Boolean(process.env.MP_ACCESS_TOKEN),
    detail: process.env.MP_ACCESS_TOKEN ? "Configurado (checkout real)" : "Ausente (checkout demo)",
  });

  checks.push({
    name: "ADMIN_PASSWORD",
    ok: Boolean(process.env.ADMIN_PASSWORD),
    detail: process.env.ADMIN_PASSWORD ? "Configurado" : "Ausente",
  });

  checks.push({
    name: "UPSTASH_REDIS",
    ok: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    detail:
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? "Configurado"
        : "Opcional — pedidos/cliques em memória/disco",
  });

  return checks;
}

export async function getAdminBundle() {
  const pricing = await getPricing();
  const [products, orders, clicks, feedback, api] = await Promise.all([
    listAdminProducts(),
    listAdminOrders(),
    listClicks(),
    process.env.DATABASE_URL ? listFeedback() : Promise.resolve([]),
    getAdminApiStatus(),
  ]);

  return {
    pricing,
    products,
    orders,
    clicks: clicks.slice(0, 300),
    feedback,
    api,
    updatedAt: new Date().toISOString(),
  };
}

export async function updatePricingRule(input: {
  markup?: number;
  fxBrl?: number;
  feePct?: number;
}) {
  const current = await getPricing();
  const markup = input.markup ?? current.markup;
  const fxBrl = input.fxBrl ?? current.fxBrl;
  const feePct = input.feePct ?? current.feePct;

  if (current.ruleId) {
    return prisma.pricingRule.update({
      where: { id: current.ruleId },
      data: { markup, fxBrl, feePct, active: true },
    });
  }
  return prisma.pricingRule.create({
    data: { name: "default", markup, fxBrl, feePct, active: true },
  });
}

export async function updateNeonProduct(
  id: string,
  patch: { salePrice?: number; active?: boolean; name?: string; blurb?: string },
) {
  return prisma.product.update({
    where: { id },
    data: {
      ...(patch.salePrice != null ? { salePrice: patch.salePrice } : {}),
      ...(patch.active != null ? { active: patch.active } : {}),
      ...(patch.name != null ? { name: patch.name } : {}),
      ...(patch.blurb != null ? { blurb: patch.blurb } : {}),
    },
  });
}

export { getPricing };
