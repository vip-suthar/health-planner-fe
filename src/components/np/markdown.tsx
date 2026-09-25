import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny, dependency-free Markdown renderer for coach chat bubbles. Parses to
 * React nodes (never dangerouslySetInnerHTML), so untrusted assistant text
 * can't inject markup. Supports the subset a chat model actually emits:
 * headings, bold/italic, inline + fenced code, links, ordered/unordered lists,
 * blockquotes, and paragraphs. Everything else falls through as plain text.
 */

// ── inline ──────────────────────────────────────────────────────────────────
// Order matters: code first (its contents are literal), then links, then
// emphasis. Each token is matched non-greedily against the remaining slice.
const INLINE = [
  { re: /`([^`]+)`/, render: (m: string, k: number) => (
      <code
        key={k}
        className="rounded-[5px] bg-surface-muted px-1 py-0.5 font-mono text-[11.5px] text-text-strong"
      >
        {m}
      </code>
    ) },
  { re: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/, render: undefined },
  { re: /\*\*([^*]+)\*\*/, render: (m: string, k: number) => (
      <strong key={k} className="font-bold text-text-strong">{parseInline(m)}</strong>
    ) },
  { re: /__([^_]+)__/, render: (m: string, k: number) => (
      <strong key={k} className="font-bold text-text-strong">{parseInline(m)}</strong>
    ) },
  { re: /\*([^*]+)\*/, render: (m: string, k: number) => (
      <em key={k} className="italic">{parseInline(m)}</em>
    ) },
  { re: /_([^_]+)_/, render: (m: string, k: number) => (
      <em key={k} className="italic">{parseInline(m)}</em>
    ) },
] as const;

let keyCounter = 0;

function parseInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;

  while (rest.length > 0) {
    let best: { idx: number; len: number; node: ReactNode } | null = null;

    for (const tok of INLINE) {
      const m = tok.re.exec(rest);
      if (!m || m.index === undefined) continue;
      if (best && m.index >= best.idx) continue;
      const k = keyCounter++;
      // Links have a second capture group (the href); render specially.
      const node =
        m.length > 2 && /^https?:\/\//.test(m[2])
          ? (
              <a
                key={k}
                href={m[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline underline-offset-2"
              >
                {m[1]}
              </a>
            )
          : tok.render?.(m[1], k);
      best = { idx: m.index, len: m[0].length, node };
    }

    if (!best) {
      out.push(rest);
      break;
    }
    if (best.idx > 0) out.push(rest.slice(0, best.idx));
    out.push(best.node);
    rest = rest.slice(best.idx + best.len);
  }
  return out;
}

// ── blocks ──────────────────────────────────────────────────────────────────
type Block =
  | { type: "code"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "p"; text: string };

function toBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // fenced code
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      blocks.push({ type: "code", text: buf.join("\n") });
      continue;
    }
    // blank
    if (line.trim() === "") {
      i++;
      continue;
    }
    // heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ type: "heading", level: h[1].length, text: h[2] });
      i++;
      continue;
    }
    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]))
        items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push({ type: "ul", items });
      continue;
    }
    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i]))
        items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      blocks.push({ type: "ol", items });
      continue;
    }
    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i]))
        buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ type: "quote", text: buf.join("\n") });
      continue;
    }
    // paragraph: gather until blank / block start
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```|^#{1,6}\s|^\s*[-*]\s|^\s*\d+\.\s|^\s*>\s?/.test(lines[i])
    )
      buf.push(lines[i++]);
    blocks.push({ type: "p", text: buf.join("\n") });
  }
  return blocks;
}

/** Render a paragraph body, turning single newlines into <br/>. */
function multiline(text: string): ReactNode[] {
  const parts = text.split("\n");
  return parts.flatMap((ln, i) => [
    ...(i > 0 ? [<br key={`br-${keyCounter++}`} />] : []),
    <Fragment key={`ln-${keyCounter++}`}>{parseInline(ln)}</Fragment>,
  ]);
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = toBlocks(text);
  return (
    <div className={cn("space-y-2", className)}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-[10px] bg-surface-muted p-2.5 font-mono text-[11.5px] leading-[1.5] text-text-strong"
              >
                <code>{b.text}</code>
              </pre>
            );
          case "heading": {
            const size = b.level <= 2 ? "text-[15px]" : "text-[13.5px]";
            return (
              <div key={i} className={cn("font-bold text-ink", size)}>
                {parseInline(b.text)}
              </div>
            );
          }
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1 pl-4.5">
                {b.items.map((it, j) => (
                  <li key={j}>{parseInline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-1 pl-4.5">
                {b.items.map((it, j) => (
                  <li key={j}>{parseInline(it)}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-hairline pl-2.5 text-text-body"
              >
                {multiline(b.text)}
              </blockquote>
            );
          default:
            return <p key={i}>{multiline(b.text)}</p>;
        }
      })}
    </div>
  );
}
