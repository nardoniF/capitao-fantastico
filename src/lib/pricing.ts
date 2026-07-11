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
