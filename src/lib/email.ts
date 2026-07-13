/**
 * E-mails da jornada do pedido via Resend (HTTPS).
 * Sem RESEND_API_KEY → só loga (não quebra o fluxo).
 */
import { siteConfig } from "@/lib/site-config";
import { orderPortalUrl } from "@/lib/order-portal";

const FROM =
  process.env.EMAIL_FROM?.trim() ||
  `Capitão Fantástico <contato@capitaofantastico.com.br>`;

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.capitaofantastico.com.br"
  );
}

function portalLink(orderId: string) {
  return orderPortalUrl(orderId, siteOrigin());
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.info("[email skip]", opts.to, opts.subject);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[email fail]", res.status, body);
      return { ok: false, error: body.slice(0, 200) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    console.error("[email]", msg);
    return { ok: false, error: msg };
  }
}

function wrap(title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#eee;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #333;border-radius:12px;padding:28px">
    <p style="color:#ffc107;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin:0">${siteConfig.brand}</p>
    <p style="color:#aaa;font-size:13px;margin:8px 0 0">${siteConfig.slogan}</p>
    <h1 style="color:#fff;font-size:22px;margin:16px 0">${title}</h1>
    <div style="color:#ccc;font-size:15px;line-height:1.55">${bodyHtml}</div>
    <p style="margin-top:28px;font-size:13px;color:#888">
      Mensagem do Capitão: acompanhamos em português até chegar.<br/>
      WhatsApp no site · ${siteConfig.email}<br/>
      ${siteConfig.tagline}
    </p>
  </div></body></html>`;
}

export async function emailOrderCreated(order: {
  orderId: string;
  email: string;
  nome: string;
  total: number;
}) {
  const portal = portalLink(order.orderId);
  return sendEmail({
    to: order.email,
    subject: `Pedido ${order.orderId} recebido — ${siteConfig.brand}`,
    html: wrap(
      "Pedido recebido",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Seu pedido <strong>${order.orderId}</strong> foi registrado (total R$ ${order.total.toFixed(2)}).</p>
       <p>Sua página do pedido (rastreio, NF, conversa, suporte):<br/>
       <a href="${portal}" style="color:#ffc107">${portal}</a></p>
       <p>Fale conosco em português pelo WhatsApp se precisar de qualquer coisa.</p>`,
    ),
  });
}

export async function emailPaymentConfirmed(order: {
  orderId: string;
  email: string;
  nome: string;
}) {
  const portal = portalLink(order.orderId);
  return sendEmail({
    to: order.email,
    subject: `Pagamento confirmado — pedido ${order.orderId}`,
    html: wrap(
      "Pagamento confirmado",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Identificamos o pagamento do pedido <strong>${order.orderId}</strong>.</p>
       <p>Estamos preparando o envio. Acompanhe tudo na página do pedido:<br/>
       <a href="${portal}" style="color:#ffc107">${portal}</a></p>`,
    ),
  });
}

export async function emailFulfilling(order: {
  orderId: string;
  email: string;
  nome: string;
}) {
  const portal = portalLink(order.orderId);
  return sendEmail({
    to: order.email,
    subject: `Preparando envio — pedido ${order.orderId}`,
    html: wrap(
      "Preparando o seu envio",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Seu pedido <strong>${order.orderId}</strong> entrou na fila de envio.</p>
       <p>Rastreio e documentos na página do pedido:<br/>
       <a href="${portal}" style="color:#ffc107">${portal}</a></p>`,
    ),
  });
}

export async function emailShipped(order: {
  orderId: string;
  email: string;
  nome: string;
  trackingCode?: string;
  carrier?: string;
}) {
  const portal = portalLink(order.orderId);
  const code = order.trackingCode
    ? `<p>Código: <strong style="color:#ffc107">${order.trackingCode}</strong>${
        order.carrier ? ` · ${order.carrier}` : ""
      }</p>`
    : "";
  return sendEmail({
    to: order.email,
    subject: `Pedido enviado — ${order.orderId}`,
    html: wrap(
      "Seu pedido foi enviado",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>O pedido <strong>${order.orderId}</strong> saiu para entrega.</p>
       ${code}
       <p>Acompanhe na página do pedido (atualizamos sozinho):<br/>
       <a href="${portal}" style="color:#ffc107">${portal}</a></p>
       <p>Suporte em português até chegar — é só chamar no WhatsApp.</p>`,
    ),
  });
}

export async function emailTrackingUpdate(order: {
  orderId: string;
  email: string;
  nome: string;
  label: string;
  detail?: string;
}) {
  const portal = portalLink(order.orderId);
  return sendEmail({
    to: order.email,
    subject: `Atualização do pedido ${order.orderId}: ${order.label}`,
    html: wrap(
      order.label,
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Novidade no pedido <strong>${order.orderId}</strong>:</p>
       <p><strong>${order.label}</strong>${
         order.detail ? `<br/>${order.detail}` : ""
       }</p>
       <p><a href="${portal}" style="color:#ffc107">Abrir página do pedido</a></p>`,
    ),
  });
}

export async function emailDelivered(order: {
  orderId: string;
  email: string;
  nome: string;
  missionToken: string;
}) {
  const origin = siteOrigin();
  const base = `${origin}/api/missao?pedido=${encodeURIComponent(order.orderId)}&t=${encodeURIComponent(order.missionToken)}`;
  const okUrl = `${base}&r=ok`;
  const helpUrl = `${base}&r=help`;
  const portal = portalLink(order.orderId);

  const btn = (href: string, label: string, bg: string, color: string) =>
    `<a href="${href}" style="display:inline-block;margin:6px 8px 6px 0;padding:14px 20px;background:${bg};color:${color};text-decoration:none;border-radius:10px;font-weight:700;font-size:15px">${label}</a>`;

  return sendEmail({
    to: order.email,
    subject: `Missão concluída? — ${order.orderId}`,
    html: wrap(
      "Missão concluída?",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Seu pedido <strong>${order.orderId}</strong> chegou. O Capitão quer saber se deu tudo certo.</p>
       <p style="margin:22px 0 8px;font-size:18px;color:#fff"><strong>Missão concluída?</strong></p>
       <p style="margin:0 0 18px">
         ${btn(okUrl, "👍 Sim, deu tudo certo", "#ffc107", "#111")}
         ${btn(helpUrl, "👎 Não, preciso de ajuda", "#2a2a2a", "#fff")}
       </p>
       <p style="font-size:13px;color:#888"><a href="${portal}" style="color:#ffc107">Abrir página do pedido</a></p>`,
    ),
    text: `Missão concluída?\n\nPedido ${order.orderId}\n\nSim: ${okUrl}\nPreciso de ajuda: ${helpUrl}`,
  });
}
