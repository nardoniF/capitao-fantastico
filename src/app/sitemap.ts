import type { MetadataRoute } from "next";
import { products } from "@/data/products";

const base =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.capitaofantastico.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = ["", "/produtos", "/sobre", "/faq", "/contato"];
  const staticEntries = staticPaths.map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: now,
    changeFrequency: (p === "/produtos" ? "daily" : "weekly") as
      | "daily"
      | "weekly",
    priority: p === "" ? 1 : 0.8,
  }));
  const productEntries = products.map((p) => ({
    url: `${base}/produtos/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  return [...staticEntries, ...productEntries];
}
