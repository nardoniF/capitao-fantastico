"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CaptainStrip } from "@/components/CaptainStrip";
import { DeliveryTimeline } from "@/components/DeliveryTimeline";
import { formatBRL } from "@/data/products";
import {
  SERVICE_STATUS_LABEL,
  type OrderHubPublic,
  type ServiceRequestStatus,
} from "@/lib/order-portal-shared";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

const RETURN_REASONS = [
  { value: "broken", label: "Produto chegou quebrado" },
  { value: "dislike", label: "Não gostei" },
  { value: "wrong", label: "Recebi errado" },
  { value: "late", label: "Atrasou" },
  { value: "defect", label: "Defeito" },
  { value: "other", label: "Outro" },
] as const;

const NAV = [
  { id: "rastreio", label: "Rastreamento" },
  { id: "nf", label: "Nota fiscal" },
  { id: "conversa", label: "Conversa" },
  { id: "devolucao", label: "Devolução" },
  { id: "garantia", label: "Garantia" },
  { id: "documentos", label: "Documentos" },
  { id: "suporte", label: "Suporte" },
] as const;

function statusTone(status: ServiceRequestStatus) {
  if (status === "done") return "text-emerald-400";
  if (status === "requested" || status === "in_progress") return "text-gold";
  if (status === "denied") return "text-muted";
  return "text-white";
}

export function OrderHubClient({ orderId }: { orderId: string }) {
  const [data, setData] = useState<OrderHubPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string>("");
  const [returnDesc, setReturnDesc] = useState("");
  const [mediaNote, setMediaNote] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) {
          setData(null);
          setError(json.error || "Pedido não encontrado");
          return;
        }
        setData(json as OrderHubPublic);
      } catch {
        setError("Falha ao carregar o pedido.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data || data.delivered) return;
    const id = setInterval(() => void load(true), 60_000);
    return () => clearInterval(id);
  }, [data, load]);

  async function postAction(action: string, text?: string) {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFlash(json.error || "Não foi possível enviar.");
        return;
      }
      if (json.hub) setData(json.hub as OrderHubPublic);
      setMessage("");
      setFlash(
        action === "message"
          ? "Mensagem enviada ao Capitão."
          : "Solicitação registrada. Vamos falar com você em português.",
      );
    } catch {
      setFlash("Falha de rede. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="px-5 py-20 text-center text-muted">Abrindo seu pedido…</p>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Pedido
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Não encontramos este pedido
        </h1>
        <p className="mt-3 text-sm text-muted">{error}</p>
        <form
          className="mt-8 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const code = String(fd.get("code") || "").trim();
            if (code) window.location.href = `/pedido/${encodeURIComponent(code)}`;
          }}
        >
          <input
            name="code"
            placeholder="Código do pedido"
            className="min-w-[200px] flex-1 rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
          />
          <button
            type="submit"
            className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Abrir
          </button>
        </form>
        <Link href="/contato" className="mt-6 inline-block text-sm text-gold hover:underline">
          Falar com o suporte
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg pb-20">
      <div className="border-b border-line bg-card/40">
        <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Sua página do pedido
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
            Pedido{" "}
            <span className="font-mono text-gold">{data.orderId}</span>
          </h1>
          <p className="mt-3 text-muted">
            Olá, {data.nome}. Aqui você acompanha tudo sem caçar e-mail —
            rastreio, NF, conversa, devolução, garantia e suporte.
          </p>
          <div className="mt-5">
            <CaptainStrip message={`${data.statusLabel} · atualizado ${new Date(data.updatedAt).toLocaleString("pt-BR")}`} />
          </div>
          <p className="mt-4 text-sm text-white">
            Total {formatBRL(data.total)}
            {data.addressSummary ? (
              <span className="text-muted"> · {data.addressSummary}</span>
            ) : null}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {data.items.map((it, i) => (
              <li key={`${it.name}-${i}`}>
                {it.qty}× {it.name}
                {it.size ? ` (${it.size})` : ""} — {formatBRL(it.price * it.qty)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <nav className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 py-2 md:px-6">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-md px-3 py-2 text-xs font-semibold text-muted hover:bg-white/5 hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-14 px-5 py-10 md:px-8">
        <section id="rastreio" className="scroll-mt-24">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Status de entrega
          </h2>
          <p className="mt-2 text-sm text-muted">
            Atualização automática a cada 30 minutos via fornecedor — você não
            precisa perguntar “cadê meu pedido?”.
          </p>
          <div className="mt-8">
            <DeliveryTimeline
              orderId={data.orderId}
              currentStage={data.pipelineStage}
              events={data.events}
              trackingCode={data.trackingCode}
            />
          </div>
          {data.trackingExternalUrl ? (
            <a
              href={data.trackingExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm font-semibold text-gold hover:underline"
            >
              Abrir rastreio externo (página pública)
            </a>
          ) : null}

          {data.delivered && data.missionToken && !data.missionResponse ? (
            <div className="mt-8 border-t border-gold/30 pt-6">
              <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
                Missão concluída?
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/missao?pedido=${encodeURIComponent(data.orderId)}&t=${encodeURIComponent(data.missionToken)}&r=ok`}
                  className="rounded-md bg-gold px-5 py-3 text-center text-sm font-bold text-black hover:bg-gold-deep"
                >
                  👍 Sim, deu tudo certo
                </Link>
                <Link
                  href={`/missao?pedido=${encodeURIComponent(data.orderId)}&t=${encodeURIComponent(data.missionToken)}&r=help`}
                  className="rounded-md border border-white/25 px-5 py-3 text-center text-sm font-semibold text-white hover:border-gold hover:text-gold"
                >
                  👎 Não, preciso de ajuda
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <section id="nf" className="scroll-mt-24 border-t border-line pt-14">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Nota fiscal
          </h2>
          <p className="mt-2 text-sm text-muted">
            Emitida pela {siteConfig.company} quando aplicável.
          </p>
          {data.invoiceReady && data.invoiceUrl ? (
            <div className="mt-5">
              <p className="text-sm text-white">
                {data.invoiceNumber
                  ? `NF ${data.invoiceNumber}`
                  : "Nota fiscal disponível"}
              </p>
              <a
                href={data.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
              >
                Baixar / abrir NF
              </a>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">
              Ainda não anexamos a NF neste pedido. Quando estiver pronta, o
              link aparece aqui — sem precisar procurar no e-mail.
            </p>
          )}
        </section>

        <section id="conversa" className="scroll-mt-24 border-t border-line pt-14">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Conversa
          </h2>
          <p className="mt-2 text-sm text-muted">
            Fale com o Capitão sobre este pedido. Use o mesmo e-mail da compra.
          </p>

          <div className="mt-5 space-y-3">
            {data.messages.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma mensagem ainda.</p>
            ) : (
              data.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-4 py-3 text-sm ${
                    m.from === "captain"
                      ? "border border-gold/30 bg-gold/5"
                      : "border border-line bg-card"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {m.from === "captain" ? "Capitão" : "Você"}
                  </p>
                  <p className="mt-1 text-white">{m.text}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(m.at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail da compra"
              className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Sua mensagem…"
              className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void postAction("message", message)}
              className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep disabled:opacity-50"
            >
              Enviar mensagem
            </button>
            {flash ? <p className="text-sm text-gold">{flash}</p> : null}
          </div>

          <a
            href={whatsappUrl(
              `Olá! Pedido ${data.orderId} na ${siteConfig.brand} — quero conversar.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-gold hover:underline"
          >
            Ou abrir WhatsApp
          </a>
        </section>

        <section id="devolucao" className="scroll-mt-24 border-t border-line pt-14">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Devolução
          </h2>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>
              <strong className="text-white">Defeito:</strong> troca ou reembolso.
            </p>
            <p>
              <strong className="text-white">Produto diferente:</strong> troca
              imediata.
            </p>
            <p>
              <strong className="text-white">Arrependimento:</strong> até 7 dias
              após o recebimento (CDC), nas condições aplicáveis.
            </p>
            <p>Estorno via Mercado Pago quando o admin aprovar o reembolso.</p>
          </div>

          {data.returnTicket ? (
            <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm">
              <p className="font-semibold text-gold">
                Ticket {data.returnTicket.id} · {data.returnTicket.status}
              </p>
              <p className="mt-2 text-white">
                Motivo:{" "}
                {RETURN_REASONS.find((r) => r.value === data.returnTicket?.reason)
                  ?.label || data.returnTicket.reason}
              </p>
              <p className="mt-1 text-muted">{data.returnTicket.description}</p>
              <p className="mt-3 text-xs text-muted">
                Fluxo: Análise → Aprovado → Reembolso / Troca / Cupom
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted">
                Escolha o motivo e descreva. Foto/vídeo: cole um link (sem custo
                de storage).
              </p>
              <div className="space-y-2">
                {RETURN_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-center gap-3 text-sm text-white"
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={r.value}
                      checked={returnReason === r.value}
                      onChange={() => setReturnReason(r.value)}
                      className="accent-gold"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail da compra"
                className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
              />
              <textarea
                value={returnDesc}
                onChange={(e) => setReturnDesc(e.target.value)}
                rows={3}
                placeholder="Descrição…"
                className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
              />
              <input
                value={mediaNote}
                onChange={(e) => setMediaNote(e.target.value)}
                placeholder="Link de foto/vídeo (opcional)"
                className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
              />
              <button
                type="button"
                disabled={busy || !email || !returnReason}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    setFlash(null);
                    try {
                      const res = await fetch(
                        `/api/orders/${encodeURIComponent(orderId)}`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "return_ticket",
                            email,
                            reason: returnReason,
                            text: returnDesc,
                            mediaNotes: mediaNote.trim()
                              ? [mediaNote.trim()]
                              : [],
                          }),
                        },
                      );
                      const json = await res.json();
                      if (!res.ok) {
                        setFlash(json.error || "Falha ao abrir ticket.");
                        return;
                      }
                      if (json.hub) setData(json.hub as OrderHubPublic);
                      setFlash("Ticket criado · em análise.");
                    } catch {
                      setFlash("Falha de rede.");
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
                className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep disabled:opacity-50"
              >
                Enviar solicitação
              </button>
              {flash ? <p className="text-sm text-gold">{flash}</p> : null}
            </div>
          )}
        </section>

        <section id="garantia" className="scroll-mt-24 border-t border-line pt-14">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Garantia
          </h2>
          <p className="mt-2 text-sm text-muted">
            Problema de funcionamento? Abra a garantia aqui — o Capitão trata
            em português.
          </p>
          <p className={`mt-4 text-sm font-semibold ${statusTone(data.warrantyStatus)}`}>
            Status: {SERVICE_STATUS_LABEL[data.warrantyStatus]}
          </p>
          {data.warrantyStatus === "none" || data.warrantyStatus === "denied" ? (
            <button
              type="button"
              disabled={busy || !email}
              onClick={() => void postAction("warranty")}
              className="mt-4 rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold disabled:opacity-50"
            >
              Abrir garantia
            </button>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Garantia em andamento. Use a conversa para enviar fotos ou detalhes.
            </p>
          )}
        </section>

        <section id="documentos" className="scroll-mt-24 border-t border-line pt-14">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Documentos
          </h2>
          <p className="mt-2 text-sm text-muted">
            Comprovantes e arquivos deste pedido, centralizados.
          </p>
          {data.documents.length === 0 ? (
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>✔ Resumo do pedido (nesta página)</li>
              <li>✔ Nota fiscal — quando emitida</li>
              <li>✔ Rastreio e histórico de status</li>
            </ul>
          ) : (
            <ul className="mt-5 space-y-3">
              {data.documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gold hover:underline"
                  >
                    {doc.title}
                  </a>
                  <p className="text-xs text-muted">
                    {new Date(doc.at).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="suporte" className="scroll-mt-24 border-t border-line pt-14">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Suporte
          </h2>
          <p className="mt-2 text-sm text-muted">
            Sempre em português. Cite o código{" "}
            <span className="font-mono text-white">{data.orderId}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/central?pedido=${encodeURIComponent(data.orderId)}`}
              className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
            >
              🎩 Central do Capitão
            </Link>
            <a
              href={whatsappUrl(
                `Olá! Preciso de suporte no pedido ${data.orderId} (${siteConfig.brand}).`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(`Pedido ${data.orderId}`)}`}
              className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
            >
              E-mail
            </a>
            <Link
              href="/faq"
              className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
            >
              FAQ
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            {siteConfig.email} · {siteConfig.company} · CNPJ {siteConfig.cnpj}
          </p>
        </section>
      </div>
    </div>
  );
}
