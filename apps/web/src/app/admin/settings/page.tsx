"use client";

import { useEffect, useState } from "react";
import type { SpacedRepetitionConfigRow } from "@focuslab/shared";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function AdminSettingsPage() {
  const supabase = createSupabaseBrowserClient();
  const [config, setConfig] = useState<SpacedRepetitionConfigRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("spaced_repetition_config")
        .select("*")
        .eq("id", 1)
        .single();

      if (error || !data) {
        setStatus(error?.message ?? "Config not found.");
        setConfig(null);
        setLoading(false);
        return;
      }

      setConfig(data as SpacedRepetitionConfigRow);
      setLoading(false);
    };

    void loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field: keyof SpacedRepetitionConfigRow, value: number) => {
    setConfig((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  };

  const handleSave = async () => {
    if (!config) {
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("spaced_repetition_config")
      .update({
        base_interval_days: config.base_interval_days,
        decay_multiplier: config.decay_multiplier,
        ease_floor: config.ease_floor,
        max_reviews_per_day: config.max_reviews_per_day,
        struggle_threshold: config.struggle_threshold,
      })
      .eq("id", 1);

    if (error) {
      setStatus(error.message);
      setSaving(false);
      return;
    }

    setStatus("SR config saved.");
    setSaving(false);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-focuslab-secondary">
          SR config
        </p>
        <h2 className="mt-2 text-3xl font-bold text-focuslab-primaryDark">
          Tune the repetition engine
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-focuslab-secondary">
          These values feed the shared spaced-repetition logic used by the app and the
          daily review job.
        </p>
      </div>

      <article className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
        {loading || !config ? (
          <p className="text-focuslab-secondary">{status ?? "Loading config..."}</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Base interval days
                </span>
                <input
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    updateField("base_interval_days", Number(event.target.value || 0))
                  }
                  step="0.1"
                  type="number"
                  value={config.base_interval_days}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Ease floor
                </span>
                <input
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    updateField("ease_floor", Number(event.target.value || 0))
                  }
                  step="0.1"
                  type="number"
                  value={config.ease_floor}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Struggle threshold
                </span>
                <input
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    updateField("struggle_threshold", Number(event.target.value || 0))
                  }
                  type="number"
                  value={config.struggle_threshold}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Max reviews per day
                </span>
                <input
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    updateField("max_reviews_per_day", Number(event.target.value || 0))
                  }
                  type="number"
                  value={config.max_reviews_per_day}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-focuslab-secondary">
                  Decay multiplier
                </span>
                <input
                  className="w-full rounded-2xl border border-focuslab-border px-4 py-3 text-base text-focuslab-primaryDark outline-none transition focus:border-focuslab-primary"
                  onChange={(event) =>
                    updateField("decay_multiplier", Number(event.target.value || 0))
                  }
                  step="0.1"
                  type="number"
                  value={config.decay_multiplier}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-focuslab-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-focuslab-secondary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
                onClick={() => {
                  void handleSave();
                }}
                type="button"
              >
                {saving ? "Saving..." : "Save config"}
              </button>
              <p className="self-center text-sm text-focuslab-secondary">
                {status ?? "Adjust these carefully. Changes affect future reviews."}
              </p>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
