/** Content kinds authored in Strapi (one `article` collection, discriminated). */
export type CmsKind = "article" | "recipe" | "guide" | "community";

/** UI tone driving the card/label accent color. */
export type CmsTone = "forecast" | "brand" | "caution";

/** Normalized article shape used by the explore + reader screens. */
export interface CmsArticle {
  id: string;
  slug: string;
  kind: CmsKind;
  tone: CmsTone;
  title: string;
  excerpt: string;
  body: string; // markdown
  category: string; // eyebrow, e.g. "NUTRITION SCIENCE"
  readTime: string; // e.g. "4 MIN"
  authorName: string;
  authorRole: string;
  coverUrl: string | null;
  featured: boolean;
  takeaways: string[];
  publishedAt: string | null;
}
