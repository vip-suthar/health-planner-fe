/**
 * Strapi CMS configuration. Both are build-time public envs (static export).
 * - NEXT_PUBLIC_CMS_URL: Strapi base origin (no trailing /api).
 * - NEXT_PUBLIC_CMS_TOKEN: optional read-only API token for non-public content.
 */
export const CMS_URL = (
  process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:1337"
).replace(/\/+$/, "");

export const CMS_TOKEN = process.env.NEXT_PUBLIC_CMS_TOKEN ?? "";

/** Resolve a possibly-relative Strapi media URL against the CMS origin. */
export function cmsMedia(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${CMS_URL}${url.startsWith("/") ? url : `/${url}`}`;
}
