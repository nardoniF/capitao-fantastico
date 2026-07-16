/**
 * Tom de voz e presença do Capitão Fantástico na loja.
 */
export const siteConfig = {
  brand: "Capitão Fantástico",
  /** Meta fixa de vitrine (marketing + teto operacional). */
  catalogTarget: 200,
  slogan: "Só entra aqui o que o Capitão aprova.",
  tagline: "Os 200 produtos mais bem avaliados da internet.",
  positioning:
    "O Capitão garimpou a internet inteira e selecionou os 200 melhores — tecnologia, casa, carro, pets e mais, com estoque real, suporte em português e rastreio no site.",
  heroSupport: "Só entra aqui o que o Capitão aprova.",
  company: "3N20 Soluções Tecnológicas Ltda",
  cnpj: "29.321.223/0001-32",
  email: "contato@capitaofantastico.com.br",
  whatsapp: "5511984215176",
  social: {
    instagram: "https://instagram.com/capitaofantastico",
  },
  captainQuote: "Esse é um dos meus favoritos. Uso e recomendo.",
  captainScore: 9.8,
} as const;

export function whatsappUrl(text?: string) {
  const msg = encodeURIComponent(
    text ?? `Olá! Vim da loja ${siteConfig.brand}.`,
  );
  return `https://wa.me/${siteConfig.whatsapp}?text=${msg}`;
}
