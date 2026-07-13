import { NextResponse } from "next/server";
import {
  deleteNeonProduct,
  getAdminBundle,
  updateNeonProduct,
  updatePricingRule,
} from "@/lib/admin-data";
import { updateOrder } from "@/lib/store-db";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function checkAuth(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const header = request.headers.get("x-admin-password") || "";
  return header === expected;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();
  try {
    const data = await getAdminBundle();
    return NextResponse.json(data);
  } catch (e) {
    console.error("admin GET", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no admin" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!checkAuth(request)) return unauthorized();

  try {
    const body = (await request.json()) as {
      action?: string;
      orderId?: string;
      patch?: Record<string, unknown>;
      pricing?: { markup?: number; fxBrl?: number; feePct?: number };
      productId?: string;
      productPatch?: {
        salePrice?: number;
        active?: boolean;
        name?: string;
        blurb?: string;
      };
      hard?: boolean;
    };

    if (body.action === "update_pricing" && body.pricing) {
      const rule = await updatePricingRule(body.pricing);
      return NextResponse.json({
        ok: true,
        pricing: {
          markup: Number(rule.markup),
          fxBrl: Number(rule.fxBrl),
          feePct: Number(rule.feePct),
        },
      });
    }

    if (
      body.action === "update_neon_product" &&
      body.productId &&
      body.productPatch
    ) {
      const product = await updateNeonProduct(body.productId, body.productPatch);
      return NextResponse.json({ product });
    }

    if (body.action === "delete_product" && body.productId) {
      await deleteNeonProduct(body.productId, { hard: body.hard === true });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "deactivate_product" && body.productId) {
      const product = await updateNeonProduct(body.productId, {
        active: false,
      });
      return NextResponse.json({ product });
    }

    if (body.action === "update_order" && body.orderId && body.patch) {
      const { findOrderById } = await import("@/lib/store-db");
      const current = await findOrderById(body.orderId);
      const patch = { ...body.patch } as Record<string, unknown>;
      const wasFulfilled = current?.status === "fulfilled";
      if (current && typeof patch.supplierTracking === "string") {
        const { appendTrackingEvent, statusLabel } = await import(
          "@/lib/order-tracking"
        );
        const nextStatus =
          patch.status === "fulfilled" ? "fulfilled" : "shipped";
        patch.status = nextStatus;
        patch.trackingEvents = appendTrackingEvent(current.trackingEvents, {
          at: new Date().toISOString(),
          label: statusLabel(String(nextStatus)),
          detail: `Rastreio ${patch.supplierTracking}`,
        });
      } else if (
        current &&
        patch.status === "fulfilled" &&
        current.status !== "fulfilled"
      ) {
        const { appendTrackingEvent, statusLabel } = await import(
          "@/lib/order-tracking"
        );
        patch.trackingEvents = appendTrackingEvent(current.trackingEvents, {
          at: new Date().toISOString(),
          label: statusLabel("fulfilled"),
          detail: "Entrega confirmada",
        });
      }
      const order = await updateOrder(
        body.orderId,
        patch as Parameters<typeof updateOrder>[1],
      );
      if (!order) {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 },
        );
      }
      if (order.status === "fulfilled" && !wasFulfilled) {
        const { askMissionOnDelivery } = await import("@/lib/mission");
        await askMissionOnDelivery(order);
      }
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    console.error("admin PUT", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
