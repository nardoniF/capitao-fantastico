/**
 * Configuração da marca Capitão Fantástico.
 * Checkout: Mercado Pago (MP_ACCESS_TOKEN no .env.local).
 */
export const siteConfig = {
  brand: "Capitão Fantástico",
  slogan: "Utilidades do lar e tecnologia inteligente, sem complicação.",
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
