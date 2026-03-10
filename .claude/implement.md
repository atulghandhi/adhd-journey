Now implement the entire project end-to-end.

Non-negotiable constraint

* Do not stop after a milestone to ask questions or wait for confirmation.
* Proceed through every milestone in `plans.md` until the whole project is complete and fully validated.

Execution rules (follow strictly)

* Treat `plans.md` as the source of truth. If anything is ambiguous, make a reasonable decision and record it in `plans.md` before coding.
* Implement deliberately with small, reviewable commits. Avoid bundling unrelated changes.
* After every milestone:

    * Run verification commands (lint, typecheck, unit tests, integration tests where applicable)
    * Fix all failures immediately
    * Add or update tests that cover the milestone's core behavior
    * Commit with a clear message that references the milestone name
* If a bug is discovered at any point:

    * Write a failing test that reproduces it
    * Fix the bug
    * Confirm the test now passes
    * Record a short note in `plans.md` under "Implementation Notes"

Validation requirements

* Maintain a "verification checklist" section in `plans.md` that stays accurate as the repo evolves.
* Spaced-repetition algorithm must have deterministic test coverage: same inputs must always produce the same scheduling output.
* Journey progression logic must be tested: unlock gating, time gating, multi-day extension, reinforcement insertion.
* Notification scheduling must be tested: template rotation, channel cycling, quiet hours.

Documentation requirements

* Create `documentation.md` and keep it concise and useful. Update it as you implement so it matches reality.
* At the end, ensure `documentation.md` includes:

    * What FocusLab is
    * Local setup and dev start commands (mobile, web dashboard, backend)
    * How to run tests, lint, typecheck
    * How to use the admin CMS to create/edit tasks
    * How to configure notifications (push + email)
    * How to test the payment flow
    * How to demo the full journey (onboarding → tasks → check-in → community → widget)
    * Repo structure overview
    * Data model overview (high level)
    * API reference or link to auto-generated docs
    * Troubleshooting section (top issues and fixes)

Completion criteria (do not stop until all are true)

* All milestones in `plans.md` are implemented and checked off.
* Mobile app launches on iOS simulator and Android emulator with the full journey flow working.
* Web dashboard loads with admin CMS and user stats views.
* Backend API is running with auth, task CRUD, progress tracking, check-ins, community, and notifications.
* Spaced-repetition algorithm is scheduling reinforcement reviews correctly.
* Push notifications fire with varied templates.
* Home screen widget displays progress on both platforms.
* Freemium gate blocks task 16+ for unpaid users.
* Community threads are gated by task unlock.
* All tests pass: `npm run test`, `npm run lint`, `npm run typecheck` (or equivalent for the chosen stack).
* `documentation.md` is accurate and complete.

Start now by reading `plans.md` and beginning Milestone 1. Continue until everything is finished.
