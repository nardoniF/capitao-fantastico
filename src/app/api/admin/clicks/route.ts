import { NextResponse } from "next/server";
import { buildClicksTree, clickStats } from "@/lib/clicks-tree";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { listClicks } from "@/lib/store-db";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const destino = (searchParams.get("destino") || "").trim();
  const tipo = (searchParams.get("tipo") || "").trim();
  const limit = Math.min(
    800,
    Math.max(20, parseInt(searchParams.get("limit") || "400", 10) || 400),
  );

  let loaded = await listClicks(2500);
  const total = loaded.length;

  const filtered = [];
  for (const row of loaded) {
    if (destino === "pageview") {
      if (row.tipo !== "pageview") continue;
    } else if (destino && row.destino !== destino) continue;
    if (tipo && row.tipo !== tipo) continue;
    if (q) {
      const hay = [
        row.rotulo,
        row.destino,
        row.destinoLabel,
        row.secao,
        row.pagina,
        row.visitanteId,
        row.sessaoVisita,
        row.referrer,
        row.tipo,
        row.ipPrefix,
        row.cidade,
        row.estado,
        row.pais,
        row.utmSource,
        row.origemTrafegoLabel,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) continue;
    }
    filtered.push(row);
    if (filtered.length >= limit) break;
  }

  const stats = clickStats(loaded);
  const tree = buildClicksTree(filtered);

  return NextResponse.json({
    clicks: filtered,
    tree,
    total,
    ...stats,
    checkedAt: new Date().toISOString(),
  });
}
