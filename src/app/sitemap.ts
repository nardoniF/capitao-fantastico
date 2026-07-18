import type { MetadataRoute } from "next";
import { listStorefrontProducts } from "@/lib/catalog";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticPaths: {
    path: string;
    priority: number;
    freq: "daily" | "weekly" | "monthly" | "yearly";
  }[] =
    [
      { path: "", priority: 1, freq: "daily" },
      { path: "/produtos", priority: 0.95, freq: "daily" },
      { path: "/sobre", priority: 0.7, freq: "monthly" },
      { path: "/faq", priority: 0.75, freq: "weekly" },
      { path: "/contato", priority: 0.6, freq: "monthly" },
      { path: "/central", priority: 0.65, freq: "weekly" },
      { path: "/sugestoes", priority: 0.5, freq: "monthly" },
      { path: "/termos", priority: 0.3, freq: "yearly" },
      { path: "/privacidade", priority: 0.3, freq: "yearly" },
    ];

  const staticEntries = staticPaths.map(({ path, priority, freq }) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await listStorefrontProducts();
    productEntries = products.map((p) => ({
      url: `${base}/produtos/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    /* banco indisponível — sitemap estático ainda ajuda indexação */
  }

  return [...staticEntries, ...productEntries];
}
