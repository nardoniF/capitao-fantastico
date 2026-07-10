# Capitão Fantástico — o que o site faz vs o que o dropshipping não entrega

## Modelo

Cliente compra na loja → paga (Mercado Pago) → você repassa o pedido ao **fornecedor** → fornecedor envia e gera rastreio.

A 3N20 (CNPJ) é a marca/atendimento. Não há estoque próprio nem etiqueta Correios no painel (isso fica com o fornecedor).

---

## O que o site já entrega (como a STF, adaptado)

| Área | Onde |
|---|---|
| SEO (meta, sitemap, robots, JSON-LD) | `app/sitemap.ts`, `robots.ts`, `JsonLd` |
| Quem somos / FAQ / Contato | `/sobre`, `/faq`, `/contato` |
| WhatsApp float + e-mail `contato@3n20.com.br` | `WhatsAppFloat`, `site-config` |
| Catálogo + produto grande | `/produtos`, `/produtos/[slug]` |
| Carrinho + checkout + upsell complementar | `/carrinho`, `/checkout` |
| Pedidos (API + admin) | `/api/orders`, `/admin` |
| Preços / ativar produto | Admin → Produtos |
| Cliques (WhatsApp etc.) | `/api/analytics/click`, Admin → Cliques |
| Pagamento | Mercado Pago Checkout Pro |

## O que NÃO portamos da STF (não faz sentido no drop)

- Cotação/etiqueta Correios, motoboy, Uber
- Estoque KV / baixa automática
- Conta do cliente (minha-conta)
- Afiliados/comissionados
- Multi-gateway (Asaas/PayPal)
- Compatibilidade smartwatch/película

## Variáveis de ambiente

```bash
NEXT_PUBLIC_SITE_URL=https://www.capitaofantastico.com.br
MP_ACCESS_TOKEN=APP_USR-...
ADMIN_PASSWORD=sua-senha-forte
```

## Admin

1. Configure `ADMIN_PASSWORD` na Vercel
2. Abra `/admin`
3. Pedidos → marcar pago → colar rastreio do fornecedor
4. Produtos → preço / ativar-desativar
5. Cliques → ver engajamento

## Persistência

Pedidos/cliques/produtos ficam em memória + arquivo `data/store-runtime.json` quando o filesystem permite.

Na Vercel (serverless) o disco é limitado: para produção estável, depois ligue **Upstash Redis / Vercel KV** (mesmo contrato da API). Até lá, use o admin logo após o pedido e anote rastreio.

## Fluxo operacional drop

1. Cliente paga no site
2. Você vê o pedido no `/admin`
3. Compra no fornecedor (1688 / nacional / etc.)
4. Cola o rastreio no admin
5. Avisa o cliente no WhatsApp/e-mail
