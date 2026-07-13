"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CaptainStrip } from "@/components/CaptainStrip";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

type MissionId =
  | "rastreio"
  | "troca"
  | "devolucao"
  | "garantia"
  | "cancelar"
  | "endereco"
  | "falar";

type Mission = {
  id: MissionId;
  title: string;
  blurb: string;
  needsEmail: boolean;
  needsDetail?: boolean;
  detailLabel?: string;
  detailPlaceholder?: string;
  action?: "exchange" | "return" | "warranty" | "cancel" | "address_change" | "message";
  cta: string;
};

const MISSIONS: Mission[] = [
  {
    id: "rastreio",
    title: "Onde está meu pedido",
    blurb: "Abra a página do pedido com rastreio ao vivo.",
    needsEmail: false,
    cta: "Ver rastreio",
  },
  {
    id: "troca",
    title: "Troca",
    blurb: "Trocar por outro item ou tamanho — produto sem uso, embalagem original.",
    needsEmail: true,
    needsDetail: true,
    detailLabel: "O que você quer trocar?",
    detailPlaceholder: "Ex.: quero trocar o tamanho / cor…",
    action: "exchange",
    cta: "Solicitar troca",
  },
  {
    id: "devolucao",
    title: "Devolução",
    blurb: "Até 7 dias após o recebimento (CDC).",
    needsEmail: true,
    needsDetail: true,
    detailLabel: "Motivo (opcional)",
    detailPlaceholder: "Conte o que aconteceu…",
    action: "return",
    cta: "Solicitar devolução",
  },
  {
    id: "garantia",
    title: "Garantia",
    blurb: "Defeito ou problema de funcionamento? O Capitão resolve em português.",
    needsEmail: true,
    needsDetail: true,
    detailLabel: "Descreva o problema",
    detailPlaceholder: "O que parou de funcionar?",
    action: "warranty",
    cta: "Abrir garantia",
  },
  {
    id: "cancelar",
    title: "Cancelar",
    blurb: "Só antes do envio. Se já saiu, use devolução ou fale com o Capitão.",
    needsEmail: true,
    needsDetail: true,
    detailLabel: "Motivo (opcional)",
    detailPlaceholder: "Por que cancelar?",
    action: "cancel",
    cta: "Pedir cancelamento",
  },
  {
    id: "endereco",
    title: "Alterar endereço",
    blurb: "Antes do despacho. Informe o endereço novo completo.",
    needsEmail: true,
    needsDetail: true,
    detailLabel: "Novo endereço",
    detailPlaceholder: "Rua, número, bairro, cidade/UF, CEP…",
    action: "address_change",
    cta: "Enviar novo endereço",
  },
  {
    id: "falar",
    title: "Falar com o Capitão",
    blurb: "WhatsApp ou mensagem na página do pedido — suporte em português.",
    needsEmail: true,
    needsDetail: true,
    detailLabel: "Sua mensagem",
    detailPlaceholder: "Como podemos ajudar?",
    action: "message",
    cta: "Enviar ao Capitão",
  },
];

export function CaptainCentral({
  initialPedido,
  initialMission,
}: {
  initialPedido?: string;
  initialMission?: string;
}) {
  const startMission = useMemo(() => {
    const hit = MISSIONS.find((m) => m.id === initialMission);
    return hit?.id ?? null;
  }, [initialMission]);

  const [open, setOpen] = useState<MissionId | null>(startMission);
  const [pedido, setPedido] = useState(initialPedido || "");
  const [email, setEmail] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: MissionId) {
    setOpen((prev) => (prev === id ? null : id));
    setFlash(null);
    setError(null);
  }

  async function run(mission: Mission) {
    setBusy(true);
    setFlash(null);
    setError(null);
    const code = pedido.trim();

    try {
      if (mission.id === "rastreio") {
        if (!code) {
          setError("Informe o código do pedido.");
          return;
        }
        window.location.href = `/pedido/${encodeURIComponent(code)}`;
        return;
      }

      if (!code) {
        setError("Informe o código do pedido.");
        return;
      }
      if (!email.trim()) {
        setError("Informe o e-mail da compra.");
        return;
      }

      if (mission.id === "falar") {
        // Também oferece WhatsApp direto
      }

      if (mission.action === "address_change" && detail.trim().length < 8) {
        setError("Informe o novo endereço completo.");
        return;
      }

      if (mission.action === "message" && detail.trim().length < 2) {
        setError("Escreva uma mensagem.");
        return;
      }

      const res = await fetch(`/api/orders/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mission.action,
          email: email.trim(),
          text: detail.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; already?: boolean };
      if (!res.ok) {
        setError(json.error || "Não foi possível concluir.");
        return;
      }

      setFlash(
        json.already
          ? "Já tínhamos essa solicitação registrada. Acompanhe na página do pedido."
          : "Registrado. O Capitão recebeu — acompanhe na página do pedido.",
      );
      setDetail("");
    } catch {
      setError("Falha de rede. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
        Ajuda
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
        🎩 Central do Capitão
      </h1>
      <p className="mt-4 text-muted">
        Escolha a missão. Tudo em um fluxo — sem caçar e-mail.
      </p>
      <div className="mt-6">
        <CaptainStrip message="Suporte em português · código do pedido + e-mail da compra." />
      </div>

      <ol className="mt-12">
        {MISSIONS.map((mission, idx) => {
          const isOpen = open === mission.id;
          return (
            <li key={mission.id}>
              <button
                type="button"
                onClick={() => toggle(mission.id)}
                className={`w-full text-left transition ${
                  isOpen ? "text-gold" : "text-white hover:text-gold"
                }`}
              >
                <span className="font-[family-name:var(--font-syne)] text-2xl font-bold md:text-3xl">
                  {mission.title}
                </span>
                <span className="mt-1 block text-sm text-muted">{mission.blurb}</span>
              </button>

              {isOpen ? (
                <div className="mt-5 space-y-3 border-l-2 border-gold/40 pl-4">
                  <input
                    value={pedido}
                    onChange={(e) => setPedido(e.target.value)}
                    placeholder="Código do pedido (ex.: 8FH29JK)"
                    className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  />
                  {mission.needsEmail ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-mail da compra"
                      className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                    />
                  ) : null}
                  {mission.needsDetail ? (
                    <div>
                      {mission.detailLabel ? (
                        <p className="mb-1.5 text-xs text-muted">{mission.detailLabel}</p>
                      ) : null}
                      <textarea
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        rows={mission.id === "endereco" ? 4 : 3}
                        placeholder={mission.detailPlaceholder}
                        className="w-full rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run(mission)}
                      className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep disabled:opacity-50"
                    >
                      {busy ? "Enviando…" : mission.cta}
                    </button>
                    {mission.id === "falar" ? (
                      <a
                        href={whatsappUrl(
                          pedido.trim()
                            ? `Olá, Capitão! Pedido ${pedido.trim()} — preciso de ajuda.`
                            : `Olá, Capitão! Preciso de ajuda na ${siteConfig.brand}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
                      >
                        WhatsApp agora
                      </a>
                    ) : null}
                    {pedido.trim() && mission.id !== "rastreio" ? (
                      <Link
                        href={`/pedido/${encodeURIComponent(pedido.trim())}`}
                        className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
                      >
                        Abrir página do pedido
                      </Link>
                    ) : null}
                  </div>

                  {error ? <p className="text-sm text-red-300">{error}</p> : null}
                  {flash ? <p className="text-sm text-gold">{flash}</p> : null}
                </div>
              ) : null}

              {idx < MISSIONS.length - 1 ? (
                <p
                  className="my-5 select-none text-center text-xl text-gold/50"
                  aria-hidden
                >
                  ↓
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="mt-14 text-center text-xs text-muted">
        {siteConfig.email} · {siteConfig.company}
      </p>
    </div>
  );
}
