"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { startTransition } from "react";
import type { TaskRow } from "@focuslab/shared";
import { DEFAULT_JOURNEY_ID } from "@focuslab/shared";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function AdminTasksPage() {
  const supabase = createSupabaseBrowserClient();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("journey_id", DEFAULT_JOURNEY_ID)
      .order("order");

    if (error) {
      setStatus(error.message);
      setTasks([]);
      setLoading(false);
      return;
    }

    startTransition(() => {
      setTasks((data ?? []) as TaskRow[]);
      setLoading(false);
    });
  };

  useEffect(() => {
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setStatus("Creating a new task...");
    const nextOrder = (tasks[tasks.length - 1]?.order ?? 0) + 1;
    const { error } = await supabase.from("tasks").insert({
      default_duration_days: 1,
      difficulty_rating: 3,
      explanation_body: "Why this matters...",
      interaction_config: {},
      interaction_type: "markdown",
      journey_id: DEFAULT_JOURNEY_ID,
      order: nextOrder,
      tags: ["adhd", "focus"],
      task_body: "Write the action step here.",
      title: `New task ${nextOrder}`,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Task created.");
    await loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    setBusyTaskId(taskId);
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      setStatus(error.message);
      setBusyTaskId(null);
      return;
    }

    setStatus("Task deleted.");
    setBusyTaskId(null);
    await loadTasks();
  };

  const handleMove = async (taskId: string, direction: -1 | 1) => {
    const currentIndex = tasks.findIndex((task) => task.id === taskId);
    const swapIndex = currentIndex + direction;

    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= tasks.length) {
      return;
    }

    const current = tasks[currentIndex];
    const target = tasks[swapIndex];

    if (!current || !target) {
      return;
    }

    setBusyTaskId(taskId);
    const { error: firstError } = await supabase
      .from("tasks")
      .update({ order: -1 })
      .eq("id", current.id);

    if (firstError) {
      setStatus(firstError.message);
      setBusyTaskId(null);
      return;
    }

    const { error: secondError } = await supabase
      .from("tasks")
      .update({ order: current.order })
      .eq("id", target.id);

    if (secondError) {
      setStatus(secondError.message);
      setBusyTaskId(null);
      return;
    }

    const { error: thirdError } = await supabase
      .from("tasks")
      .update({ order: target.order })
      .eq("id", current.id);

    if (thirdError) {
      setStatus(thirdError.message);
      setBusyTaskId(null);
      return;
    }

    setStatus("Task order updated.");
    setBusyTaskId(null);
    await loadTasks();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
              Tasks
            </p>
            <h2 className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
              Manage the 30-day journey
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-focuslab-secondary">
              Create tasks, adjust ordering, and open the markdown editor for the
              action/explanation copy.
            </p>
          </div>
          <button
            className="rounded-full bg-focuslab-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-focuslab-secondary"
            onClick={() => {
              void handleCreate();
            }}
            type="button"
          >
            Create task
          </button>
        </div>
        <p className="mt-4 text-sm text-focuslab-secondary">
          {status ?? `${tasks.length} task${tasks.length === 1 ? "" : "s"} loaded.`}
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
            Loading tasks...
          </div>
        ) : null}

        {!loading && tasks.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
            No tasks found yet.
          </div>
        ) : null}

        {tasks.map((task, index) => (
          <article
            className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]"
            key={task.id}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
                  Day {task.order}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-bold text-focuslab-primaryDark">
                    {task.title}
                  </h3>
                  {task.interaction_type !== "markdown" ? (
                    <span className="inline-block rounded-full bg-focuslab-border px-2 py-0.5 text-xs font-medium text-focuslab-secondary">
                      {task.interaction_type.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 line-clamp-3 text-base leading-7 text-focuslab-secondary">
                  {task.task_body}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-focuslab-border px-4 py-2 text-sm font-semibold text-focuslab-secondary transition hover:bg-focuslab-background disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={index === 0 || busyTaskId === task.id}
                  onClick={() => {
                    void handleMove(task.id, -1);
                  }}
                  type="button"
                >
                  Move up
                </button>
                <button
                  className="rounded-full border border-focuslab-border px-4 py-2 text-sm font-semibold text-focuslab-secondary transition hover:bg-focuslab-background disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={index === tasks.length - 1 || busyTaskId === task.id}
                  onClick={() => {
                    void handleMove(task.id, 1);
                  }}
                  type="button"
                >
                  Move down
                </button>
                <Link
                  className="rounded-full border border-focuslab-primary px-4 py-2 text-sm font-semibold text-focuslab-primary transition hover:bg-focuslab-background"
                  href={`/admin/tasks/${task.id}`}
                >
                  Edit task
                </Link>
                <button
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busyTaskId === task.id}
                  onClick={() => {
                    void handleDelete(task.id);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
