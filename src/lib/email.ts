/**
 * E-mails da jornada do pedido via Resend (HTTPS).
 * Sem RESEND_API_KEY → só loga (não quebra o fluxo).
 */
import { siteConfig } from "@/lib/site-config";

const FROM =
  process.env.EMAIL_FROM?.trim() ||
  `Capitão Fantástico <contato@capitaofantastico.com.br>`;

function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.capitaofantastico.com.br"
  );
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
  const track = `${siteOrigin()}/pedido/rastreio?pedido=${encodeURIComponent(order.orderId)}`;
  return sendEmail({
    to: order.email,
    subject: `Pedido ${order.orderId} recebido — ${siteConfig.brand}`,
    html: wrap(
      "Pedido recebido",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Seu pedido <strong>${order.orderId}</strong> foi registrado (total R$ ${order.total.toFixed(2)}).</p>
       <p>Assim que o pagamento confirmar, preparamos o envio. Acompanhe em:<br/>
       <a href="${track}" style="color:#ffc107">${track}</a></p>
       <p>Fale conosco em português pelo WhatsApp se precisar de qualquer coisa.</p>`,
    ),
  });
}

export async function emailPaymentConfirmed(order: {
  orderId: string;
  email: string;
  nome: string;
}) {
  const track = `${siteOrigin()}/pedido/rastreio?pedido=${encodeURIComponent(order.orderId)}`;
  return sendEmail({
    to: order.email,
    subject: `Pagamento confirmado — pedido ${order.orderId}`,
    html: wrap(
      "Pagamento confirmado",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Identificamos o pagamento do pedido <strong>${order.orderId}</strong>.</p>
       <p>Estamos preparando o envio. Você receberá o código de rastreio e pode seguir tudo aqui:<br/>
       <a href="${track}" style="color:#ffc107">${track}</a></p>`,
    ),
  });
}

export async function emailFulfilling(order: {
  orderId: string;
  email: string;
  nome: string;
}) {
  const track = `${siteOrigin()}/pedido/rastreio?pedido=${encodeURIComponent(order.orderId)}`;
  return sendEmail({
    to: order.email,
    subject: `Preparando envio — pedido ${order.orderId}`,
    html: wrap(
      "Preparando o seu envio",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Seu pedido <strong>${order.orderId}</strong> entrou na fila de envio.</p>
       <p>Em breve o rastreio aparece no site:<br/>
       <a href="${track}" style="color:#ffc107">${track}</a></p>`,
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
  const track = `${siteOrigin()}/pedido/rastreio?pedido=${encodeURIComponent(order.orderId)}`;
  const code = order.trackingCode
    ? `<p>Código: <strong style="color:#ffc107">${order.trackingCode}</strong>${
        order.carrier ? ` · ${order.carrier}` : ""
      }</p>`
    : "";
  return sendEmail({
    to: order.email,
    subject: `Pedido enviado — rastreio ${order.orderId}`,
    html: wrap(
      "Seu pedido foi enviado",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>O pedido <strong>${order.orderId}</strong> saiu para entrega.</p>
       ${code}
       <p>Acompanhe cada movimento aqui (atualizamos sozinho):<br/>
       <a href="${track}" style="color:#ffc107">${track}</a></p>
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
  const track = `${siteOrigin()}/pedido/rastreio?pedido=${encodeURIComponent(order.orderId)}`;
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
       <p><a href="${track}" style="color:#ffc107">Ver rastreio ao vivo</a></p>`,
    ),
  });
}

export async function emailDelivered(order: {
  orderId: string;
  email: string;
  nome: string;
}) {
  return sendEmail({
    to: order.email,
    subject: `Pedido entregue — ${order.orderId}`,
    html: wrap(
      "Pedido entregue",
      `<p>Olá, <strong>${order.nome}</strong>!</p>
       <p>Marcamos o pedido <strong>${order.orderId}</strong> como entregue.</p>
       <p>Qualquer imprevisto, fale conosco em português — estamos aqui para ajudar.</p>`,
    ),
  });
}
