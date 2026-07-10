# Capitão Fantástico — o que o site faz vs o que o dropshipping não entrega

## Modelo

Cliente compra na loja → paga (Mercado Pago) → você repassa o pedido ao **fornecedor** → fornecedor envia e gera rastreio.

A 3N20 (CNPJ) é a marca/atendimento. Não há estoque próprio nem etiqueta Correios no painel (isso fica com o fornecedor).

---

## Checklist go-live

1. **Vercel env**
   - `NEXT_PUBLIC_SITE_URL=https://www.capitaofantastico.com.br`
   - `MP_ACCESS_TOKEN` (produção)
   - `ADMIN_PASSWORD` (forte)
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (pedidos não somem na Vercel)
2. **Mercado Pago** — webhook aponta para `https://www.capitaofantastico.com.br/api/webhooks/mercadopago` (também enviado em `notification_url` na preferência)
3. **Admin** `/admin` — testar login, editar preço/custo, ver pedido com endereço
4. **Fotos reais** — trocar Unsplash pelas fotos do fornecedor (admin ou `src/data/products.ts`)
5. **SKU fornecedor** — preencher no admin (botão Fornecedor) para recompra rápida
6. **DNS** Valid no domínio + SSL

## Fluxo operacional drop

1. Cliente preenche **dados + endereço** e paga no Mercado Pago
2. Webhook marca pedido como **paid** (ou você marca manual no admin)
3. Você vê no `/admin`: itens, total, CEP/rua/cidade, WhatsApp
4. Compra no fornecedor com o endereço do cliente
5. Cola o **rastreio** no admin → status `fulfilled`
6. Avisa o cliente (botão WhatsApp no admin)

## O que o site já entrega

| Área | Onde |
|---|---|
| SEO (meta, sitemap, robots, JSON-LD) | `app/sitemap.ts`, `robots.ts`, `JsonLd` |
| Quem somos / FAQ / Contato / Termos / Privacidade | `/sobre`, `/faq`, `/contato`, `/termos`, `/privacidade` |
| WhatsApp float + e-mail | `WhatsAppFloat`, `site-config` |
| Catálogo dinâmico (só ativos) | `/produtos`, store-db |
| Carrinho + checkout + endereço + upsell | `/carrinho`, `/checkout` |
| Pedidos + webhook MP | `/api/orders`, `/api/webhooks/mercadopago` |
| Preço / custo / SKU / ativar | Admin → Produtos |
| Cliques | Admin → Cliques |

## O que NÃO portamos da STF (não faz sentido no drop)

- Cotação/etiqueta Correios, motoboy, Uber
- Estoque KV / baixa automática
- Conta do cliente (minha-conta)
- Afiliados/comissionados
- Multi-gateway (Asaas/PayPal)

## Variáveis de ambiente

```bash
NEXT_PUBLIC_SITE_URL=https://www.capitaofantastico.com.br
MP_ACCESS_TOKEN=APP_USR-...
ADMIN_PASSWORD=sua-senha-forte
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

## Persistência

1. **Com Upstash Redis** (recomendado na Vercel): pedidos, produtos e cliques ficam estáveis entre deploys.
2. **Sem Redis**: memória + `data/store-runtime.json` local; na Vercel o disco é efêmero — use Redis antes de vender de verdade.

Crie um database gratuito em [upstash.com](https://upstash.com) → Redis → copie REST URL e TOKEN para a Vercel.
