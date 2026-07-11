/**
 * Calcula preço de venda BRL a partir do custo do fornecedor.
 * Nunca use valor fixo como fonte da verdade — sempre recalcule no sync.
 */
export type PricingInput = {
  supplierPrice: number;
  shippingEstimate?: number;
  currency?: string;
  markup: number;
  fxBrl: number;
  feePct?: number;
};

export type PricingResult = {
  costBrl: number;
  withFees: number;
  salePrice: number;
  compareAt: number;
};

/** Margem mínima em BRL após custo+frete+taxas (env MIN_MARGIN_BRL). */
export function minMarginBrl() {
  const n = Number(process.env.MIN_MARGIN_BRL || 20);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

/** Undercut vs mercado (padrão 3%). */
export function marketUndercutPct() {
  const n = Number(process.env.MARKET_UNDERCUT_PCT || 0.03);
  return Number.isFinite(n) && n > 0 && n < 0.5 ? n : 0.03;
}

/** Arredonda para x,90 (preço de vitrine) */
export function roundStorePrice(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const floored = Math.floor(value);
  return floored + 0.9;
}

export function calculateSalePrice(input: PricingInput): PricingResult {
  const shipping = input.shippingEstimate ?? 0;
  const feePct = input.feePct ?? 0.05;
  const fx = input.currency === "BRL" ? 1 : input.fxBrl;

  const costBrl = (input.supplierPrice + shipping) * fx;
  const withFees = costBrl * (1 + feePct);
  const rawSale = withFees * input.markup;
  const salePrice = roundStorePrice(rawSale);
  const compareAt = roundStorePrice(salePrice * 1.35);

  return {
    costBrl: Number(costBrl.toFixed(2)),
    withFees: Number(withFees.toFixed(2)),
    salePrice,
    compareAt,
  };
}

export type PriceToWinInput = PricingInput & {
  /** Menor preço de referência no mercado BR (ex. Mercado Livre) */
  marketRef?: number | null;
};

export type PriceToWinResult = PricingResult & {
  ok: boolean;
  reason?: string;
  profitBrl: number;
  usedMarket: boolean;
};

/**
 * Preço para ganhar: markup interno, mas se houver mercado,
 * joga 3% abaixo — desde que sobra margem mínima.
 */
export function priceToWin(input: PriceToWinInput): PriceToWinResult {
  const base = calculateSalePrice(input);
  const minM = minMarginBrl();
  const undercut = marketUndercutPct();
  const marketRef =
    input.marketRef != null && input.marketRef > 0 ? input.marketRef : null;

  let salePrice = base.salePrice;
  let usedMarket = false;

  if (marketRef) {
    const ceiling = roundStorePrice(marketRef * (1 - undercut));
    if (ceiling > 0) {
      salePrice = Math.min(salePrice, ceiling);
      usedMarket = true;
    }
  }

  const profitBrl = Number((salePrice - base.withFees).toFixed(2));
  if (profitBrl < minM) {
    return {
      ...base,
      salePrice,
      compareAt: marketRef
        ? roundStorePrice(Math.max(marketRef, salePrice * 1.15))
        : base.compareAt,
      ok: false,
      reason: `Margem R$ ${profitBrl.toFixed(2)} < mínima R$ ${minM.toFixed(2)}`,
      profitBrl,
      usedMarket,
    };
  }

  return {
    ...base,
    salePrice,
    compareAt: marketRef
      ? roundStorePrice(Math.max(marketRef, salePrice * 1.15))
      : roundStorePrice(salePrice * 1.35),
    ok: true,
    profitBrl,
    usedMarket,
  };
}
