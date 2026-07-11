/**
 * Relocaliza produtos CJ já importados que ainda estão em inglês.
 * Uso: npx tsx --env-file=.env.local scripts/relocalize-en-products.ts
 */
import { prisma } from "../src/lib/db";
import { appendImportLog } from "../src/lib/import-log";
import { importCJProductFull } from "../src/lib/suppliers/import-cj";

const KEEP_PT = new Set([
  "comedouro-elevado-duplo-caes",
  "colete-salva-vidas-pet",
  "sabonete-facial-escova-silicone",
  "tapete-protetor-pet-carro",
  "massageador-eletrico-2-em-1",
  "desengordurante-po-cozinha",
  "vedante-impermeavel-cozinha-banheiro",
  "kit-limpeza-11-em-1",
  "aspirador-portatil-sem-fio",
  "sofa-inflavel-camping",
  "ventilador-mao-spray",
]);

function needsRelocalize(name: string, slug: string) {
  if (KEEP_PT.has(slug)) return false;
  const hasAccent = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(name);
  if (hasAccent) return false;
  // Títulos tipicamente EN da CJ / auto-import
  return /\b(portable|wireless|electric|automatic|creative|gaming|winter|board|slicer|feeder|blender|jacket|keyboard|washer|juicer|usb|led|pet|mini|fruit|vegetable|heated|luminous|message|mandoline|dispenser|mixer|rechargeable)\b/i.test(
    name,
  ) || /^[A-Za-z0-9]/.test(name) && name.split(" ").length >= 4;
}

async function main() {
  const rows = await prisma.product.findMany({
    where: { active: true, supplierProductId: { not: null } },
    include: { supplierProduct: true },
    orderBy: { createdAt: "asc" },
  });

  const targets = rows.filter(
    (p) =>
      p.supplierProduct?.externalId &&
      needsRelocalize(p.name, p.slug),
  );

  console.log(`Relocalizar ${targets.length} de ${rows.length} ativos`);

  let ok = 0;
  let fail = 0;

  for (const p of targets) {
    const pid = p.supplierProduct!.externalId;
    process.stdout.write(`→ ${p.slug.slice(0, 40)} … `);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const r = await importCJProductFull({
        cjProductId: pid,
        category: p.category,
        isNew: p.isNew,
      });
      await appendImportLog({
        source: "manual",
        status: "ok",
        message: `Relocalizado PT (batch) · gal ${r.galleryCount} · var ${r.variantCount}`,
        pid,
        productId: r.product.id,
        slug: r.product.slug,
        name: r.product.name,
      });
      console.log(`OK ${r.product.name.slice(0, 50)}`);
      ok += 1;
    } catch (e) {
      fail += 1;
      const msg = e instanceof Error ? e.message : "erro";
      console.log(`FAIL ${msg.slice(0, 80)}`);
      await appendImportLog({
        source: "manual",
        status: "error",
        message: `Relocalize: ${msg.slice(0, 180)}`,
        pid,
        slug: p.slug,
        name: p.name,
      });
    }
  }

  console.log(`DONE ok=${ok} fail=${fail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
