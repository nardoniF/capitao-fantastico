# Capitão Fantástico — Motor próprio (MVP ~1 mês)

## Decisão

- **Loja:** Capitão Fantástico (Next.js atual + domínio)
- **Não usar:** Dropi / Shopify como motor
- **1º fornecedor:** CJ Dropshipping (API pública de catálogo, estoque, pedido, tracking)
- **Depois:** outros adapters (nacional, BigBuy…) sem reescrever a loja

## O que o MVP entrega

1. Produtos vindos do CJ (10–20 SKUs escolhidos)
2. Preço de venda **calculado** (nunca fixo na mão):
   - `sale_price = (supplier_price + shipping_estimate + fees) * markup`
3. Cron 4×/dia atualiza preço + estoque
4. Cliente paga no Mercado Pago → webhook → **CJ createOrder** automático
5. Tracking volta → pedido atualizado no admin → (e-mail/WhatsApp depois)

## O que fica de fora no mês 1

- AliExpress / BigBuy / Melhor Envio / Asaas
- IA gerando título/SEO
- Multi-fornecedor por produto (Amazon-style)
- NestJS separado (mesma arquitetura, dentro do Next.js primeiro — menos ops)

## Arquitetura MVP (dentro do repo atual)

```
Next.js (Capitão)
  ├── /app          → vitrine
  ├── /api          → checkout, webhooks, admin, jobs
  └── /lib
        ├── suppliers/
        │     ├── types.ts          (interface Supplier)
        │     └── cj/               (CJSupplier)
        ├── pricing.ts              (markup)
        └── db (Prisma + Postgres)

Cron (Vercel)
  → /api/jobs/sync-catalog
  → /api/jobs/fulfill-orders
  → /api/jobs/sync-tracking

Webhook MP
  → marca paid
  → enfileira fulfillment (tabela jobs)
  → worker/cron chama CJ.createOrder()
```

**Fila no MVP:** tabela `FulfillmentJob` + cron (sem BullMQ/worker 24h — Vercel Hobby não segura worker Redis o tempo todo). Depois sobe Railway/Fly se precisar.

## Banco (Prisma)

- `Supplier` — cj, nacional…
- `SupplierProduct` — id externo, vid/sku, custo, estoque
- `Product` — o que a loja mostra (liga a SupplierProduct)
- `Order` / `OrderItem`
- `Payment`
- `FulfillmentJob`
- `Tracking`
- `PricingRule` — markup global (ex.: 2.3)

## Markup (exemplo)

```
custo CJ        US$ 12
frete estimado  US$  4
subtotal        US$ 16
× markup 2.3  = US$ 36.80
câmbio + buffer → R$ 189,90 (arredonda pra .90)
```

Configurável no admin: `markup`, `fx_brl`, `fee_pct`.

## Semana a semana

| Semana | Entrega |
|--------|---------|
| 1 | Prisma + Postgres, interface Supplier, auth CJ, sync manual de 10 produtos |
| 2 | Markup + vitrine lendo do banco + cron sync preço/estoque |
| 3 | Webhook MP → createOrder CJ + admin mostra status fornecedor |
| 4 | Tracking sync, polish admin, 15–20 produtos curados, go-live soft |

## Contas que você precisa criar (grátis / trial)

1. **CJ Dropshipping** — conta + API Access Token  
   https://developers.cjdropshipping.com  
2. **Neon** (Postgres free) ou similar  
3. **Upstash Redis** — opcional no MVP (jobs no Postgres bastam)

Env novas:

```bash
DATABASE_URL=
CJ_API_KEY=
CJ_EMAIL=
CJ_PASSWORD=
# ou CJ_ACCESS_TOKEN se já tiver
PRICING_MARKUP=2.3
PRICING_FX_BRL=5.6
CRON_SECRET=
```

## Próximo passo de código

1. Adicionar Prisma + schema  
2. `Supplier` interface + `CJSupplier` (auth + list + stock + createOrder stub)  
3. Script/admin “importar produto CJ por ID”  
4. Ligar catálogo da home ao banco  

Quando você tiver o token CJ, pluga e testa o primeiro pedido sandbox/real.
