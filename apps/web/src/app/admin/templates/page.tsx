"use client";

import { useEffect, useState } from "react";
import type { NotificationTemplateRow } from "@focuslab/shared";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type EditableTemplate = NotificationTemplateRow & {
  localId: string;
};

function createDraftTemplate(order: number): EditableTemplate {
  return {
    body: "Start with {{task_title}} today.",
    channel: order % 2 === 0 ? "email" : "push",
    created_at: new Date().toISOString(),
    id: `draft-${order}`,
    is_active: true,
    localId: crypto.randomUUID(),
    subject: order % 2 === 0 ? "Today’s Next Thing step" : "One doable step",
    tone_tag: "encouraging",
  };
}

export default function AdminTemplatesPage() {
  const supabase = createSupabaseBrowserClient();
  const [templates, setTemplates] = useState<EditableTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_templates")
      .select("*")
      .order("channel")
      .order("tone_tag");

    if (error) {
      setStatus(error.message);
      setTemplates([]);
      setLoading(false);
      return;
    }

    setTemplates(
      ((data ?? []) as NotificationTemplateRow[]).map((template) => ({
        ...template,
        localId: template.id,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setTemplates((current) => [...current, createDraftTemplate(current.length + 1)]);
    setStatus("New template draft added.");
  };

  const handleChange = (
    localId: string,
    field: keyof NotificationTemplateRow,
    value: string | boolean,
  ) => {
    setTemplates((current) =>
      current.map((template) =>
        template.localId === localId
          ? {
              ...template,
              [field]: value,
            }
          : template,
      ),
    );
  };

  const handleSave = async (template: EditableTemplate) => {
    setSavingId(template.localId);
    const payload = {
      body: template.body,
      channel: template.channel,
      is_active: template.is_active,
      subject: template.subject,
      tone_tag: template.tone_tag,
    };

    const response = template.id.startsWith("draft-")
      ? await supabase
          .from("notification_templates")
          .insert(payload)
          .select("*")
          .single()
      : await supabase
          .from("notification_templates")
          .update(payload)
          .eq("id", template.id)
          .select("*")
          .single();

    if (response.error || !response.data) {
      setStatus(response.error?.message ?? "Template could not be saved.");
      setSavingId(null);
      return;
    }

    setStatus("Template saved.");
    setSavingId(null);
    await loadTemplates();
  };

  const handleDelete = async (template: EditableTemplate) => {
    if (template.id.startsWith("draft-")) {
      setTemplates((current) => current.filter((item) => item.localId !== template.localId));
      return;
    }

    setSavingId(template.localId);
    const { error } = await supabase
      .from("notification_templates")
      .delete()
      .eq("id", template.id);

    if (error) {
      setStatus(error.message);
      setSavingId(null);
      return;
    }

    setStatus("Template deleted.");
    setSavingId(null);
    await loadTemplates();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
              Templates
            </p>
            <h2 className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
              Notification copy bank
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-focuslab-secondary">
              Keep tone rotation healthy across push and email. Use the shared
              interpolation variables like <code>{"{{task_title}}"}</code> and{" "}
              <code>{"{{streak}}"}</code>.
            </p>
          </div>
          <button
            className="rounded-full bg-focuslab-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-focuslab-secondary"
            onClick={handleAdd}
            type="button"
          >
            Add template
          </button>
        </div>
        <p className="mt-4 text-sm text-focuslab-secondary">
          {status ?? `${templates.length} template${templates.length === 1 ? "" : "s"} ready.`}
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
            Loading templates...
          </div>
        ) : null}

        {templates.map((template) => (
          <article
            className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]"
            key={template.localId}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Channel
                </span>
                <select
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    handleChange(template.localId, "channel", event.target.value)
                  }
                  value={template.channel}
                >
                  <option value="push">Push</option>
                  <option value="email">Email</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Tone tag
                </span>
                <select
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    handleChange(template.localId, "tone_tag", event.target.value)
                  }
                  value={template.tone_tag}
                >
                  <option value="encouraging">encouraging</option>
                  <option value="direct">direct</option>
                  <option value="playful">playful</option>
                  <option value="reflective">reflective</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                Subject
              </span>
              <input
                className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                onChange={(event) =>
                  handleChange(template.localId, "subject", event.target.value)
                }
                value={template.subject}
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                Body
              </span>
              <textarea
                className="min-h-36 w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                onChange={(event) =>
                  handleChange(template.localId, "body", event.target.value)
                }
                value={template.body}
              />
            </label>

            <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-focuslab-secondary">
              <input
                checked={template.is_active}
                onChange={(event) =>
                  handleChange(template.localId, "is_active", event.target.checked)
                }
                type="checkbox"
              />
              Active
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-focuslab-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-focuslab-secondary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={savingId === template.localId}
                onClick={() => {
                  void handleSave(template);
                }}
                type="button"
              >
                {savingId === template.localId ? "Saving..." : "Save template"}
              </button>
              <button
                className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={savingId === template.localId}
                onClick={() => {
                  void handleDelete(template);
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
