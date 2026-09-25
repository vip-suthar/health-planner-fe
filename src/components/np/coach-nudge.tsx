import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Renders **bold** spans inside the nudge copy. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <b key={i} className="font-bold">
            {p.slice(2, -2)}
          </b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function CoachNudge({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[14px] border border-forecast-border bg-coach-surface px-3 py-2.5",
        className,
      )}
    >
      <Sparkles className="mt-px size-4 flex-none fill-forecast text-forecast" />
      <p className="font-sans text-[12.5px] font-medium leading-[1.45] text-coach-text">
        <RichText text={text} />
      </p>
    </div>
  );
}
