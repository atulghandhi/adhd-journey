"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { TaskRow } from "@focuslab/shared";

import { MarkdownEditor } from "@/components/MarkdownEditor";
import { MobilePreview } from "@/components/MobilePreview";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function AdminTaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createSupabaseBrowserClient();
  const taskId = params.id;
  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    default_duration_days: 1,
    deeper_reading: "",
    difficulty_rating: 3,
    explanation_body: "",
    is_active: true,
    order: 1,
    tags: "adhd, focus",
    task_body: "",
    title: "",
  });

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const loadTask = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .maybeSingle();

      if (error || !data) {
        setStatus(error?.message ?? "Task not found.");
        setTask(null);
        setLoading(false);
        return;
      }

      const loadedTask = data as TaskRow;
      setTask(loadedTask);
      setForm({
        default_duration_days: loadedTask.default_duration_days,
        deeper_reading: loadedTask.deeper_reading ?? "",
        difficulty_rating: loadedTask.difficulty_rating,
        explanation_body: loadedTask.explanation_body,
        is_active: loadedTask.is_active,
        order: loadedTask.order,
        tags: loadedTask.tags.join(", "),
        task_body: loadedTask.task_body,
        title: loadedTask.title,
      });
      setLoading(false);
    };

    void loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleSave = async () => {
    if (!taskId) {
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("tasks")
      .update({
        default_duration_days: form.default_duration_days,
        deeper_reading: form.deeper_reading.trim() || null,
        difficulty_rating: form.difficulty_rating,
        explanation_body: form.explanation_body,
        is_active: form.is_active,
        order: form.order,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        task_body: form.task_body,
        title: form.title,
      })
      .eq("id", taskId);

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    setStatus("Task saved.");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!taskId) {
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/tasks");
  };

  if (loading) {
    return (
      <section className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        Loading task editor...
      </section>
    );
  }

  if (!task) {
    return (
      <section className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        {status ?? "Task not found."}
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="space-y-6 rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
            Task editor
          </p>
          <h2 className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
            Day {task.order}
          </h2>
          <p className="mt-3 text-sm text-focuslab-secondary">
            {status ?? "Edit the task copy, markdown sections, and metadata."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Title
            </span>
            <input
              className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              value={form.title}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Tags
            </span>
            <input
              className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
              onChange={(event) =>
                setForm((current) => ({ ...current, tags: event.target.value }))
              }
              value={form.tags}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Order
            </span>
            <input
              className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
              min={1}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  order: Number(event.target.value || 1),
                }))
              }
              type="number"
              value={form.order}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Difficulty
            </span>
            <input
              className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
              max={5}
              min={1}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  difficulty_rating: Number(event.target.value || 1),
                }))
              }
              type="number"
              value={form.difficulty_rating}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
              Default duration
            </span>
            <input
              className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
              min={1}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  default_duration_days: Number(event.target.value || 1),
                }))
              }
              type="number"
              value={form.default_duration_days}
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-focuslab-border px-4 py-3 text-sm font-semibold text-focuslab-secondary">
            <input
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  is_active: event.target.checked,
                }))
              }
              type="checkbox"
            />
            Active in journey
          </label>
        </div>

        <MarkdownEditor
          label="Task body"
          onChange={(value) =>
            setForm((current) => ({ ...current, task_body: value }))
          }
          value={form.task_body}
        />

        <MarkdownEditor
          label="Explanation"
          onChange={(value) =>
            setForm((current) => ({ ...current, explanation_body: value }))
          }
          value={form.explanation_body}
        />

        <MarkdownEditor
          height={220}
          label="Deeper reading"
          onChange={(value) =>
            setForm((current) => ({ ...current, deeper_reading: value }))
          }
          value={form.deeper_reading}
        />

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-focuslab-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-focuslab-secondary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
            type="button"
          >
            {saving ? "Saving..." : "Save task"}
          </button>
          <button
            className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
            onClick={() => {
              void handleDelete();
            }}
            type="button"
          >
            Delete task
          </button>
        </div>
      </article>

      <aside className="space-y-6">
        <article className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
            Mobile preview
          </p>
          <h3 className="mt-2 text-2xl font-bold text-focuslab-primaryDark">
            How this task feels in-app
          </h3>
          <div className="mt-6">
            <MobilePreview
              explanation={form.explanation_body}
              subtitle={
                form.default_duration_days > 1
                  ? `Day 1 of ${form.default_duration_days}`
                  : "Today's task"
              }
              taskBody={form.task_body}
              title={form.title}
            />
          </div>
        </article>
      </aside>
    </section>
  );
}
