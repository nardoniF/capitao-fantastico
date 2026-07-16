/** IP e geo a partir dos headers (Vercel / Cloudflare). */
export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/** IP resumido para exibição (ex.: 177.45.x.x). */
export function ipPrefix(ip: string): string {
  if (!ip || ip === "unknown") return "";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length >= 2) return `${parts[0]}.${parts[1]}.x.x`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 3) return `${parts.slice(0, 3).join(":")}:…`;
  }
  return "";
}

function decodeHeader(v: string | null): string {
  if (!v) return "";
  try {
    return decodeURIComponent(v).trim();
  } catch {
    return v.trim();
  }
}

export function geoFromRequest(request: Request) {
  const pais = (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    ""
  ).trim();
  const estado = decodeHeader(
    request.headers.get("x-vercel-ip-country-region"),
  );
  const cidade = decodeHeader(request.headers.get("x-vercel-ip-city"));
  return { pais, estado, cidade };
}
