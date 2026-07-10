import { siteConfig, whatsappUrl } from "@/lib/site-config";

const policies = [
  {
    id: "frete",
    title: "Frete",
    body: "Após o pedido, confirmamos prazo e valor de frete por WhatsApp conforme seu CEP. Envio pelos Correios / transportadoras.",
  },
  {
    id: "troca",
    title: "Trocas e devoluções",
    body: "Até 7 dias após o recebimento (CDC). Produto sem uso, na embalagem original. Fale conosco pelo e-mail ou WhatsApp.",
  },
  {
    id: "contato",
    title: "Contato",
    body: `Dúvidas: ${siteConfig.email} · WhatsApp no rodapé. Atendimento em dias úteis.`,
  },
] as const;

export function Policies() {
  return (
    <section id="politicas" className="border-t border-line bg-card py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
          Frete, troca e contato
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Pagamento seguro com Mercado Pago (Pix e cartão).
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {policies.map((item) => (
            <div
              key={item.id}
              id={item.id}
              className="rounded-xl border border-line bg-card-2 p-6"
            >
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-gold">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              {item.id === "contato" ? (
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-gold underline-offset-2 hover:underline"
                >
                  Abrir WhatsApp
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
