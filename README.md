# Capitão Fantástico — loja própria (Next.js)

Utilidades do lar + tecnologia inteligente. Dropshipping com Mercado Pago.

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
# Produção na Vercel (obrigatório para pedidos não sumirem):
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Sem `MP_ACCESS_TOKEN`, o checkout roda em **modo demo**.

## Rotas

- `/` — home
- `/produtos` — catálogo (só produtos ativos)
- `/checkout` — dados + endereço + Mercado Pago
- `/admin` — pedidos, preços, custo, rastreio
- `/api/webhooks/mercadopago` — marca pedido pago
- `/termos` · `/privacidade` · `/faq` · `/sobre` · `/contato`

## Operação drop

Veja [docs/DROPSHIPPING.md](docs/DROPSHIPPING.md).
