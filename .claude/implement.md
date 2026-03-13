Now implement the entire project end-to-end.

Non-negotiable constraint

* Do not stop after a milestone to ask questions or wait for confirmation.
* Proceed through every milestone in `plans.md` until the whole project is complete and fully validated.
* Exception: milestones tagged `[NEEDS CREDENTIALS]` — implement the code fully, but skip live integration tests for those. Log a warning instead.

Execution rules (follow strictly)

* Treat `plans.md` as the source of truth. If anything is ambiguous, make a reasonable decision and record it in `plans.md` under "Implementation Notes" before coding.
* Treat `architecture.md` as the source of truth for tech stack, data model, and API design. Do not deviate from it.
* Implement deliberately with small, reviewable commits. Avoid bundling unrelated changes.
* After every milestone:

    * Run verification commands: `npx turbo lint && npx turbo typecheck && npx turbo test`
    * Fix all failures immediately
    * Add or update tests that cover the milestone's core behavior
    * Commit with a clear message that references the milestone name (e.g., `feat: milestone-02 database schema + migrations`)
* If a bug is discovered at any point:

    * Write a failing test that reproduces it
    * Fix the bug
    * Confirm the test now passes
    * Record a short note in `plans.md` under "Implementation Notes"

Credential and external service rules

* **Local Supabase for all DB/auth work**: Use `supabase start` to run the local stack. No cloud Supabase project is needed for development. The local stack provides Postgres, Auth, Storage, Edge Functions, and Studio.
* **Stub external services when credentials are missing**: For FCM (push), Resend (email), and RevenueCat (payments), check for the environment variable at runtime. If missing:
    * Log a clear warning: `[STUB] FCM_SERVER_KEY not set — skipping push notification send`
    * Return a mock success response so the rest of the flow continues
    * Never throw an error or crash due to missing credentials
* **Edge Functions**: Test locally with `supabase functions serve`. They can call the local Postgres and Auth without any cloud credentials.
* **Type generation**: After any migration change, regenerate types: `supabase gen types typescript --local > packages/shared/src/types/database.ts`

Verification categories

Each acceptance criterion in `plans.md` falls into one of these categories:

* **[AUTO]** — Can be verified by running automated commands (lint, typecheck, tests). The agent must verify these.
* **[LOCAL]** — Can be verified by running the app locally (Expo Go, Next.js dev server, local Supabase). The agent should start the relevant dev server and confirm no errors.
* **[MANUAL]** — Requires human visual/UX review (animation feel, layout quality, accessibility audit). The agent should implement to spec and note these for human review.
* **[CREDENTIALS]** — Requires real API keys (FCM, Resend, RevenueCat, Apple/Google). The agent should implement the integration code with stubs and note these for human testing.

Validation requirements

* Maintain a "verification checklist" section in `plans.md` that stays accurate as the repo evolves.
* Spaced-repetition algorithm must have deterministic test coverage: same inputs must always produce the same scheduling output. **[AUTO]**
* Journey progression logic must be tested: unlock gating, time gating, multi-day extension, reinforcement insertion. **[AUTO]**
* Notification scheduling must be tested: template rotation, channel cycling, quiet hours. **[AUTO]**
* RLS policies must be tested: verify that users cannot access other users' data, non-admins cannot access admin routes. **[AUTO]** (via Supabase client with different user tokens in tests)

Documentation requirements

* Keep `documentation.md` concise and useful. Update it as you implement so it matches reality.
* At the end, ensure `documentation.md` includes:

    * What FocusLab is
    * Prerequisites (Node.js, Supabase CLI, Docker Desktop, Expo CLI)
    * Local setup: `supabase start`, `npm install`, `npx turbo dev`
    * How to run tests, lint, typecheck (`npx turbo lint && npx turbo typecheck && npx turbo test`)
    * How to use the admin CMS to create/edit tasks
    * How to configure notifications (push + email) — what credentials are needed, where to set them
    * How to test the payment flow (RevenueCat sandbox setup)
    * How to demo the full journey (onboarding → tasks → check-in → community → widget)
    * Repo structure overview (matching `agents.md`)
    * Data model overview (reference `architecture.md`)
    * Edge Functions reference (what each one does, how to invoke)
    * Environment variables reference (all vars from `.env.example` with descriptions)
    * Troubleshooting section (top issues and fixes)

Completion criteria (do not stop until all are true)

* All milestones in `plans.md` are implemented and checked off.
* Mobile app launches in Expo Go with the full journey flow working (onboarding → tasks → check-in → progress). **[LOCAL]**
* Web dashboard loads with admin CMS and user stats views. **[LOCAL]**
* Supabase migrations apply cleanly (`supabase db reset` succeeds). **[AUTO]**
* Seed data populates 30 placeholder tasks, notification templates, and SR config. **[AUTO]**
* Edge Functions serve locally without errors (`supabase functions serve`). **[LOCAL]**
* Spaced-repetition algorithm is scheduling reinforcement reviews correctly. **[AUTO]**
* Push notifications code is implemented with stub fallback when FCM key is missing. **[CREDENTIALS]**
* Email code is implemented with stub fallback when Resend key is missing. **[CREDENTIALS]**
* Home screen widget code exists for both platforms. **[MANUAL]** (requires native build to verify)
* Freemium gate blocks task 16+ for unpaid users. **[AUTO]**
* Community threads are gated by task unlock (RLS enforced). **[AUTO]**
* All tests pass: `npx turbo lint && npx turbo typecheck && npx turbo test`. **[AUTO]**
* `documentation.md` is accurate and complete. **[MANUAL]**
* `.env.example` exists with all required variables documented. **[AUTO]**
* TypeScript types are auto-generated and up to date. **[AUTO]**

Start now by reading `plans.md` and beginning Milestone 1. Continue until everything is finished.
