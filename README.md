# Capitão Fantástico — loja própria (Next.js)

Utilidades do lar + tecnologia inteligente. Checkout com Mercado Pago.

## Rodar

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Variáveis

```bash
NEXT_PUBLIC_SITE_URL=https://www.capitaofantastico.com.br
MP_ACCESS_TOKEN=APP_USR-...
ADMIN_PASSWORD=senha-forte
DATABASE_URL=
CJ_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Sem `MP_ACCESS_TOKEN`, o checkout roda em **modo demo**.

## Importador CJ — piloto automático (sem custo de IA)

Roda **sozinho** via cron (`/api/jobs/auto-import-cj`, a cada 2h):

- Busca trending + mais listados por nicho
- Já existe → ignora · Novo/bombando → importa e publica
- Copy/SEO com templates locais (sem OpenAI)
- Mídia hotlink CJ (sem Blob)
- Sync preço/estoque: `/api/jobs/sync-catalog`

`AUTO_IMPORT_BATCH=5` — novos por execução.

## Rotas

- `/` — home
- `/produtos` — catálogo (só produtos ativos)
- `/checkout` — dados + endereço + Mercado Pago
- `/admin` — vendas, produtos, importar CJ, markup, cliques
- `/api/webhooks/mercadopago` — marca pedido pago
- `/termos` · `/privacidade` · `/faq` · `/sobre` · `/contato`

## Operação

Veja [docs/DROPSHIPPING.md](docs/DROPSHIPPING.md).
