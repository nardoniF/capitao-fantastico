/**
 * Importa em lotes (regras do auto-import: top vendas + estoque real +
 * título/descrição em PT + todas as fotos) até atingir o teto do catálogo.
 *
 * Uso: npx tsx scripts/import-to-200.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { prisma } = await import("../src/lib/db");
  const { autoImportTopCjProducts } = await import(
    "../src/lib/suppliers/auto-import-cj"
  );
  const { catalogCap } = await import("../src/lib/import-log");

  const cap = catalogCap();
  console.log(`Teto do catálogo: ${cap}`);

  let round = 0;
  let stagnant = 0;

  while (true) {
    round += 1;
    const activeBefore = await prisma.product.count({
      where: { active: true },
    });
    if (activeBefore >= cap) {
      console.log(`\n✔ Meta atingida: ${activeBefore}/${cap} ativos.`);
      break;
    }

    // Rodadas seguintes varrem mais páginas da CJ para renovar o pool
    const pages = Math.min(1 + round, 5);
    console.log(
      `\n— Rodada ${round} · ativos ${activeBefore}/${cap} · páginas ${pages}`,
    );

    const r = await autoImportTopCjProducts({
      limit: 30,
      pages,
      source: "manual",
    });

    console.log(
      `   pool ${r.selected} · importados ${r.imported.length} · pulados ${r.skipped.length} · erros ${r.errors.length}`,
    );
    for (const p of r.imported) {
      console.log(`   + [${p.category}] R$${p.salePrice.toFixed(2)} ${p.name}`);
    }
    if (r.errors.length) {
      for (const e of r.errors.slice(0, 5)) {
        console.log(`   ! ${e.pid}: ${e.error.slice(0, 100)}`);
      }
    }

    if (r.imported.length === 0) {
      stagnant += 1;
      if (stagnant >= 3) {
        console.log(
          `\n✖ 3 rodadas sem progresso — pool esgotado com as regras atuais. Ativos: ${r.activeCount}/${cap}`,
        );
        break;
      }
    } else {
      stagnant = 0;
    }

    // Respiro entre rodadas (rate limit CJ)
    await new Promise((res) => setTimeout(res, 5000));
  }

  const finalActive = await prisma.product.count({ where: { active: true } });
  console.log(`\nFINAL: ${finalActive} produtos ativos.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
