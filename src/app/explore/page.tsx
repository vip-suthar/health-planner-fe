"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/chrome/app-shell";
import { TitleTopBar } from "@/components/chrome/top-bar";
import { FilterChip } from "@/components/np/chip";
import { ContentCard } from "@/components/np/content-card";
import { Eyebrow } from "@/components/np/typography";
import {
  community,
  deepDives as deepDivesMock,
  exploreFeature,
  exploreFilters,
  type ContentCard as ContentCardType,
} from "@/lib/data";
import useSWR from "swr";
import { getArticles, type CmsArticle, type CmsKind } from "@/lib/cms";

const FILTER_KIND: Record<string, CmsKind | undefined> = {
  All: undefined,
  Articles: "article",
  Guides: "guide",
  Recipes: "recipe",
  Community: "community",
};

function toCard(a: CmsArticle): ContentCardType {
  return {
    id: a.id,
    kind: a.kind,
    readTime: a.readTime || undefined,
    title: a.title,
    tone: a.tone,
    slug: a.slug,
    coverUrl: a.coverUrl,
  };
}

export default function ExplorePage() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const { data: articles, error } = useSWR(["cms/articles", 30], () =>
    getArticles({ limit: 30 }),
  );

  const live = !error && articles && articles.length > 0;

  const feature = useMemo(
    () => articles?.find((a) => a.featured) ?? articles?.[0] ?? null,
    [articles],
  );

  const deepDives: ContentCardType[] = useMemo(() => {
    if (!live || !articles) return deepDivesMock;
    const kind = FILTER_KIND[filter];
    return articles
      .filter((a) => a.id !== feature?.id)
      .filter((a) => (kind ? a.kind === kind : true))
      .map(toCard);
  }, [live, articles, filter, feature]);

  return (
    <AppShell topBar={<TitleTopBar title="Explore" />}>
      {/* search */}
      <div className="mb-3 flex h-11 items-center gap-2.5 rounded-[13px] border border-hairline bg-surface px-3.5 text-text-inactive">
        <Search className="size-[17px]" strokeWidth={1.9} />
        <span className="font-sans text-[14px] font-medium">
          Search articles, guides, recipes
        </span>
      </div>

      {/* filter chips */}
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {exploreFilters.map((f) => (
          <FilterChip
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
            className="flex-none"
          >
            {f}
          </FilterChip>
        ))}
      </div>

      {/* feature bento */}
      <article
        onClick={() =>
          feature && router.push(`/article?slug=${encodeURIComponent(feature.slug)}`)
        }
        className="mb-3.5 overflow-hidden rounded-[18px] border border-hairline bg-surface active:scale-[0.99]"
      >
        <div
          className="flex h-[140px] items-end p-3.5"
          style={
            feature?.coverUrl
              ? { backgroundImage: `url(${feature.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {
                  background:
                    "repeating-linear-gradient(135deg,#e8eeea,#e8eeea 7px,#f2f6f3 7px,#f2f6f3 14px)",
                }
          }
        >
          {!feature?.coverUrl && (
            <span className="rounded-md bg-white/85 px-2 py-1.5 font-mono text-[9px] font-semibold text-[#7e9a88]">
              FEATURE IMAGE
            </span>
          )}
        </div>
        <div className="p-3.5">
          <span className="font-mono text-[9px] font-semibold tracking-[0.05em] text-brand">
            {feature
              ? [feature.category, feature.readTime].filter(Boolean).join(" · ")
              : exploreFeature.label}
          </span>
          <h2 className="mt-1.5 font-sans text-[16px] font-bold leading-[1.3] text-ink">
            {feature?.title ?? exploreFeature.title}
          </h2>
          <p className="mt-1.5 font-sans text-[12px] font-medium leading-[1.45] text-[#7e867f]">
            {feature?.excerpt ?? exploreFeature.body}
          </p>
        </div>
      </article>

      {/* deep dives */}
      <Eyebrow className="mb-2.5 block tracking-[0.07em]">Deep dives</Eyebrow>
      {deepDives.length > 0 ? (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-3 overflow-x-auto px-4">
          {deepDives.map((c) => (
            <ContentCard key={c.id} card={c} imageHeight={84} className="w-[150px] flex-none" />
          ))}
        </div>
      ) : (
        <p className="mb-4 font-sans text-[13px] font-medium text-text-inactive">
          Nothing here yet for this filter.
        </p>
      )}

      {/* community */}
      <div className="rounded-[18px] bg-movement p-4">
        <span className="font-mono text-[9px] font-semibold tracking-[0.05em] text-[#9fd8bc]">
          COMMUNITY VIBES
        </span>
        <h3 className="mt-1.5 font-sans text-[15px] font-bold leading-[1.3] text-white">
          {community.title}
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex">
            {["#5e8c76", "#7ba890", "#9fd8bc"].map((c, i) => (
              <span
                key={c}
                className="size-6 rounded-full border-2 border-movement"
                style={{ background: c, marginLeft: i ? -8 : 0 }}
              />
            ))}
          </div>
          <span className="font-sans text-[11px] font-medium text-[#c9e5d6]">
            {community.count}
          </span>
        </div>
      </div>
    </AppShell>
  );
}
