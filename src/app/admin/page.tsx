"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminClicksTree } from "@/components/AdminClicksTree";
import type { ClickTree } from "@/lib/clicks-tree";
import { formatBRL } from "@/data/products";
import { FEEDBACK_KINDS } from "@/components/SuggestionForm";
import { whatsappUrl } from "@/lib/site-config";

type Pricing = { markup: number; fxBrl: number; feePct: number; ruleId?: string };

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  active: boolean;
  costUsd: number;
  shippingUsd: number;
  costBrl: number;
  salePrice: number;
  marginBrl: number;
  marginPct: number;
  mpFeeBrl: number;
  netAfterMpBrl: number;
};

type OrderRow = {
  orderId: string;
  createdAt: string;
  status: string;
  nome: string;
  email: string;
  charged: number;
  costPaid: number;
  mpFee: number;
  commission: number;
  items: { name: string; qty: number; unitPrice: number; unitCostBrl: number }[];
  paymentRef?: string;
  supplierTracking?: string;
  missionResponse?: "ok" | "help" | null;
  missionAskedAt?: string | null;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  messageCount?: number;
  returnStatus?: string | null;
  warrantyStatus?: string | null;
};

type ClickRow = {
  id: string;
  createdAt: string;
  tipo: string;
  rotulo?: string;
  pagina?: string;
};

type FeedbackRow = {
  id: string;
  name: string;
  email: string;
  kind: string;
  message: string;
  page: string | null;
  createdAt: string;
};

type ApiCheck = { name: string; ok: boolean; detail: string };

type ImportLogRow = {
  id: string;
  source: string;
  status: string;
  message: string;
  name?: string | null;
  slug?: string | null;
  pid?: string | null;
  createdAt: string;
};

type CatalogInfo = {
  activeCount: number;
  activeDbCount?: number;
  cap: number;
  slotsLeft: number;
};

type ImportSummary = {
  lastRunAt: string | null;
  lastRunSource: string | null;
  lastSuccessAt: string | null;
  lastSuccessName: string | null;
  last24h: { ok: number; skip: number; error: number; cap: number };
  lastRoundMessage: string | null;
};

type Kpis = {
  ordersTotal: number;
  ordersPaid: number;
  revenue: number;
  commission: number;
  clicksTotal: number;
  clicksWhatsapp: number;
  activeProducts: number;
  catalogCap: number;
  missionIndex: number | null;
  missionAsked: number;
  missionOk: number;
  missionHelp: number;
};

type Tab = "vendas" | "produtos" | "importar" | "markup" | "cliques" | "sugestoes" | "api";

type SearchHit = {
  pid: string;
  title: string;
  imageUrl: string;
  priceUsd: number;
  salePriceBrl: number;
  categoryName?: string;
  alreadyImported?: boolean;
  productSlug?: string;
};

const kindLabel = (kind: string) =>
  FEEDBACK_KINDS.find((k) => k.value === kind)?.label || kind;

const ADMIN_TOKEN_KEY = "cf-admin-token";

function adminHeaders(token: string, password: string): HeadersInit {
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  else if (password) h["x-admin-password"] = password;
  return h;
}

export default function AdminPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("vendas");
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [api, setApi] = useState<ApiCheck[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLogRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogInfo | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [markupDraft, setMarkupDraft] = useState("2.0");
  const [fxDraft, setFxDraft] = useState("5.6");
  const [feeDraft, setFeeDraft] = useState("5");
  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [selectedPids, setSelectedPids] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [reenrichRunning, setReenrichRunning] = useState(false);
  const [autoLog, setAutoLog] = useState<string | null>(null);
  const [clickTree, setClickTree] = useState<ClickTree | null>(null);
  const [clicksMeta, setClicksMeta] = useState<{
    total: number;
    todayCount: number;
    byDestino: Record<string, number>;
  } | null>(null);
  const [clicksLoading, setClicksLoading] = useState(false);
  const [loginHelpOpen, setLoginHelpOpen] = useState(false);
  const [loginHint, setLoginHint] = useState<{
    username: string;
    passwordConfigured: boolean;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/admin/login-hint")
      .then((r) => r.json())
      .then((data: { username?: string; passwordConfigured?: boolean }) => {
        if (data.username) {
          setLoginHint({
            username: data.username,
            passwordConfigured: Boolean(data.passwordConfigured),
          });
          setUsername(data.username);
        }
      })
      .catch(() => {});
  }, []);

  const loadClicks = useCallback(async () => {
    if (!token && !password) return;
    setClicksLoading(true);
    try {
      const res = await fetch("/api/admin/clicks?limit=400", {
        headers: adminHeaders(token, password),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        clicks: ClickRow[];
        tree: ClickTree;
        total: number;
        todayCount: number;
        byDestino: Record<string, number>;
      };
      setClicks(data.clicks);
      setClickTree(data.tree);
      setClicksMeta({
        total: data.total,
        todayCount: data.todayCount,
        byDestino: data.byDestino,
      });
    } finally {
      setClicksLoading(false);
    }
  }, [token, password]);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin", {
      headers: adminHeaders(token, password),
    });
    if (!res.ok) {
      setAuthed(false);
      setError("Login inválido ou ADMIN_PASSWORD não configurada");
      return;
    }
    const data = (await res.json()) as {
      pricing: Pricing;
      products: ProductRow[];
      orders: OrderRow[];
      clicks: ClickRow[];
      feedback: FeedbackRow[];
      api: ApiCheck[];
      importLogs?: ImportLogRow[];
      catalog?: CatalogInfo;
      kpis?: Kpis;
      importSummary?: ImportSummary;
    };
    setPricing(data.pricing);
    setProducts(data.products);
    setOrders(data.orders);
    setClicks(data.clicks);
    setFeedback(data.feedback);
    setApi(data.api);
    setImportLogs(data.importLogs || []);
    setCatalog(data.catalog || null);
    setImportSummary(data.importSummary || null);
    setKpis(data.kpis || null);
    setMarkupDraft(String(data.pricing.markup));
    setFxDraft(String(data.pricing.fxBrl));
    setFeeDraft(String(Number((data.pricing.feePct * 100).toFixed(2))));
    setAuthed(true);
  }, [token, password]);

  async function doLogin() {
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await res.json()) as { error?: string; token?: string };
    if (!res.ok || !data.token) {
      setAuthed(false);
      setError(data.error || "Login falhou");
      return;
    }
    setToken(data.token);
    sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    const bundle = await fetch("/api/admin", {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    if (!bundle.ok) {
      setError("Sessão ok, mas falha ao carregar painel");
      return;
    }
    const payload = (await bundle.json()) as {
      pricing: Pricing;
      products: ProductRow[];
      orders: OrderRow[];
      clicks: ClickRow[];
      feedback: FeedbackRow[];
      api: ApiCheck[];
      importLogs?: ImportLogRow[];
      catalog?: CatalogInfo;
      kpis?: Kpis;
      importSummary?: ImportSummary;
    };
    setPricing(payload.pricing);
    setProducts(payload.products);
    setOrders(payload.orders);
    setClicks(payload.clicks);
    setFeedback(payload.feedback);
    setApi(payload.api);
    setImportLogs(payload.importLogs || []);
    setCatalog(payload.catalog || null);
    setImportSummary(payload.importSummary || null);
    setKpis(payload.kpis || null);
    setMarkupDraft(String(payload.pricing.markup));
    setFxDraft(String(payload.pricing.fxBrl));
    setFeeDraft(String(Number((payload.pricing.feePct * 100).toFixed(2))));
    setAuthed(true);
    setPassword("");
  }

  useEffect(() => {
    const savedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!savedToken) return;
    setToken(savedToken);
    void (async () => {
      const res = await fetch("/api/admin/session", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!res.ok) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken("");
        return;
      }
      const bundle = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!bundle.ok) return;
      const data = (await bundle.json()) as {
        pricing: Pricing;
        products: ProductRow[];
        orders: OrderRow[];
        clicks: ClickRow[];
        feedback: FeedbackRow[];
        api: ApiCheck[];
        importLogs?: ImportLogRow[];
        catalog?: CatalogInfo;
        kpis?: Kpis;
        importSummary?: ImportSummary;
      };
      setPricing(data.pricing);
      setProducts(data.products);
      setOrders(data.orders);
      setClicks(data.clicks);
      setFeedback(data.feedback);
      setApi(data.api);
      setImportLogs(data.importLogs || []);
      setCatalog(data.catalog || null);
      setImportSummary(data.importSummary || null);
      setKpis(data.kpis || null);
      setMarkupDraft(String(data.pricing.markup));
      setFxDraft(String(data.pricing.fxBrl));
      setFeeDraft(String(Number((data.pricing.feePct * 100).toFixed(2))));
      setAuthed(true);
    })();
  }, []);

  useEffect(() => {
    if (authed && tab === "cliques") void loadClicks();
  }, [authed, tab, loadClicks]);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 2500);
    return () => window.clearTimeout(t);
  }, [msg]);

  async function put(body: unknown) {
    const res = await fetch("/api/admin", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders(token, password),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      throw new Error(d.error || "Falha");
    }
    return res.json();
  }

  async function savePricing() {
    try {
      await put({
        action: "update_pricing",
        pricing: {
          markup: Number(markupDraft),
          fxBrl: Number(fxDraft),
          feePct: Number(feeDraft) / 100,
        },
      });
      setMsg("Markup salvo. Novos imports/sync usam essa regra.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar markup");
    }
  }

  async function patchProduct(
    productId: string,
    productPatch: { salePrice?: number; active?: boolean },
  ) {
    try {
      await put({ action: "update_neon_product", productId, productPatch });
      setMsg("Produto atualizado");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no produto");
    }
  }

  async function deleteProduct(productId: string, hard: boolean) {
    const ok = window.confirm(
      hard
        ? "Excluir permanentemente este produto?"
        : "Desativar e tirar da vitrine?",
    );
    if (!ok) return;
    try {
      await put({ action: "delete_product", productId, hard });
      setMsg(hard ? "Produto excluído" : "Produto desativado");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir");
    }
  }

  async function searchCj() {
    if (!searchQ.trim()) {
      setError("Digite uma palavra-chave (ex: vacuum, pet, fan)");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cj/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminHeaders(token, password),
        },
        body: JSON.stringify({ keyword: searchQ.trim(), pageSize: 20 }),
      });
      const data = (await res.json()) as {
        error?: string;
        results?: SearchHit[];
      };
      if (!res.ok) throw new Error(data.error || "Falha na busca");
      setSearchHits(data.results || []);
      setSelectedPids([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na busca CJ");
    } finally {
      setSearching(false);
    }
  }

  async function importSelected(pids: string[]) {
    if (!pids.length) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cj/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminHeaders(token, password),
        },
        body: JSON.stringify({ cjProductIds: pids.slice(0, 10) }),
      });
      const data = (await res.json()) as {
        error?: string;
        imported?: { name: string; slug: string }[];
        errors?: { pid: string; error: string }[];
      };
      if (!res.ok) throw new Error(data.error || "Falha no import");
      const n = data.imported?.length || 0;
      const errs = data.errors?.length || 0;
      setMsg(
        `Importados: ${n}${errs ? ` · erros: ${errs}` : ""}`,
      );
      if (data.errors?.length) {
        setError(data.errors.map((e) => `${e.pid}: ${e.error}`).join(" · "));
      }
      await load();
      await searchCj();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no import");
    } finally {
      setImporting(false);
    }
  }

  async function exportCsv(type: "orders" | "clicks" | "products") {
    try {
      const res = await fetch(`/api/admin/export?type=${type}`, {
        headers: adminHeaders(token, password),
      });
      if (!res.ok) throw new Error("Falha no export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(`Export ${type} baixado`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no export");
    }
  }

  async function reenrichThinProducts() {
    const ok = window.confirm(
      "Reenricher produtos magros do CJ?\n\nRecarrega fotos, cores, tamanhos, medidas e descrição nos itens que ficaram com 1 foto / sem opções.",
    );
    if (!ok) return;
    setReenrichRunning(true);
    setError(null);
    setAutoLog("Reenrich: buscando galeria e opções na CJ…");
    try {
      const res = await fetch("/api/admin/cj/reenrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminHeaders(token, password),
        },
        body: JSON.stringify({ limit: 25, onlyThin: true }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: number;
        fail?: number;
        skipped?: number;
        details?: { pid: string; slug?: string; status: string; error?: string }[];
      };
      if (!res.ok) throw new Error(data.error || "Falha no reenrich");
      setMsg(
        `Reenrich: ${data.ok ?? 0} ok · ${data.fail ?? 0} falhas · ${data.skipped ?? 0} já completos`,
      );
      setAutoLog(
        (data.details || [])
          .map((d) =>
            d.error
              ? `✗ ${d.slug || d.pid}: ${d.error}`
              : `✓ ${d.slug || d.pid}: ${d.status}`,
          )
          .join("\n") || "Nada a reenricher",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no reenrich");
    } finally {
      setReenrichRunning(false);
    }
  }

  async function autoImportTop30() {
    const ok = window.confirm(
      "Forçar uma rodada agora?\n\nPega o top de listagens (vendas) da CJ, só com estoque, até 30 produtos.",
    );
    if (!ok) return;
    setAutoRunning(true);
    setError(null);
    setAutoLog("Rodada forçada: top vendas COM estoque…");
    try {
      const res = await fetch("/api/admin/cj/auto-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...adminHeaders(token, password),
        },
        body: JSON.stringify({ limit: 30 }),
      });
      const data = (await res.json()) as {
        error?: string;
        selected?: number;
        imported?: { name: string; slug: string; category: string; salePrice: number }[];
        errors?: { pid: string; error: string }[];
        skipped?: { pid: string; reason: string }[];
        activeCount?: number;
        catalogCap?: number;
        slotsLeft?: number;
      };
      if (!res.ok) throw new Error(data.error || "Falha no auto-import");
      const n = data.imported?.length || 0;
      const errs = data.errors?.length || 0;
      setMsg(
        `Rodada: ${n} novos · ${errs} erros · ${data.activeCount ?? "?"}/${data.catalogCap ?? 200} na vitrine`,
      );
      setAutoLog(
        (data.imported || [])
          .map(
            (p) =>
              `✓ [${p.category}] ${p.name} — R$ ${p.salePrice.toFixed(2)}`,
          )
          .concat(
            (data.errors || []).map((e) => `✗ ${e.pid}: ${e.error}`),
          )
          .join("\n") || "Nada novo nesta rodada (já estava tudo importado).",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no auto-import");
      setAutoLog(null);
    } finally {
      setAutoRunning(false);
    }
  }

  async function patchOrder(orderId: string, patch: Record<string, unknown>) {
    await put({ action: "update_order", orderId, patch });
    await load();
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Admin · Capitão
          </h1>
          <button
            type="button"
            onClick={() => setLoginHelpOpen((v) => !v)}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-gold hover:text-gold"
            aria-expanded={loginHelpOpen}
          >
            Ajuda
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Igual Sensor Tattoo Fix: <strong className="text-white">usuário + senha</strong>{" "}
          definidos no Vercel — não existe cadastro de admin no site.
        </p>
        {loginHelpOpen ? (
          <div className="mt-4 rounded-md border border-line bg-card p-4 text-sm text-muted">
            <p>
              <strong className="text-white">Usuário:</strong>{" "}
              <code className="text-gold">{loginHint?.username || "admin"}</code>{" "}
              (<code>ADMIN_USERNAME</code> no Vercel)
            </p>
            <p className="mt-2">
              <strong className="text-white">Senha:</strong> valor de{" "}
              <code className="text-gold">ADMIN_PASSWORD</code> no Vercel → Settings →
              Environment Variables → Production.
            </p>
            <p className="mt-2">
              Depois do login: aba <strong className="text-gold">Cliques</strong> → árvore
              Ano → Mês → Dia → Visitante → Sessão (IP, cidade, origem).
            </p>
            {loginHint && !loginHint.passwordConfigured ? (
              <p className="mt-2 text-red-400">
                ADMIN_PASSWORD não está configurado em produção.
              </p>
            ) : null}
          </div>
        ) : null}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuário"
          autoComplete="username"
          className="mt-6 w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void doLogin();
          }}
          placeholder="Senha (ADMIN_PASSWORD do Vercel)"
          autoComplete="current-password"
          className="mt-3 w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
        />
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={() => void doLogin()}
          className="mt-4 w-full rounded-md bg-gold py-3 font-bold text-black"
        >
          Entrar
        </button>
        <p className="mt-6 text-xs text-muted">
          URL:{" "}
          <a href="/admin" className="text-gold hover:underline">
            /admin
          </a>
          · Catálogo CJ:{" "}
          <a
            href="https://cjdropshipping.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            cjdropshipping.com
          </a>
        </p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "vendas", label: `Vendas (${orders.length})` },
    { id: "produtos", label: `Produtos (${products.length})` },
    { id: "importar", label: "Importar CJ" },
    { id: "markup", label: "Markup" },
    { id: "cliques", label: `Cliques (${clicks.length})` },
    { id: "sugestoes", label: `Sugestões (${feedback.length})` },
    { id: "api", label: "API" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Admin · Capitão Fantástico
          </h1>
          <p className="mt-1 text-sm text-muted">
            Só olhar: lucros, pedidos, cliques · a loja vende e envia sozinha
            {pricing
              ? ` · markup ${pricing.markup}× · FX ${pricing.fxBrl} · MP ${(pricing.feePct * 100).toFixed(0)}%`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportCsv("orders")}
            className="rounded-md border border-line px-4 py-2 text-sm text-white hover:border-gold"
          >
            Export vendas
          </button>
          <button
            type="button"
            onClick={() => void exportCsv("clicks")}
            className="rounded-md border border-line px-4 py-2 text-sm text-white hover:border-gold"
          >
            Export cliques
          </button>
          <a
            href="https://cjdropshipping.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line px-4 py-2 text-sm text-gold hover:border-gold"
          >
            Abrir CJ
          </a>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-line px-4 py-2 text-sm text-white hover:border-gold"
          >
            Atualizar
          </button>
        </div>
      </div>

      {kpis ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Comissão (líquida)",
              value: formatBRL(kpis.commission),
              hint: `${kpis.ordersPaid} pedidos pagos+`,
            },
            {
              label: "Faturamento",
              value: formatBRL(kpis.revenue),
              hint: `${kpis.ordersTotal} pedidos no total`,
            },
            {
              label: "Índice de Missão",
              value:
                kpis.missionIndex == null
                  ? "—"
                  : `${kpis.missionIndex.toFixed(0)}%`,
              hint:
                kpis.missionAsked === 0
                  ? "Aguardando entregas"
                  : `👍 ${kpis.missionOk} · 👎 ${kpis.missionHelp} · ${kpis.missionAsked} perguntados`,
            },
            {
              label: "Cliques",
              value: String(kpis.clicksTotal),
              hint: `${kpis.clicksWhatsapp} WhatsApp`,
            },
            {
              label: "Catálogo ativo",
              value: `${kpis.activeProducts}/${kpis.catalogCap}`,
              hint: "import 1×/dia · só com estoque",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-[14px] border border-[#333] bg-[#141414] px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {c.label}
              </p>
              <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-gold">
                {c.value}
              </p>
              <p className="mt-1 text-xs text-muted">{c.hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t.id ? "bg-gold text-black" : "border border-line text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg ? (
        <p className="mt-4 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
          {msg}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {tab === "vendas" ? (
        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <p className="text-muted">Nenhuma venda ainda.</p>
          ) : (
            <div className="overflow-x-auto rounded-[14px] border border-[#333]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#333] bg-[#141414] text-muted">
                  <tr>
                    <th className="px-3 py-3">Pedido</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Custo (paguei)</th>
                    <th className="px-3 py-3">Cobrado</th>
                    <th className="px-3 py-3">Taxa MP</th>
                    <th className="px-3 py-3">Comissão</th>
                    <th className="px-3 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderId} className="border-b border-[#2a2a2a] text-white">
                      <td className="px-3 py-3 align-top">
                        <p className="font-semibold">{o.orderId}</p>
                        <p className="text-xs text-muted">
                          {new Date(o.createdAt).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-gold">{o.status}</p>
                        {o.missionResponse === "ok" ? (
                          <p className="text-xs text-emerald-400">Missão 👍</p>
                        ) : o.missionResponse === "help" ? (
                          <p className="text-xs text-amber-400">Missão 👎 ajuda</p>
                        ) : o.missionAskedAt ? (
                          <p className="text-xs text-muted">Missão: aguardando</p>
                        ) : null}
                        {(o.messageCount || 0) > 0 ? (
                          <p className="text-xs text-gold">
                            {o.messageCount} msg na página
                          </p>
                        ) : null}
                        {o.returnStatus && o.returnStatus !== "none" ? (
                          <p className="text-xs text-amber-300">
                            Devolução: {o.returnStatus}
                          </p>
                        ) : null}
                        {o.warrantyStatus && o.warrantyStatus !== "none" ? (
                          <p className="text-xs text-amber-300">
                            Garantia: {o.warrantyStatus}
                          </p>
                        ) : null}
                        <a
                          href={`/pedido/${encodeURIComponent(o.orderId)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-gold hover:underline"
                        >
                          Abrir página do cliente
                        </a>
                        <ul className="mt-1 text-xs text-muted">
                          {o.items.map((it, i) => (
                            <li key={`${o.orderId}-${i}`}>
                              {it.qty}× {it.name}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3 align-top text-muted">
                        {o.nome}
                        <br />
                        {o.email}
                      </td>
                      <td className="px-3 py-3 align-top">{formatBRL(o.costPaid)}</td>
                      <td className="px-3 py-3 align-top font-semibold">
                        {formatBRL(o.charged)}
                      </td>
                      <td className="px-3 py-3 align-top text-red-300">
                        −{formatBRL(o.mpFee)}
                      </td>
                      <td className="px-3 py-3 align-top font-bold text-gold">
                        {formatBRL(o.commission)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          {o.status === "pending_payment" ? (
                            <button
                              type="button"
                              onClick={() =>
                                void patchOrder(o.orderId, { status: "paid" })
                              }
                              className="rounded bg-gold px-2 py-1 text-xs font-bold text-black"
                            >
                              Marcar pago
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              const code = window.prompt("Rastreio fornecedor");
                              if (code)
                                void patchOrder(o.orderId, {
                                  supplierTracking: code,
                                  status: "shipped",
                                });
                            }}
                            className="rounded border border-line px-2 py-1 text-xs"
                          >
                            Rastreio
                          </button>
                          {o.status !== "fulfilled" &&
                          o.status !== "cancelled" &&
                          o.status !== "failed" ? (
                            <button
                              type="button"
                              onClick={() =>
                                void patchOrder(o.orderId, {
                                  status: "fulfilled",
                                  ...(o.supplierTracking
                                    ? { supplierTracking: o.supplierTracking }
                                    : {}),
                                })
                              }
                              className="rounded border border-gold/50 px-2 py-1 text-xs text-gold"
                            >
                              Entregue + missão
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              const url = window.prompt(
                                "URL da nota fiscal (PDF/link)",
                                o.invoiceUrl || "",
                              );
                              if (url == null) return;
                              const num = window.prompt(
                                "Número da NF (opcional)",
                                o.invoiceNumber || "",
                              );
                              void patchOrder(o.orderId, {
                                invoiceUrl: url.trim() || undefined,
                                invoiceNumber: (num || "").trim() || undefined,
                              });
                            }}
                            className="rounded border border-line px-2 py-1 text-xs"
                          >
                            Anexar NF
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const text = window.prompt(
                                "Resposta do Capitão na conversa do pedido",
                              );
                              if (!text?.trim()) return;
                              void patchOrder(o.orderId, {
                                _captainReply: text.trim(),
                              });
                            }}
                            className="rounded border border-line px-2 py-1 text-xs"
                          >
                            Responder conversa
                          </button>
                          {o.paymentRef ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Reembolsar ${o.orderId} via Mercado Pago?`,
                                  )
                                )
                                  return;
                                void (async () => {
                                  try {
                                    await put({
                                      action: "refund_order",
                                      orderId: o.orderId,
                                    });
                                    setMsg(`Reembolso ok · ${o.orderId}`);
                                    await load();
                                  } catch (e) {
                                    setError(
                                      e instanceof Error
                                        ? e.message
                                        : "Falha no reembolso",
                                    );
                                  }
                                })();
                              }}
                              className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300"
                            >
                              Reembolsar MP
                            </button>
                          ) : null}
                          <a
                            href={whatsappUrl(
                              `Olá ${o.nome}! Pedido ${o.orderId}${
                                o.supplierTracking
                                  ? ` — rastreio: ${o.supplierTracking}`
                                  : ""
                              }`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded border border-gold/40 px-2 py-1 text-center text-xs text-gold"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted">
            Comissão = cobrado − custo fornecedor (BRL) − taxa MP estimada (
            {pricing ? `${(pricing.feePct * 100).toFixed(0)}%` : "5%"}). Frete CJ
            ainda pode estar zerado em alguns itens.
          </p>
        </div>
      ) : null}

      {tab === "produtos" ? (
        <div className="mt-8 overflow-x-auto rounded-[14px] border border-[#333]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#333] bg-[#141414] text-muted">
              <tr>
                <th className="px-3 py-3">Produto</th>
                <th className="px-3 py-3">Custo CJ</th>
                <th className="px-3 py-3">Custo BRL</th>
                <th className="px-3 py-3">Venda</th>
                <th className="px-3 py-3">Taxa MP</th>
                <th className="px-3 py-3">Comissão líq.</th>
                <th className="px-3 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[#2a2a2a] text-white">
                  <td className="px-3 py-3">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.category} · {p.active ? "ativo" : "inativo"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted">
                    US$ {p.costUsd.toFixed(2)}
                    {p.shippingUsd > 0 ? ` + frete ${p.shippingUsd.toFixed(2)}` : ""}
                  </td>
                  <td className="px-3 py-3">{formatBRL(p.costBrl)}</td>
                  <td className="px-3 py-3 font-semibold">{formatBRL(p.salePrice)}</td>
                  <td className="px-3 py-3 text-red-300">−{formatBRL(p.mpFeeBrl)}</td>
                  <td className="px-3 py-3 font-bold text-gold">
                    {formatBRL(p.netAfterMpBrl)}
                    <span className="ml-1 text-xs font-normal text-muted">
                      ({p.marginPct}%)
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const salePrice = Number(
                            window.prompt("Preço de venda BRL", String(p.salePrice)),
                          );
                          if (!Number.isFinite(salePrice)) return;
                          void patchProduct(p.id, { salePrice });
                        }}
                        className="rounded border border-line px-2 py-1 text-xs"
                      >
                        Preço
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void patchProduct(p.id, { active: !p.active })
                        }
                        className="rounded bg-gold px-2 py-1 text-xs font-bold text-black"
                      >
                        {p.active ? "Off" : "On"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProduct(p.id, true)}
                        className="rounded border border-red-500/50 px-2 py-1 text-xs text-red-300"
                      >
                        Excluir
                      </button>
                      <a
                        href={`/produtos/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-gold/40 px-2 py-1 text-xs text-gold"
                      >
                        Ver
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "importar" ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-[14px] border border-gold/40 bg-gold/10 p-5">
            <h2 className="text-lg font-bold text-gold">
              Piloto automático
            </h2>
            <p className="mt-1 text-sm text-muted">
              Descobre sozinho → publica direto. Prioriza{" "}
              <strong className="text-white">virais/novos</strong>. Só com
              estoque e margem. Meta fixa: {catalog?.cap ?? 200} na vitrine.
            </p>
            {importSummary ? (
              <div className="mt-4 rounded-md border border-[#333] bg-[#111] p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Última atividade do import
                </p>
                <p className="mt-2 text-white">
                  {importSummary.lastRunAt
                    ? `Rodou ${new Date(importSummary.lastRunAt).toLocaleString("pt-BR")} (${importSummary.lastRunSource || "?"})`
                    : "Ainda sem rodada registrada"}
                </p>
                {importSummary.lastRoundMessage ? (
                  <p className="mt-1 text-muted">{importSummary.lastRoundMessage}</p>
                ) : null}
                <p className="mt-2 text-muted">
                  Últimas 24h:{" "}
                  <span className="text-emerald-400">
                    {importSummary.last24h.ok} ok
                  </span>
                  {" · "}
                  <span className="text-gold">
                    {importSummary.last24h.skip} skip
                  </span>
                  {" · "}
                  <span className="text-red-400">
                    {importSummary.last24h.error} erro
                  </span>
                </p>
                <p className="mt-1 text-muted">
                  Último produto publicado:{" "}
                  {importSummary.lastSuccessName && importSummary.lastSuccessAt
                    ? `${importSummary.lastSuccessName} · ${new Date(importSummary.lastSuccessAt).toLocaleString("pt-BR")}`
                    : "nenhum recente (só skips / sem estoque)"}
                </p>
              </div>
            ) : null}
            {catalog ? (
              <p className="mt-2 text-sm text-white">
                Vitrine:{" "}
                <strong className="text-gold">
                  {catalog.activeCount}/{catalog.cap}
                </strong>
                {catalog.slotsLeft > 0
                  ? ` · ${catalog.slotsLeft} vagas`
                  : " · meta cheia"}
                {catalog.activeDbCount != null &&
                catalog.activeDbCount > catalog.activeCount ? (
                  <span className="ml-2 text-muted">
                    · {catalog.activeDbCount - catalog.activeCount} ativos sem
                    estoque (fora da vitrine)
                  </span>
                ) : null}
                {catalog.activeCount === 0 ? (
                  <span className="ml-2 text-red-400">
                    · vitrine vazia (tudo sem estoque CJ)
                  </span>
                ) : null}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              Cron 1×/dia · lote até 20 · botão só força agora
            </p>
            <button
              type="button"
              disabled={autoRunning || (catalog?.slotsLeft ?? 1) <= 0}
              onClick={() => void autoImportTop30()}
              className="mt-4 rounded-md bg-gold px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {autoRunning
                ? "Rodando agora…"
                : catalog?.slotsLeft === 0
                  ? "Teto cheio"
                  : "Forçar rodada agora (opcional)"}
            </button>
            <button
              type="button"
              disabled={reenrichRunning}
              onClick={() => void reenrichThinProducts()}
              className="mt-3 ml-0 rounded-md border border-gold/50 px-6 py-3 text-sm font-bold text-gold hover:bg-gold/10 disabled:opacity-50 sm:ml-3"
            >
              {reenrichRunning
                ? "Reenrichendo…"
                : "Restaurar fotos / cores / tamanhos"}
            </button>
            {autoLog ? (
              <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-[#333] bg-[#111] p-3 text-xs text-[#ccc]">
                {autoLog}
              </pre>
            ) : null}
          </div>

          <div className="rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5">
            <h2 className="text-base font-bold text-white">Log de importações</h2>
            <p className="mt-1 text-xs text-muted">Últimas 40 · ok / erro / teto</p>
            {importLogs.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nenhum log ainda.</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
                {importLogs.map((l) => (
                  <li
                    key={l.id}
                    className="border-b border-[#2a2a2a] pb-2 text-[#ccc]"
                  >
                    <span className="text-xs text-muted">
                      {new Date(l.createdAt).toLocaleString("pt-BR")} · {l.source} ·{" "}
                      <span
                        className={
                          l.status === "ok"
                            ? "text-emerald-400"
                            : l.status === "error"
                              ? "text-red-400"
                              : "text-gold"
                        }
                      >
                        {l.status}
                      </span>
                    </span>
                    <p className="mt-0.5">
                      {l.name ? (
                        <>
                          <span className="text-white">{l.name}</span>
                          {" — "}
                        </>
                      ) : null}
                      {l.message}
                      {l.slug ? (
                        <>
                          {" "}
                          <a
                            href={`/produtos/${l.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold hover:underline"
                          >
                            ver
                          </a>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5">
            <h2 className="text-lg font-bold text-white">
              Import unitário (manual)
            </h2>
            <p className="mt-1 text-sm text-muted">
              Busca por palavra-chave e importa um a um — útil para produto
              específico.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void searchCj();
                }}
                placeholder="Ex: handheld fan, car vacuum, pet vest"
                className="min-w-[240px] flex-1 rounded-md border border-[#333] bg-[#111] px-3 py-2.5 text-white"
              />
              <button
                type="button"
                disabled={searching}
                onClick={() => void searchCj()}
                className="rounded-md border border-line px-5 py-2.5 text-sm font-bold text-white hover:border-gold disabled:opacity-50"
              >
                {searching ? "Buscando…" : "Buscar"}
              </button>
              <button
                type="button"
                disabled={importing || selectedPids.length === 0}
                onClick={() => void importSelected(selectedPids)}
                className="rounded-md border border-gold/50 px-5 py-2.5 text-sm font-bold text-gold disabled:opacity-40"
              >
                {importing
                  ? "Importando…"
                  : `Importar selecionados (${selectedPids.length})`}
              </button>
            </div>
          </div>

          {searchHits.length === 0 ? (
            <p className="text-sm text-muted">
              Nenhum resultado manual ainda. Use o Top 30 acima ou busque por
              palavra-chave.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-[14px] border border-[#333]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#333] bg-[#141414] text-muted">
                  <tr>
                    <th className="px-3 py-3"> </th>
                    <th className="px-3 py-3">Produto CJ</th>
                    <th className="px-3 py-3">Custo</th>
                    <th className="px-3 py-3">Venda est.</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {searchHits.map((h) => (
                    <tr
                      key={h.pid}
                      className="border-b border-[#2a2a2a] text-white"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPids.includes(h.pid)}
                          disabled={h.alreadyImported}
                          onChange={(e) => {
                            setSelectedPids((prev) =>
                              e.target.checked
                                ? [...prev, h.pid]
                                : prev.filter((id) => id !== h.pid),
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={h.imageUrl}
                            alt=""
                            className="h-14 w-14 rounded object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-semibold leading-snug">
                              {h.title.slice(0, 90)}
                            </p>
                            <p className="text-xs text-muted">
                              {h.categoryName || "—"} · {h.pid.slice(0, 12)}…
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted">
                        US$ {h.priceUsd.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-gold">
                        {formatBRL(h.salePriceBrl)}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {h.alreadyImported ? "Já importado" : "Novo"}
                      </td>
                      <td className="px-3 py-3">
                        {h.alreadyImported && h.productSlug ? (
                          <a
                            href={`/produtos/${h.productSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gold hover:underline"
                          >
                            Ver na loja
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled={importing}
                            onClick={() => void importSelected([h.pid])}
                            className="rounded bg-gold px-2 py-1 text-xs font-bold text-black disabled:opacity-50"
                          >
                            Importar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "markup" ? (
        <div className="mt-8 max-w-lg space-y-4 rounded-[14px] border border-[#333] bg-[#1a1a1a] p-6">
          <h2 className="text-lg font-bold text-gold">Regra de preço global</h2>
          <p className="text-sm text-muted">
            venda ≈ (custo USD + frete) × câmbio × (1 + taxa) × markup → arredonda
            .90
          </p>
          <label className="block text-sm text-white">
            Markup (ex. 2.3 = 130% sobre custo+taxa)
            <input
              value={markupDraft}
              onChange={(e) => setMarkupDraft(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5"
            />
          </label>
          <label className="block text-sm text-white">
            Câmbio USD → BRL
            <input
              value={fxDraft}
              onChange={(e) => setFxDraft(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5"
            />
          </label>
          <label className="block text-sm text-white">
            Taxa Mercado Pago (%)
            <input
              value={feeDraft}
              onChange={(e) => setFeeDraft(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5"
            />
          </label>
          <button
            type="button"
            onClick={() => void savePricing()}
            className="w-full rounded-md bg-gold py-3 font-bold text-black"
          >
            Salvar markup
          </button>
          <p className="text-xs text-muted">
            Produtos já importados não recalculam sozinhos — rode o sync ou ajuste
            o preço na aba Produtos. Novos imports usam a regra nova.
          </p>
        </div>
      ) : null}

      {tab === "cliques" ? (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              Árvore Ano → Mês → Dia → Visitante → Sessão · IP resumido ·
              cidade/UF/país
            </p>
            <button
              type="button"
              disabled={clicksLoading}
              onClick={() => void loadClicks()}
              className="rounded-md border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              {clicksLoading ? "Atualizando…" : "Atualizar"}
            </button>
          </div>
          {clickTree ? (
            <AdminClicksTree
              tree={clickTree}
              total={clicksMeta?.total}
              todayCount={clicksMeta?.todayCount}
              byDestino={clicksMeta?.byDestino}
            />
          ) : (
            <p className="text-muted">Carregando cliques…</p>
          )}
        </div>
      ) : null}

      {tab === "sugestoes" ? (
        <div className="mt-8 space-y-4">
          {feedback.length === 0 ? (
            <p className="text-muted">Nenhuma sugestão ainda.</p>
          ) : (
            feedback.map((f) => (
              <div key={f.id} className="rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5">
                <p className="font-bold text-gold">{kindLabel(f.kind)}</p>
                <p className="mt-1 text-sm text-muted">
                  {f.name} ·{" "}
                  <a href={`mailto:${f.email}`} className="text-white hover:text-gold">
                    {f.email}
                  </a>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-white/90">
                  {f.message}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "api" ? (
        <div className="mt-8 space-y-3">
          {api.map((c) => (
            <div
              key={c.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#333] bg-[#1a1a1a] px-4 py-3"
            >
              <div>
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-sm text-muted">{c.detail}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  c.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {c.ok ? "OK" : "FALTA"}
              </span>
            </div>
          ))}
          <p className="pt-2 text-sm text-muted">
            Fornecedor:{" "}
            <a
              href="https://cjdropshipping.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              https://cjdropshipping.com
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
