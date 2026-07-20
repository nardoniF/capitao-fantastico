/** Produção com Postgres configurado — nunca mostrar catálogo demo. */
export function usesProductionDatabase() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function isProductionRuntime() {
  return (
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV)
  );
}

export function mustUseDatabaseCatalog() {
  return usesProductionDatabase() && isProductionRuntime();
}
