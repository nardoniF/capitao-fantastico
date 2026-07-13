import { createHmac, timingSafeEqual } from "crypto";
import type { Order } from "@/lib/store-types";
import { findOrderById, listOrders, updateOrder } from "@/lib/store-db";
import { emailDelivered } from "@/lib/email";

export type MissionResponse = "ok" | "help";

function missionSecret() {
  return (
    process.env.MISSION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "capitao-missao"
  );
}

export function createMissionToken(orderId: string) {
  return createHmac("sha256", missionSecret())
    .update(`missao:${orderId}`)
    .digest("hex")
    .slice(0, 24);
}

export function verifyMissionToken(orderId: string, token: string) {
  if (!token || token.length < 16) return false;
  const expected = createMissionToken(orderId);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Dispara o e-mail "Missão concluída?" uma vez, quando o pedido chega.
 */
export async function askMissionOnDelivery(order: Order): Promise<{
  sent: boolean;
  skipped?: boolean;
  order: Order;
}> {
  if (order.missionAskedAt) {
    return { sent: false, skipped: true, order };
  }

  const token = createMissionToken(order.orderId);
  const askedAt = new Date().toISOString();
  const updated = await updateOrder(order.orderId, {
    missionToken: token,
    missionAskedAt: askedAt,
  });
  const current = updated ?? { ...order, missionToken: token, missionAskedAt: askedAt };

  const mail = await emailDelivered({
    orderId: current.orderId,
    email: current.email,
    nome: current.nome,
    missionToken: token,
  });

  return {
    sent: mail.ok && !mail.skipped,
    skipped: mail.skipped,
    order: current,
  };
}

export async function recordMissionResponse(input: {
  orderId: string;
  token: string;
  response: MissionResponse;
}): Promise<
  | { ok: true; already?: boolean; response: MissionResponse; orderId: string; nome: string }
  | { ok: false; error: string }
> {
  if (!verifyMissionToken(input.orderId, input.token)) {
    return { ok: false, error: "Link inválido ou expirado." };
  }

  const order = await findOrderById(input.orderId);
  if (!order) return { ok: false, error: "Pedido não encontrado." };

  if (order.missionResponse === "ok" || order.missionResponse === "help") {
    return {
      ok: true,
      already: true,
      response: order.missionResponse,
      orderId: order.orderId,
      nome: order.nome,
    };
  }

  await updateOrder(order.orderId, {
    missionResponse: input.response,
    missionRespondedAt: new Date().toISOString(),
  });

  return {
    ok: true,
    response: input.response,
    orderId: order.orderId,
    nome: order.nome,
  };
}

export type MissionIndex = {
  /** % de 👍 entre quem respondeu (null se ninguém respondeu) */
  index: number | null;
  asked: number;
  responded: number;
  ok: number;
  help: number;
  pending: number;
};

export function computeMissionIndex(orders: Order[]): MissionIndex {
  const asked = orders.filter((o) => o.missionAskedAt).length;
  const ok = orders.filter((o) => o.missionResponse === "ok").length;
  const help = orders.filter((o) => o.missionResponse === "help").length;
  const responded = ok + help;
  const pending = asked - responded;
  const index =
    responded > 0 ? Number(((ok / responded) * 100).toFixed(1)) : null;

  return { index, asked, responded, ok, help, pending };
}

export async function getMissionIndexFromStore(): Promise<MissionIndex> {
  const orders = await listOrders();
  return computeMissionIndex(orders);
}
