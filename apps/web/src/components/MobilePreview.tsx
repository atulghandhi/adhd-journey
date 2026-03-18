import ReactMarkdown from "react-markdown";

interface MobilePreviewProps {
  explanation: string;
  subtitle?: string | null;
  taskBody: string;
  title: string;
}

export function MobilePreview({
  explanation,
  subtitle,
  taskBody,
  title,
}: MobilePreviewProps) {
  return (
    <div className="rounded-[32px] border border-focuslab-border bg-focuslab-primaryDark/5 p-4">
      <div className="mx-auto max-w-[320px] rounded-[32px] border-[10px] border-focuslab-primaryDark bg-focuslab-background shadow-[0_24px_80px_rgba(27,67,50,0.12)]">
        <div className="mx-auto mt-3 h-1.5 w-20 rounded-full bg-focuslab-primaryDark/20" />
        <div className="space-y-6 px-5 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
              {subtitle ?? "Today’s task"}
            </p>
            <h3 className="mt-2 text-2xl font-bold leading-tight text-focuslab-primaryDark">
              {title || "Untitled task"}
            </h3>
          </div>

          <div className="space-y-3 rounded-[24px] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
              Action
            </p>
            <div className="prose prose-sm max-w-none prose-p:leading-6 prose-strong:text-focuslab-primaryDark">
              <ReactMarkdown>{taskBody || "Task copy will render here."}</ReactMarkdown>
            </div>
          </div>

          <div className="space-y-3 rounded-[24px] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
              Why this matters
            </p>
            <div className="prose prose-sm max-w-none prose-p:leading-6 prose-strong:text-focuslab-primaryDark">
              <ReactMarkdown>
                {explanation || "Explanation copy will render here."}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
