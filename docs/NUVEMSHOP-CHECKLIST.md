# Checklist Nuvemshop — Capitão Fantástico

Use este guia ao criar a loja. Marque cada item conforme concluir.

Empresa: **3N20 Soluções Tecnológicas Ltda** · CNPJ `29.321.223/0001-32`

---

## 1. Conta e loja

- [ ] Criar conta em [nuvemshop.com.br](https://www.nuvemshop.com.br/)
- [ ] Nome da loja: **Capitão Fantástico**
- [ ] Idioma: Português (Brasil) · Moeda: BRL
- [ ] Preencher dados fiscais com CNPJ da 3N20
- [ ] Confirmar e-mail e telefone de atendimento
- [ ] Anotar a URL gerada (ex.: `https://seunome.lojavirtualnuvem.com.br`)

## 2. Domínio

- [ ] No início: usar o subdomínio Nuvemshop
- [ ] Depois: comprar domínio (ex. `capitaofantastico.com.br`) e apontar no painel
- [ ] Ativar HTTPS (automático na Nuvemshop)

## 3. Pagamentos

- [ ] Ativar **Pix** (meio nativo / parceiro da Nuvemshop)
- [ ] Ativar **cartão de crédito**
- [ ] Testar compra em modo sandbox ou valor baixo
- [ ] Conferir prazo de recebimento e taxas

## 4. Frete

- [ ] Configurar Correios e/ou Melhor Envio
- [ ] Definir CEP de origem (endereço da empresa)
- [ ] Testar cálculo com CEPs de SP, RJ e interior
- [ ] Definir política de frete grátis (opcional, ex. acima de R$ 199)

## 5. Produtos iniciais (5–10)

Nicho: utilidades do lar + tecnologia inteligente.

Sugestão alinhada à vitrine do site:

1. Luminária Smart Halo  
2. Organizador Giratório 360°  
3. Tomada Inteligente Duo  
4. Mop Spray Compacto  
5. Sensor de Porta  
6. Kit Cabides Antideslizantes  
7. Câmera Mini Indoor  
8. Dispenser Automático de Sabão  

Para cada produto:

- [ ] Título claro + fotos boas (fundo limpo)
- [ ] Descrição objetiva (benefício + como usar)
- [ ] Preço de venda e custo do fornecedor anotados
- [ ] Estoque “ilimitado” ou alto (dropshipping)
- [ ] SKU interno para localizar no fornecedor
- [ ] Categoria: Lar ou Tech

## 6. Políticas na loja

- [ ] Política de troca/devolução (7 dias CDC)
- [ ] Política de frete e prazos
- [ ] Página Sobre / Contato com e-mail e CNPJ
- [ ] Termos e privacidade (modelo Nuvemshop)

## 7. Ligar o site à loja

- [ ] Copiar a URL final da loja
- [ ] No projeto `capitao-fantastico`, criar `.env.local`:

```bash
NEXT_PUBLIC_NUVEMSHOP_URL=https://SUA-URL-AQUI
```

- [ ] Rodar `npm run dev` e testar os botões **Ir à loja** / **Comprar**
- [ ] Conferir se os links da vitrine abrem o produto certo (ajuste `storePath` em `src/data/products.ts`)

## 8. Antes de anunciar

- [ ] IE / emissão de NF alinhada com o contador (obrigatório para mercadoria)
- [ ] Pedido teste ponta a ponta (compra → fornecedor → rastreio)
- [ ] Instagram / WhatsApp de atendimento prontos

---

Quando a URL da loja estiver pronta, cole aqui no chat ou atualize o `.env.local` — os CTAs do site já leem `NEXT_PUBLIC_NUVEMSHOP_URL`.
