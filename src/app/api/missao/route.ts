import { NextResponse } from "next/server";
import {
  recordMissionResponse,
  type MissionResponse,
} from "@/lib/mission";

function parseResponse(raw: unknown): MissionResponse | null {
  if (raw === "ok" || raw === "help") return raw;
  return null;
}

/**
 * GET — um clique no e-mail (links com pedido, token e r=ok|help)
 * POST — formulário / página da missão
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = (url.searchParams.get("pedido") || "").trim();
  const token = (url.searchParams.get("t") || "").trim();
  const response = parseResponse(url.searchParams.get("r"));

  if (!orderId || !token || !response) {
    return NextResponse.redirect(
      new URL("/missao?erro=1", url.origin),
      303,
    );
  }

  const result = await recordMissionResponse({ orderId, token, response });
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/missao?erro=${encodeURIComponent(result.error)}`, url.origin),
      303,
    );
  }

  const dest = new URL("/missao", url.origin);
  dest.searchParams.set("pedido", result.orderId);
  dest.searchParams.set("done", result.response);
  if (result.already) dest.searchParams.set("ja", "1");
  return NextResponse.redirect(dest, 303);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      pedido?: string;
      t?: string;
      r?: string;
    };
    const orderId = (body.pedido || "").trim();
    const token = (body.t || "").trim();
    const response = parseResponse(body.r);

    if (!orderId || !token || !response) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 },
      );
    }

    const result = await recordMissionResponse({ orderId, token, response });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      already: Boolean(result.already),
      response: result.response,
      orderId: result.orderId,
      nome: result.nome,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
