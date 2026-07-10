/**
 * Configuração da marca Capitão Fantástico.
 * Checkout: Mercado Pago (MP_ACCESS_TOKEN no .env.local).
 */
export const siteConfig = {
  brand: "Capitão Fantástico",
  slogan: "Só entra aqui o que o Capitão aprova.",
  tagline: "Produtos incríveis. Soluções inteligentes.",
  positioning:
    "O Capitão Fantástico testa e seleciona os produtos mais incríveis. Só entra na loja aquilo que realmente resolve um problema.",
  company: "3N20 Soluções Tecnológicas Ltda",
  cnpj: "29.321.223/0001-32",
  email: "contato@3n20.com.br",
  whatsapp: "5511984215176",
  social: {
    instagram: "https://instagram.com/capitaofantastico",
  },
} as const;

export function whatsappUrl(text?: string) {
  const msg = encodeURIComponent(
    text ?? `Olá! Vim da loja ${siteConfig.brand}.`,
  );
  return `https://wa.me/${siteConfig.whatsapp}?text=${msg}`;
}
