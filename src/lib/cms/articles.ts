import { cmsFetch, flatten, mediaUrl } from "./client";
import type { CmsArticle, CmsKind, CmsTone } from "./types";

const KINDS: CmsKind[] = ["article", "recipe", "guide", "community"];
const TONES: CmsTone[] = ["forecast", "brand", "caution"];

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function toTakeaways(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    return v.split("\n").map((s) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
  }
  return [];
}

function mapArticle(entry: Record<string, unknown> & { attributes?: Record<string, unknown> }): CmsArticle {
  const f = flatten(entry);
  const kind = KINDS.includes(f.kind as CmsKind) ? (f.kind as CmsKind) : "article";
  const tone = TONES.includes(f.tone as CmsTone) ? (f.tone as CmsTone) : "forecast";
  return {
    id: String(f.id ?? f.documentId ?? f.slug ?? crypto.randomUUID()),
    slug: str(f.slug, String(f.id ?? "")),
    kind,
    tone,
    title: str(f.title, "Untitled"),
    excerpt: str(f.excerpt),
    body: str(f.body),
    category: str(f.category).toUpperCase(),
    readTime: str(f.readTime).toUpperCase(),
    authorName: str(f.authorName),
    authorRole: str(f.authorRole),
    coverUrl: mediaUrl(f.cover),
    featured: f.featured === true,
    takeaways: toTakeaways(f.takeaways),
    publishedAt: str(f.publishedAt) || null,
  };
}

function asArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") return [data as Record<string, unknown>];
  return [];
}

/** List articles, newest first. Optionally filter by kind / featured. */
export async function getArticles(opts: {
  kind?: CmsKind;
  featured?: boolean;
  limit?: number;
} = {}): Promise<CmsArticle[]> {
  const params: Record<string, string | number | boolean> = {
    "populate": "*",
    "sort": "publishedAt:desc",
    "pagination[pageSize]": opts.limit ?? 20,
  };
  if (opts.kind) params["filters[kind][$eq]"] = opts.kind;
  if (opts.featured !== undefined) params["filters[featured][$eq]"] = opts.featured;

  const res = await cmsFetch("articles", params);
  return asArray(res.data).map(mapArticle);
}

/** Fetch a single article by slug. Returns null if not found. */
export async function getArticleBySlug(slug: string): Promise<CmsArticle | null> {
  const res = await cmsFetch("articles", {
    "populate": "*",
    "filters[slug][$eq]": slug,
    "pagination[pageSize]": 1,
  });
  const list = asArray(res.data);
  return list.length ? mapArticle(list[0]) : null;
}
