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

/**
 * Tradução via OpenAI quando OPENAI_API_KEY está configurada.
 * Qualidade muito superior ao MyMemory para títulos/descrições de produto.
 */
async function openaiChat(
  prompt: string,
  maxTokens = 400,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const out = json.choices?.[0]?.message?.content?.trim();
    return out || null;
  } catch {
    return null;
  }
}

/** Nome de vitrine em PT-BR via OpenAI (null se sem chave ou falha). */
export async function openaiProductTitlePt(
  titleEn: string,
): Promise<string | null> {
  const out = await openaiChat(
    `Você é redator de e-commerce brasileiro. Reescreva o nome de produto abaixo em português do Brasil: curto (máximo 60 caracteres), natural, comercial e específico (mantenha o tipo do produto e o diferencial principal). Sem nome de marca, sem aspas, sem emojis, sem ponto final. Responda SÓ com o nome.\n\nProduto: ${titleEn.slice(0, 200)}`,
    60,
  );
  if (!out) return null;
  const clean = out.replace(/^["'\s]+|["'\s.]+$/g, "").trim();
  if (!clean || clean.length < 8 || /\n/.test(clean)) return null;
  return clean.slice(0, 90);
}

/** Descrição de produto em PT-BR via OpenAI (null se sem chave ou falha). */
export async function openaiDescriptionPt(
  text: string,
  maxLen = 1200,
): Promise<string | null> {
  const src = text.replace(/\s+/g, " ").trim().slice(0, 2400);
  if (!src) return null;
  const out = await openaiChat(
    `Traduza/adapte a descrição de produto abaixo para português do Brasil, tom comercial e claro. Mantenha os fatos (materiais, medidas, tamanhos, avisos do vendedor). Remova repetições e sobras de outros idiomas. Não invente características. Responda SÓ com a descrição.\n\n${src}`,
    700,
  );
  if (!out || out.length < 40) return null;
  return out.slice(0, maxLen);
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

/** Google Translate (endpoint público, sem chave). */
async function googleTranslateToPt(text: string): Promise<string | null> {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=" +
      encodeURIComponent(text);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as [[string, string][]];
    const out = (json?.[0] || [])
      .map((seg) => seg?.[0] || "")
      .join("")
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * Tradução gratuita EN→PT: Google (sem chave) primeiro, MyMemory de reserva.
 * Fallback final: devolve o texto original.
 */
export async function translateToPt(text: string, maxLen = 450): Promise<string> {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (looksPortuguese(cleaned)) return cleaned.slice(0, maxLen);

  const wait = 350 - (Date.now() - lastTranslateAt);
  if (wait > 0) await sleep(wait);
  lastTranslateAt = Date.now();

  const q = cleaned.slice(0, maxLen);

  const g = await googleTranslateToPt(q);
  if (g) return g.slice(0, maxLen + 50);

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

/**
 * Título comercial em PT — composto por regras (confiável),
 * MyMemory só como reforço quando o tipo do produto é desconhecido.
 */
export async function localizeProductTitle(titleEn: string): Promise<string> {
  let en = titleEn
    .replace(
      /\b(wholesale|dropshipping|cross-border|hot sale|new arrival|free shipping|factory|oem|odm)\b/gi,
      "",
    )
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (en.length > 100) {
    const cut = en.slice(0, 100);
    const sp = cut.lastIndexOf(" ");
    en = (sp > 40 ? cut.slice(0, sp) : cut).trim();
  }

  // 1) OpenAI (se configurada) — nome específico e natural em PT-BR
  const ai = await openaiProductTitlePt(en);
  if (ai && !looksMostlyEnglish(ai) && !mixedLanguageJunk(ai)) {
    return truncateAtWord(polishPtTitle(ai), 90);
  }

  // 2) Tradução da frase inteira (Google → MyMemory)
  let pt = await translateToPt(en.slice(0, 90), 110);
  if (pt && !looksMostlyEnglish(pt) && !mixedLanguageJunk(pt)) {
    return truncateAtWord(polishPtTitle(pt), 90);
  }

  // 3) Título composto em PT (regras — evita mistureba)
  const composed = composeProductTitlePt(en);
  if (composed) return composed.slice(0, 90);

  // 4) Último recurso: dicionário palavra a palavra
  pt = dictionaryTitleFallback(en);
  return truncateAtWord(polishPtTitle(pt), 90);
}

/** Corta no limite sem quebrar palavra. */
function truncateAtWord(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:\-–]$/, "").trim();
}

/** Detecta título quebrado tipo "portátil Air Cooler ventilador with". */
function mixedLanguageJunk(text: string): boolean {
  const hasPt = /[áàâãéêíóôõúç]|portátil|ventilador|jaqueta|teclado|comedouro|vestido/i.test(
    text,
  );
  const hasEn =
    /\b(with|for|air|cooler|fan|dress|night|light|jacket|heater|board|message|cooling|portable|wireless|electric|mini)\b/i.test(
      text,
    );
  return hasPt && hasEn;
}

/**
 * Monta nome de vitrine em português legível a partir do título EN da CJ.
 */
export function composeProductTitlePt(titleEn: string): string | null {
  const t = titleEn.toLowerCase();

  type Rule = { test: RegExp; name: string };
  const rules: Rule[] = [
    {
      test: /heated\s+jacket|heating\s+vest|usb.*jacket|jacket.*usb|thermal.*coat/,
      name: "Jaqueta térmica aquecida USB",
    },
    {
      test: /gaming.+keyboard|keyboard.+gaming|luminous.+keyboard|wired\s+keyboard/,
      name: "Teclado gamer USB luminoso",
    },
    {
      test: /pet\s+feeder|food\s+dispenser|auto.+feed|automatic.+feeder/,
      name: "Comedouro automático inteligente para pets",
    },
    {
      test: /pet\s+water\s+bottle|dog\s+water\s+bottle|feeder\s+bowl.+bag|3\s*in\s*1.+dog\s+water/,
      name: "Garrafa comedouro pet 3 em 1",
    },
    {
      test: /mandoline|vegetable\s+slicer|potato\s+peeler|onion\s+grater|8\s*in\s*1.+slicer/,
      name: "Fatiador de legumes 8 em 1",
    },
    {
      test: /cup\s+washer|faucet.+wash|bar\s+counter.+washer|sink.+spray/,
      name: "Lavador de copos com spray de pressão",
    },
    {
      test: /note\s+board|message\s+board|led\s+night\s+light.+board|message.+night\s+light/,
      name: "Luminária LED placa de recados",
    },
    {
      test: /starry\s+night|galaxy\s+star|star\s+projection|night\s+light\s+projector/,
      name: "Projetor de luz estrelada para quarto",
    },
    {
      test: /air\s+conditioner|air\s+cooler|cooling\s+fan|leafless.+fan|water\s+cooling\s+fan|personal\s+air\s+circulator|mini\s+cooling\s+fan/,
      name: "Climatizador portátil USB / cooler de ar",
    },
    {
      test: /neck\s+fan|hands?\s*free.+fan/,
      name: "Ventilador de pescoço USB sem fio",
    },
    {
      test: /car\s+vacuum|vacuum\s+cleaner.+car|handheld.+vacuum/,
      name: "Aspirador portátil para carro",
    },
    {
      test: /spray\s+fan|mist\s+fan|handheld\s+spray/,
      name: "Ventilador spray portátil com névoa",
    },
    {
      test: /cat\s+toy|interactive\s+cat|cat\s+ball/,
      name: "Brinquedo interativo para gatos",
    },
    {
      test: /maxi\s+dress|evening\s+dress|party\s+dress|halter\s+neck.+dress|sleeveless\s+dress|satin\s+maxi|summer\s+sleeveless\s+dress|ruffle\s+sleeveless.+dress|long\s+dress/,
      name: "Vestido longo feminino",
    },
    {
      test: /magnetic\s+charger|3\s*in\s*1.+charg|wireless\s+charg/,
      name: "Carregador magnético 3 em 1",
    },
    {
      test: /usb.?c?\s+hub|multiport|hdmi.+usb/,
      name: "Hub USB-C multiporta",
    },
    {
      test: /massage|massager/,
      name: "Massageador elétrico",
    },
    {
      test: /blender|juicer/,
      name: "Liquidificador / espremedor portátil USB",
    },
  ];

  for (const rule of rules) {
    if (rule.test.test(t)) return rule.name;
  }
  return null;
}

function looksMostlyEnglish(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return /[a-z]{4,}/i.test(text) && !looksPortuguese(text);
  }
  const enHits = words.filter((w) =>
    /^(the|and|with|for|from|portable|wireless|electric|mini|usb|led|air|cooler|fan|dress|night|light|jacket|heater|board|message|kitchen|pet|dog|cat|cooling|pieces|sets|straps|sleeveless)$/i.test(
      w,
    ),
  ).length;
  return enHits >= Math.max(2, Math.ceil(words.length * 0.3));
}

function dictionaryTitleFallback(en: string): string {
  let t = en;
  // Ordem: palavras longas primeiro
  const entries = Object.entries(WORD_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [eng, pt] of entries) {
    t = t.replace(new RegExp(`\\b${eng}\\b`, "gi"), pt);
  }
  return t;
}

/** Capitaliza e limpa resto de inglês óbvio no título PT. */
function polishPtTitle(raw: string): string {
  let t = raw
    .replace(/\s+/g, " ")
    .replace(/\b(For|With|And|The|Of)\b/g, (m) => {
      const map: Record<string, string> = {
        For: "para",
        With: "com",
        And: "e",
        The: "",
        Of: "de",
      };
      return map[m] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();

  if (t) t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.replace(/\s{2,}/g, " ").trim();
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
