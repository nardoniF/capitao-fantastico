/**
 * Tradução EN→PT sem custo (dicionário + MyMemory free API).
 * Rate-limit leve para não estourar.
 */

const COLOR_MAP: Record<string, string> = {
  black: "Preto",
  white: "Branco",
  red: "Vermelho",
  blue: "Azul",
  green: "Verde",
  yellow: "Amarelo",
  orange: "Laranja",
  pink: "Rosa",
  purple: "Roxo",
  violet: "Violeta",
  brown: "Marrom",
  grey: "Cinza",
  gray: "Cinza",
  gold: "Dourado",
  silver: "Prata",
  beige: "Bege",
  navy: "Azul-marinho",
  "navy blue": "Azul-marinho",
  "sky blue": "Azul-céu",
  "dark blue": "Azul escuro",
  "light blue": "Azul claro",
  "coffee yellow": "Amarelo café",
  khaki: "Caqui",
  transparent: "Transparente",
  clear: "Transparente",
  multicolor: "Multicolorido",
  multi: "Multicolorido",
  rose: "Rosa",
  champagne: "Champanhe",
};

const SIZE_MAP: Record<string, string> = {
  xs: "PP",
  s: "P",
  m: "M",
  l: "G",
  xl: "GG",
  xxl: "XG",
  "2xl": "XG",
  "3xl": "XXG",
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  unique: "Único",
  "one size": "Único",
  "free size": "Único",
};

const KEY_MAP: Record<string, string> = {
  color: "Cor",
  colour: "Cor",
  size: "Tamanho",
  style: "Estilo",
  type: "Tipo",
  model: "Modelo",
  option: "Opção",
  material: "Material",
  package: "Pacote",
  voltage: "Voltagem",
};

const WORD_MAP: Record<string, string> = {
  portable: "portátil",
  wireless: "sem fio",
  rechargeable: "recarregável",
  handheld: "de mão",
  mini: "mini",
  electric: "elétrico",
  automatic: "automático",
  smart: "inteligente",
  vacuum: "aspirador",
  cleaner: "limpador",
  fan: "ventilador",
  spray: "spray",
  mist: "névoa",
  pet: "pet",
  dog: "cão",
  dogs: "cães",
  cat: "gato",
  cats: "gatos",
  car: "carro",
  kitchen: "cozinha",
  bathroom: "banheiro",
  facial: "facial",
  massage: "massagem",
  massager: "massageador",
  brush: "escova",
  mirror: "espelho",
  led: "LED",
  usb: "USB",
  charger: "carregador",
  organizer: "organizador",
  storage: "armazenamento",
  cleaning: "limpeza",
  kit: "kit",
  set: "kit",
  inflatable: "inflável",
  camping: "camping",
  sofa: "sofá",
  bed: "cama",
  waterproof: "impermeável",
  adjustable: "ajustável",
  foldable: "dobrável",
  folding: "dobrável",
  elevated: "elevado",
  feeder: "comedouro",
  bowl: "tigela",
  bottle: "garrafa",
  water: "água",
  food: "ração",
  dispenser: "dispenser",
  timer: "timer",
  juicer: "espremedor",
  blender: "liquidificador",
  mixer: "mixer",
  fruit: "frutas",
  vegetable: "legumes",
  potato: "batata",
  peeler: "descascador",
  slicer: "fatiador",
  mandoline: "mandoline",
  jacket: "jaqueta",
  heated: "aquecida",
  winter: "inverno",
  cotton: "algodão",
  thermal: "térmica",
  heater: "aquecedor",
  keyboard: "teclado",
  gaming: "gamer",
  luminous: "luminoso",
  wired: "com fio",
  washer: "lavador",
  sink: "pia",
  cup: "copos",
  faucet: "torneira",
  pressure: "pressão",
  night: "noturna",
  light: "luz",
  message: "recados",
  board: "placa",
  creative: "criativa",
  garbage: "lixo",
  bag: "saquinho",
  outdoor: "externo",
  machine: "aparelho",
};

let lastTranslateAt = 0;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function looksPortuguese(text: string): boolean {
  return /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(text) ||
    /\b(para|com|sem|porta|kit|aspirador|ventilador|cozinha|banho)\b/i.test(text);
}

export function translateColor(value: string): string {
  const key = value.trim().toLowerCase();
  if (COLOR_MAP[key]) return COLOR_MAP[key];
  // "Black / White" etc
  if (key.includes("/") || key.includes("-")) {
    return key
      .split(/[/\-]/)
      .map((p) => COLOR_MAP[p.trim()] || p.trim())
      .join(" / ");
  }
  return value.trim();
}

export function translateSize(value: string): string {
  const key = value.trim().toLowerCase();
  return SIZE_MAP[key] || value.trim();
}

export function translateOptionKey(key: string): string {
  return KEY_MAP[key.trim().toLowerCase()] || key;
}

/** Traduz valor curto (cor/tamanho/opção). */
export function translateOptionValue(key: string, value: string): string {
  const k = key.toLowerCase();
  if (k.includes("cor") || k.includes("color") || k.includes("colour")) {
    const mapped = translateColor(value);
    if (mapped !== value) return mapped;
  }
  if (k.includes("tamanho") || k.includes("size")) {
    return translateSize(value);
  }
  const asColor = translateColor(value);
  if (COLOR_MAP[value.trim().toLowerCase()]) return asColor;
  return value;
}

/**
 * Tradução gratuita EN→PT via MyMemory (sem chave).
 * Fallback: devolve o texto original.
 */
export async function translateToPt(text: string, maxLen = 450): Promise<string> {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (looksPortuguese(cleaned)) return cleaned.slice(0, maxLen);

  const wait = 350 - (Date.now() - lastTranslateAt);
  if (wait > 0) await sleep(wait);
  lastTranslateAt = Date.now();

  const q = cleaned.slice(0, maxLen);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|pt-BR`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return cleaned.slice(0, maxLen);
    const json = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const out = json.responseData?.translatedText?.trim();
    if (!out || /MYMEMORY WARNING|INVALID/i.test(out)) {
      return cleaned.slice(0, maxLen);
    }
    return out.slice(0, maxLen + 50);
  } catch {
    return cleaned.slice(0, maxLen);
  }
}

/** Título comercial: limpa spam + traduz. */
export async function localizeProductTitle(titleEn: string): Promise<string> {
  let t = titleEn
    .replace(
      /\b(wholesale|dropshipping|cross-border|hot sale|new arrival|free shipping|factory|oem|odm)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  // Atalho: troca palavras conhecidas antes da API
  for (const [en, pt] of Object.entries(WORD_MAP)) {
    const re = new RegExp(`\\b${en}\\b`, "gi");
    t = t.replace(re, pt);
  }

  if (t.length > 90) {
    const cut = t.slice(0, 90);
    const sp = cut.lastIndexOf(" ");
    t = (sp > 40 ? cut.slice(0, sp) : cut).trim();
  }

  const translated = await translateToPt(t, 80);
  // Se a API devolver inglês igual, mantém o com WORD_MAP
  return (translated || t).slice(0, 90);
}

export async function localizeOptions(
  options: Record<string, string[]>,
): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(options)) {
    const ptKey = translateOptionKey(key);
    out[ptKey] = values.map((v) => translateOptionValue(key, v));
  }
  return out;
}

export async function localizeOptionValues(
  optionValues: Record<string, string>,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(optionValues)) {
    const ptKey = translateOptionKey(key);
    out[ptKey] = translateOptionValue(key, value);
  }
  return out;
}
