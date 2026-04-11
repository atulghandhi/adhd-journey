# FocusLab Testing Strategy

As this codebase evolves via Agentic Development, maintaining an airtight, non-flaky test suite is paramount. Agents rely heavily on CI signals (passing/failing tests) to iteratively fix bugs and verify functionality across web, mobile, and backend contexts without manual human QA intervention.

This plan outlines an Agent-Optimized Testing Strategy. It minimizes overlapping test boundaries, eliminates highly-mutable, flaky snapshot tests, and focuses on high-ROI deterministic assertions.

## 1. Core Philosophy: Agent-Optimized Testing

- **Determinism over Coverage**: A flaky test is worse than no test for an AI agent, as it leads to "hallucinated" bug fixing (chasing ghosts). We avoid time-dependent state and rigidly mock API responses.
- **Pure Functions First**: Complex ADHD-specific logic (Spaced Repetition, streaks, quiz scoring, notification scheduling) lives in `@focuslab/shared`. We target 100% unit test coverage here using pure Data-In / Data-Out principles.
- **Shift-Left Security**: Database-level security (RLS) is tested directly against Postgres, bypassing the UI layers.
- **Declarative E2E**: For mobile testing, we use YAML-based Maestro because its readable syntax is easy for agents to write, read, and debug compared to complex Appium setups.

### Test Hygiene Rules for Agents

These rules ensure every test is useful signal, never noise:

- Tests must not depend on execution order (no shared mutable state between tests)
- Tests must not hit real network endpoints (mock the Supabase client everywhere)
- Tests must complete in <30s per workspace (fast agent feedback loops)
- Failed test output must include assertion diffs (vitest does this by default; jest is configured with `--verbose`)
- No `toMatchSnapshot()` anywhere — use semantic queries (`getByText`, `toBeDisabled`) instead
- Time-dependent tests must use a fixed clock (`vi.useFakeTimers()` / `jest.useFakeTimers()`)

### Test Runner Split

This is an intentional split driven by platform constraints:

| Workspace | Runner | Why |
|-----------|--------|-----|
| `packages/shared` | vitest | Fast, ESM-native, great monorepo support |
| `apps/web` | vitest + jsdom | Matches shared runner; jsdom for DOM assertions |
| `apps/mobile` | jest-expo | Expo's test infra is Jest-based; required for React Native component testing |

## 2. Test Tiers & Boundaries

### A. Unit Tests: The Pure Logic Layer

**Framework**: vitest (shared + web), jest-expo (mobile)
**Scope**: `@focuslab/shared` and strictly pure UI utilities

**Existing coverage** (extend, don't re-scaffold):
- Spaced Repetition Engine (`algorithm/__tests__/spacedRepetition.test.ts`)
- Journey Progression & Streaks (`journey/__tests__/progression.test.ts`)
- Quiz Scoring (`quiz/__tests__/index.test.ts`)
- Notification Engine (`notifications/__tests__/engine.test.ts`)
- EF Equivalence (`__tests__/ef-equivalence.test.ts`) — verifies parity between `@focuslab/shared` and `supabase/functions/_shared/domain.ts`

**Targets to add**:
- Date/Timezone Utilities (`timezone.ts`): Crucial for an app where "Did you do it today?" changes based on user locale.
- Edge Defaults: Validate that parsing `interaction_config` JSON schema never throws unhandled exceptions.
- Notification quiet-hours boundary cases (e.g., quiet window spanning midnight, timezone edge cases like DST transitions).

### B. Integration Tests: React Native Components

**Framework**: jest-expo + `@testing-library/react-native`
**Scope**: `apps/mobile` interactive UI elements without booting a simulator

**Existing coverage** (9 test files):
- TaskRenderer utilities, StreakBadge, JourneyMapNode, auth routing, springs, motivation, BootstrapScreen, EmojiRating, PrimaryButton

**Targets to add**:
- Task Renderers: Mount `DragListTask`, `BreathingExerciseTask`, etc. Assert that:
  - The "I did it" submit callback is disabled initially.
  - Interaction (e.g., waiting for timer, sorting items) enables the submit callback.
  - Form interactions handle invalid inputs gracefully.
- Journey Map Rendering: Mock Supabase task-fetch, assert the active node matches the "next up" logic.

**Note**: We avoid visual snapshot testing (`toMatchSnapshot()`) as minor styling tweaks break them, creating noise for the agent. We use semantic queries (`getByText`, `toBeDisabled`).

### C. Database & Security Tests (RLS)

**Framework**: pgTAP via Supabase CLI (`supabase test db`)
**Scope**: `supabase/migrations` & all tables with RLS policies

**Targets** (priority order):

1. **Data Isolation**: Verify user A cannot `SELECT` or `UPDATE` the `check_ins` or `user_progress` of user B.
2. **Admin Roles**: Verify that only a user with `role = 'admin'` can alter records in the tasks CMS, notification templates, and quiz questions.
3. **Triggers**: Ensure `on_auth_user_created` correctly provisions a user inside `profiles`.
4. **Community Cross-Table RLS** (highest complexity, most likely to regress):
   - User can only see community posts for tasks they've unlocked AND that aren't hidden
   - Reactions can only be added to visible, non-hidden posts on unlocked tasks
   - Replies inherit the visibility rules of their parent post
   - Reports can only be filed on visible posts; only admins can read reports
5. **Spaced Repetition State**: Users can only read/update their own SR state; admins can access all.

### D. Edge Function Tests

**Framework**: Deno test runner (edge functions run in Deno)
**Scope**: `supabase/functions/`

**Targets**:
- `complete-check-in`: Validates check-in processing logic
- `daily-notifications`: Validates notification scheduling respects quiet hours and timezone
- `daily-reviews`: Validates SR review scheduling
- `get-journey-state`: Validates journey state computation matches `@focuslab/shared` logic
- `verify-payment`: Validates receipt validation logic
- `delete-account`: Validates cascade behavior
- `_shared/domain.ts`: Already covered by EF-equivalence tests — maintain parity

### E. End-to-End (E2E) Testing

E2E testing is strictly reserved for the "Critical Path" (core loops) to prevent CI times from ballooning.

#### Mobile E2E (Maestro)

**Why Maestro?** YAML is deterministic, easily generated/read by AI, and resilient to UI refactors.
**Scope**: `apps/mobile`

Targets (The "Golden Path"):
- **Auth Flow**: Boot app -> Register with test credentials -> Arrive at Journey Map.
- **Daily Loop**: Tap active task node -> Scroll through Markdown -> Complete interactive exercise -> Tap "I did it" -> See "Done for today" ring -> See streak increment.

#### Web E2E (Playwright)

**Why Playwright?** Built-in browser contexts, trace viewers, and excellent async handling.
**Scope**: `apps/web` (Admin Dashboard)

Targets:
- **CMS Integrity**: Admin logs in -> Navigates to `/admin/tasks` -> Reorders a task using buttons -> Opens Editor -> Modifies `interaction_type` -> Saves -> Reloads page to assert DB persistency.

## 3. CI Scripts

The monorepo exposes unified entry points for agents and CI. Use existing script names where they exist.

| Script | What it runs | Notes |
|--------|-------------|-------|
| `npm run typecheck` | `tsc --noEmit` on all workspaces via Turbo | Already exists. First line of defense. |
| `npm run test` | vitest + jest across all workspaces via Turbo | Already exists. Fast feedback loop. |
| `npm run test:db` | Local Supabase pgTAP tests | **To add** |
| `npm run test:edge` | Deno test for edge functions | **To add** |
| `npm run test:web:e2e` | Playwright in headless mode | **To add** |
| `npm run test:mobile:e2e` | Maestro flows | **To add** |
| `npm run test:ci` | `typecheck && test && test:db && test:edge` | **To add** — single command for agents |

### Example Agent-Diagnostic Flow

If a user requests: "Add a new interaction type called 'AudioQuiz'"

1. Agent creates SQL migration.
2. Agent adds TS interface in `@focuslab/shared`.
3. Agent runs `npm run typecheck` to instantly surface everywhere the new union type broke a `switch` statement.
4. Agent builds `AudioQuizTask` component and adds a React Native Testing Library test asserting the audio-ended event unlocks the "Complete" button.
5. Agent runs `npm run test` to verify.

## 4. Implementation Phases

### Phase 1: Extend Shared & Mobile Unit Tests
**Trigger**: Before merging any new shared logic (partially done — SR, streaks, quiz, notifications already covered).

- Add timezone/date utility tests to `packages/shared`
- Add `interaction_config` edge-case parsing tests
- Add notification quiet-hours boundary tests
- Expand mobile TaskRenderer tests for new interaction types as they're built

### Phase 2: Database & Edge Function Tests
**Trigger**: Before the admin dashboard goes live or before adding new migrations.

- Set up pgTAP in `supabase/tests/`
- Write RLS tests for all tiers (data isolation, admin, community cross-table)
- Set up Deno test runner for edge functions
- Add `test:db` and `test:edge` scripts to root `package.json`

### Phase 3: E2E & CI Pipeline
**Trigger**: Before shipping to TestFlight / before first public release.

- Set up Maestro flows for mobile golden path
- Set up Playwright for web admin CMS
- Create GitHub Actions CI workflow running `test:ci` on PRs and `test:ci + test:mobile:e2e + test:web:e2e` on merge to main
- Add `test:ci` orchestration script
