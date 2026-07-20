/** Loja em manutenção — ative MAINTENANCE_MODE=1 na Vercel. */
export function isMaintenanceMode() {
  const v = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
