# Capitão Fantástico — loja própria (Next.js)

Utilidades do lar + tecnologia inteligente. Catálogo, carrinho e checkout no site.

## Rodar

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra [http://127.0.0.1:3001](http://127.0.0.1:3001) (ou a porta que o Next indicar).

## Mercado Pago (Pix + cartão)

1. Crie um app em [developers.mercadopago.com](https://www.mercadopago.com.br/developers/panel/app)
2. Copie o **Access Token** (teste ou produção)
3. No `.env.local`:

```bash
MP_ACCESS_TOKEN=APP_USR-...
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

Sem token, o checkout roda em **modo demo** (pedido simulado).

## Rotas

- `/` — home da marca
- `/produtos` — catálogo
- `/produtos/[slug]` — produto
- `/carrinho` — carrinho
- `/checkout` — pagamento
- `/api/checkout` — cria preferência Mercado Pago
