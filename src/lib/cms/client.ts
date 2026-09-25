import { CMS_TOKEN, CMS_URL, cmsMedia } from "./config";

/** Raw Strapi entry: v4 nests fields under `attributes`, v5 is flat. */
type RawEntry = Record<string, unknown> & { id?: number | string; attributes?: Record<string, unknown> };

interface StrapiResponse {
  data?: RawEntry | RawEntry[] | null;
  meta?: unknown;
  error?: { message?: string; status?: number };
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

/** GET /api/<path> with optional query. Throws on network/HTTP error. */
export async function cmsFetch(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<StrapiResponse> {
  const headers: Record<string, string> = {};
  if (CMS_TOKEN) headers.Authorization = `Bearer ${CMS_TOKEN}`;

  const res = await fetch(
    `${CMS_URL}/api/${path.replace(/^\/+/, "")}${buildQuery(params)}`,
    { headers },
  );
  const json = (await res.json().catch(() => null)) as StrapiResponse | null;
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `CMS request failed (${res.status})`);
  }
  return json ?? {};
}

/** Flatten a Strapi entry across v4/v5 shapes into a plain field bag. */
export function flatten(entry: RawEntry): Record<string, unknown> {
  const fields = entry.attributes ?? entry;
  return { id: entry.id ?? (fields as Record<string, unknown>).id, ...fields };
}

/** Extract a media URL from a Strapi media field (v4 data.attributes / v5 flat). */
export function mediaUrl(field: unknown): string | null {
  if (!field || typeof field !== "object") return null;
  const f = field as Record<string, unknown>;
  // v4: { data: { attributes: { url } } }
  const data = f.data as Record<string, unknown> | undefined;
  if (data) {
    const attrs = data.attributes as Record<string, unknown> | undefined;
    return cmsMedia((attrs?.url ?? data.url) as string | undefined);
  }
  // v5: { url } directly
  if (typeof f.url === "string") return cmsMedia(f.url);
  return null;
}
