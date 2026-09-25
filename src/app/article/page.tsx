"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Check, ChevronLeft, ChevronRight, Share2, Shield } from "lucide-react";
import useSWR from "swr";
import { getArticleBySlug, type CmsArticle } from "@/lib/cms";

/** Fallback content (design mock) used when no CMS slug is supplied. */
const MOCK: CmsArticle = {
  id: "mock",
  slug: "",
  kind: "article",
  tone: "forecast",
  title: "Iron-rich plants that actually absorb",
  excerpt: "",
  category: "NUTRITION SCIENCE",
  readTime: "4 MIN READ",
  authorName: "Dr. Lena Cho",
  authorRole: "Registered dietitian · Jun 18",
  coverUrl: null,
  featured: false,
  publishedAt: null,
  takeaways: [
    "Add a vitamin-C food to iron-rich meals.",
    "Keep tea & coffee between meals, not with them.",
    "Lentils, spinach and pumpkin seeds are easy staples.",
  ],
  body: `Plant foods are full of iron, but the body doesn't treat it all the same way. The non-heme iron in lentils, spinach and seeds is more sensitive to what sits alongside it on the plate than the iron in meat.

The good news: a few small pairings can meaningfully lift how much you actually absorb — no supplements required.

## Pair iron with vitamin C

A squeeze of lemon over a chickpea bowl, or peppers in a stir-fry, can increase non-heme iron absorption several times over. It's the single easiest lever you have.

> What you eat with iron matters as much as the iron itself.

On the other side, tea and coffee with a meal can blunt absorption — so it's worth shifting that cup to between meals rather than alongside them.`,
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "NP"
  );
}

/** Minimal markdown: `## ` headings, `> ` blockquotes, blank-line paragraphs. */
function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="mb-2 mt-5 font-sans text-[16px] font-extrabold leading-[1.3] text-ink"
            >
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="my-4.5 border-l-[3px] border-brand py-1 pl-3.5 font-sans text-[16px] font-semibold leading-[1.45] text-movement"
            >
              {block.slice(2)}
            </blockquote>
          );
        }
        return (
          <p
            key={i}
            className="font-sans text-[14.5px] font-normal leading-[1.62] text-text-strong"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="flex size-[34px] items-center justify-center rounded-[10px] border border-control-border bg-surface text-text-strong active:scale-95"
    >
      {children}
    </button>
  );
}

function ArticleReader() {
  const router = useRouter();
  const slug = useSearchParams().get("slug");
  const [progress, setProgress] = useState(0.06);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading: loading, error } = useSWR(
    slug ? ["cms/article", slug] : null,
    () => getArticleBySlug(slug!),
  );

  // Use CMS content when found; otherwise fall back to the design mock.
  const article = data ?? (slug && !error && loading ? null : MOCK);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
  }

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col bg-app-bg">
      {/* header */}
      <header
        className="flex h-[var(--np-topbar-h)] items-center justify-between border-b border-hairline bg-app-bg/95 px-3.5 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex size-[34px] items-center justify-center rounded-[10px] border border-control-border bg-surface text-text-strong active:scale-95"
        >
          <ChevronLeft className="size-[17px]" strokeWidth={2} />
        </button>
        <div className="flex gap-2">
          <IconBtn label="Bookmark">
            <Bookmark className="size-4" strokeWidth={1.9} />
          </IconBtn>
          <IconBtn label="Share">
            <Share2 className="size-4" strokeWidth={1.9} />
          </IconBtn>
        </div>
      </header>
      {/* reading progress */}
      <div className="h-[3px] bg-hairline">
        <div className="h-full bg-brand transition-[width]" style={{ width: `${progress * 100}%` }} />
      </div>

      {!article ? (
        <div className="flex flex-1 items-center justify-center font-sans text-[13px] font-medium text-text-inactive">
          Loading…
        </div>
      ) : (
        <div ref={ref} onScroll={onScroll} className="no-scrollbar flex-1 overflow-y-auto">
          {/* hero */}
          <div
            className="flex h-[150px] items-end p-3"
            style={
              article.coverUrl
                ? { backgroundImage: `url(${article.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: "repeating-linear-gradient(135deg,#eaf0f4,#eaf0f4 8px,#f3f7f9 8px,#f3f7f9 16px)" }
            }
          >
            {!article.coverUrl && (
              <span className="rounded-md bg-white/85 px-2 py-1.5 font-mono text-[9px] font-semibold text-[#6e8aa8]">
                ARTICLE IMAGE
              </span>
            )}
          </div>

          <div className="p-4">
            <div className="mb-2 font-mono text-[10px] font-semibold tracking-[0.06em] text-forecast">
              {[article.category, article.readTime].filter(Boolean).join(" · ")}
            </div>
            <h1 className="font-sans text-[23px] font-extrabold leading-[1.22] tracking-[-0.01em] text-ink">
              {article.title}
            </h1>

            {/* byline */}
            {(article.authorName || article.authorRole) && (
              <div className="mt-3 flex items-center gap-2.5 border-b border-hairline pb-3.5">
                <div className="flex size-[34px] flex-none items-center justify-center rounded-full bg-movement font-sans text-[13px] font-extrabold text-[#9fd8bc]">
                  {initials(article.authorName)}
                </div>
                <div>
                  <div className="font-sans text-[12.5px] font-bold text-ink">
                    {article.authorName || "NutriPlan"}
                  </div>
                  {article.authorRole && (
                    <div className="mt-0.5 font-sans text-[11px] font-medium text-[#7e867f]">
                      {article.authorRole}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* relevance */}
            <div className="my-3.5 flex items-center gap-2.5 rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5">
              <Shield className="size-[15px] flex-none text-brand" strokeWidth={2} />
              <span className="font-sans text-[11.5px] font-semibold leading-[1.35] text-brand-deep">
                Surfaced for you — matched to your week.
              </span>
            </div>

            {/* body */}
            <ArticleBody body={article.body} />

            {/* takeaways */}
            {article.takeaways.length > 0 && (
              <div className="mt-4.5 rounded-[14px] border border-hairline bg-surface p-3.5">
                <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                  Key takeaways
                </div>
                <div className="flex flex-col gap-2.5">
                  {article.takeaways.map((t) => (
                    <div key={t} className="flex gap-2.5">
                      <Check className="mt-px size-[15px] flex-none text-brand" strokeWidth={2.6} />
                      <span className="font-sans text-[13px] font-medium leading-[1.45] text-text-strong">
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* read next */}
            <div className="mb-2.5 mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted">
              Read next
            </div>
            <button
              onClick={() => router.push("/explore")}
              className="flex w-full items-center gap-3 rounded-[14px] border border-hairline bg-surface p-3 text-left active:scale-[0.99]"
            >
              <div
                className="size-[50px] flex-none rounded-[11px]"
                style={{ background: "repeating-linear-gradient(135deg,#ecf1ee,#ecf1ee 5px,#f5f8f6 5px,#f5f8f6 10px)" }}
              />
              <div className="flex-1">
                <span className="font-mono text-[9px] font-semibold text-brand">EXPLORE</span>
                <div className="mt-1 font-sans text-[13px] font-semibold leading-[1.3] text-ink">
                  More articles, guides &amp; recipes
                </div>
              </div>
              <ChevronRight className="size-4 text-[#c2cac5]" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={null}>
      <ArticleReader />
    </Suspense>
  );
}
