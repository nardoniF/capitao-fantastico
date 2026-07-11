/** Extrai a primeira URL válida de campos de imagem do CJ (string, JSON array ou lista). */
export function normalizeImageUrl(raw: unknown, fallback = "/brand/logo-mark.png"): string {
  if (raw == null) return fallback;

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const url = normalizeImageUrl(item, "");
      if (url) return url;
    }
    return fallback;
  }

  if (typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return normalizeImageUrl(parsed, fallback);
    } catch {
      /* fall through */
    }
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }

  return fallback;
}
