import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

/**
 * Formulário de contato → e-mail oficial da loja (sem FormSubmit).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };

    const name = (body.name || "").trim().slice(0, 120);
    const email = (body.email || "").trim().toLowerCase().slice(0, 160);
    const message = (body.message || "").trim().slice(0, 4000);

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const to = siteConfig.email;
    const result = await sendEmail({
      to,
      subject: `Contato do site — ${name}`,
      replyTo: email,
      html: `<p><strong>De:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
        <p style="color:#888;font-size:12px">Enviado pelo formulário de ${siteConfig.brand}</p>`,
      text: `De: ${name} <${email}>\n\n${message}`,
    });

    // Confirmação para o cliente (opcional)
    await sendEmail({
      to: email,
      subject: `Recebemos sua mensagem — ${siteConfig.brand}`,
      html: `<p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos sua mensagem. Nosso suporte em português responde em breve.</p>
        <p>WhatsApp e e-mail: ${siteConfig.email}</p>
        <p>— Equipe ${siteConfig.brand}</p>`,
    });

    if (!result.ok && !result.skipped) {
      return NextResponse.json(
        { error: "Não foi possível enviar agora. Use o WhatsApp." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      skipped: result.skipped === true,
      message: result.skipped
        ? "Mensagem registrada. Configure RESEND_API_KEY para e-mail automático — ou fale no WhatsApp."
        : "Mensagem enviada. Em breve respondemos.",
    });
  } catch {
    return NextResponse.json({ error: "Falha no envio" }, { status: 500 });
  }
}
