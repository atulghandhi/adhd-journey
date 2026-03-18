"use client";

import { useEffect, useState } from "react";
import type { Database } from "@focuslab/shared";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type RewardResourceRow = Database["public"]["Tables"]["reward_resources"]["Row"];
type EditableReward = RewardResourceRow & {
  localId: string;
};

function createDraftReward(order: number): EditableReward {
  const timestamp = new Date().toISOString();

  return {
    created_at: timestamp,
    description: "Describe the resource and why it helps.",
    id: `draft-${order}`,
    is_active: true,
    localId: crypto.randomUUID(),
    sort_order: order,
    title: `New resource ${order}`,
    updated_at: timestamp,
    url: "https://example.com/resource",
  };
}

export default function AdminRewardsPage() {
  const supabase = createSupabaseBrowserClient();
  const [resources, setResources] = useState<EditableReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reward_resources")
      .select("*")
      .order("sort_order");

    if (error) {
      setStatus(error.message);
      setResources([]);
      setLoading(false);
      return;
    }

    setResources(
      ((data ?? []) as RewardResourceRow[]).map((resource) => ({
        ...resource,
        localId: resource.id,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setResources((current) => [...current, createDraftReward(current.length + 1)]);
    setStatus("Reward resource draft added.");
  };

  const handleChange = (
    localId: string,
    field: keyof RewardResourceRow,
    value: string | boolean | number,
  ) => {
    setResources((current) =>
      current.map((resource) =>
        resource.localId === localId
          ? {
              ...resource,
              [field]: value,
            }
          : resource,
      ),
    );
  };

  const handleSave = async (resource: EditableReward) => {
    setSavingId(resource.localId);
    const payload = {
      description: resource.description,
      is_active: resource.is_active,
      sort_order: resource.sort_order,
      title: resource.title,
      url: resource.url,
    };
    const response = resource.id.startsWith("draft-")
      ? await supabase
          .from("reward_resources")
          .insert(payload)
          .select("*")
          .single()
      : await supabase
          .from("reward_resources")
          .update(payload)
          .eq("id", resource.id)
          .select("*")
          .single();

    if (response.error || !response.data) {
      setStatus(response.error?.message ?? "Resource could not be saved.");
      setSavingId(null);
      return;
    }

    setStatus("Reward resource saved.");
    setSavingId(null);
    await loadResources();
  };

  const handleDelete = async (resource: EditableReward) => {
    if (resource.id.startsWith("draft-")) {
      setResources((current) => current.filter((item) => item.localId !== resource.localId));
      return;
    }

    setSavingId(resource.localId);
    const { error } = await supabase
      .from("reward_resources")
      .delete()
      .eq("id", resource.id);

    if (error) {
      setStatus(error.message);
      setSavingId(null);
      return;
    }

    setStatus("Reward resource deleted.");
    setSavingId(null);
    await loadResources();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
              Rewards
            </p>
            <h2 className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
              Resource bundle manager
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-focuslab-secondary">
              Control the links shown on the in-app Resources screen after completion
              or from the Account tab.
            </p>
          </div>
          <button
            className="rounded-full bg-focuslab-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-focuslab-secondary"
            onClick={handleAdd}
            type="button"
          >
            Add resource
          </button>
        </div>
        <p className="mt-4 text-sm text-focuslab-secondary">
          {status ?? `${resources.length} resource${resources.length === 1 ? "" : "s"} ready.`}
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-[28px] bg-white p-6 text-focuslab-secondary shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
            Loading resources...
          </div>
        ) : null}

        {resources.map((resource) => (
          <article
            className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]"
            key={resource.localId}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Title
                </span>
                <input
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    handleChange(resource.localId, "title", event.target.value)
                  }
                  value={resource.title}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Sort order
                </span>
                <input
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    handleChange(
                      resource.localId,
                      "sort_order",
                      Number(event.target.value || 1),
                    )
                  }
                  type="number"
                  value={resource.sort_order}
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                URL
              </span>
              <input
                className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                onChange={(event) =>
                  handleChange(resource.localId, "url", event.target.value)
                }
                value={resource.url}
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                Description
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                onChange={(event) =>
                  handleChange(resource.localId, "description", event.target.value)
                }
                value={resource.description}
              />
            </label>

            <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-focuslab-secondary">
              <input
                checked={resource.is_active}
                onChange={(event) =>
                  handleChange(resource.localId, "is_active", event.target.checked)
                }
                type="checkbox"
              />
              Active
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-focuslab-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-focuslab-secondary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={savingId === resource.localId}
                onClick={() => {
                  void handleSave(resource);
                }}
                type="button"
              >
                {savingId === resource.localId ? "Saving..." : "Save resource"}
              </button>
              <button
                className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={savingId === resource.localId}
                onClick={() => {
                  void handleDelete(resource);
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
