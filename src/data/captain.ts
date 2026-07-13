/** Navegação editorial logo abaixo do banner. */
export const captainSections = [
  { id: "virais", label: "Produtos Virais", href: "/produtos?tag=viral" },
  { id: "pet", label: "Escolhas para Pets", href: "/produtos?cat=pet" },
  { id: "auto", label: "Gadgets para Carro", href: "/produtos?cat=auto" },
  { id: "kids", label: "Soluções para Kids", href: "/produtos?cat=kids" },
  { id: "beauty", label: "Beleza Inteligente", href: "/produtos?cat=beauty" },
  { id: "gadgets", label: "Tecnologia", href: "/produtos?cat=gadgets" },
  { id: "casa", label: "Casa", href: "/produtos?cat=casa" },
  { id: "mais-vendidos", label: "Mais Vendidos", href: "/#mais-vendidos" },
  { id: "aprovados", label: "Aprovados pelo Capitão", href: "/produtos" },
  { id: "novidades", label: "Acabaram de chegar", href: "/#novidades" },
  { id: "recomenda", label: "O Capitão Recomenda", href: "/#recomenda" },
] as const;

export type CaptainMedal =
  | "nota10"
  | "custoBeneficio"
  | "escolhaCapitao"
  | "viral";

export const medalLabels: Record<CaptainMedal, string> = {
  nota10: "Produto Nota 10",
  custoBeneficio: "Melhor custo-benefício",
  escolhaCapitao: "Escolha do Capitão",
  viral: "Produto Viral",
};

export const resolveChecks = [
  "Organização",
  "Economia",
  "Durabilidade",
  "Facilidade",
] as const;

/** Nota do Capitão por produto — estável (derivada do slug), entre 9,0 e 9,9. */
export function captainScoreFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 9.0 + (h % 10) / 10;
}
