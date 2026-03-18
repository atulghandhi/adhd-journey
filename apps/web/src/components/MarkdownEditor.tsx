"use client";

import dynamic from "next/dynamic";

interface MarkdownEditorProps {
  height?: number;
  label?: string;
  onChange: (value: string) => void;
  value: string;
}

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

export function MarkdownEditor({
  height = 320,
  label,
  onChange,
  value,
}: MarkdownEditorProps) {
  return (
    <div className="space-y-2" data-color-mode="light">
      {label ? (
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
          {label}
        </p>
      ) : null}
      <MDEditor
        height={height}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        preview="edit"
        value={value}
      />
    </div>
  );
}
