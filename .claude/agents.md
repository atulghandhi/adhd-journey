# Repository Guidelines

## Project Structure & Module Organization
- `apps/mobile/`: React Native / Expo — iOS + Android native app (primary platform).
- `apps/web/`: Web dashboard — admin CMS + user-facing stats/history.
- `apps/api/`: Backend API — Node.js server with REST endpoints, scheduled jobs, and database access.
- `packages/shared/`: Shared TypeScript types and pure utility functions (spaced-repetition algorithm, type definitions).
- `docs/`: Design notes, architecture references, and additional documentation.
- `.claude/`: Project spec files (prompt, plans, architecture, design, implementation rules).
- Tests live alongside code in `__tests__` folders (for example, `packages/shared/src/algorithm/__tests__`).

## Build, Test, and Development Commands
(Commands will be finalized when tech stack is chosen in Milestone 01. Placeholders below.)
- Dev: start all services concurrently (mobile dev server, web dev server, API server).
- Build: production builds for each app.
- Typecheck: strict TS project checks without emitting.
- Lint: ESLint across the monorepo with zero warnings allowed.
- Test: run all unit + integration tests.
- Test (watch): run tests in watch mode during development.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts` / `.tsx`) across all apps and packages.
- Indentation: 2 spaces; prefer clear, explicit code over cleverness.
- Components: PascalCase filenames (for example, `TaskScreen.tsx`, `CheckInSheet.tsx`).
- Hooks: `useX.ts` (for example, `useHaptics.ts`, `useJourneyProgress.ts`).
- Services: `xService.ts` (for example, `journeyService.ts`, `notificationService.ts`).
- Stores/state: descriptive names ending with `Store` or matching framework convention.
- Styling: follow chosen framework's convention (NativeWind/Tailwind for mobile, Tailwind for web).
- Linting: ESLint is the source of truth. Run lint before all PRs.

## Testing Guidelines
- Framework: TBD (Vitest for shared/API, Jest + Testing Library for mobile, Vitest for web).
- Location: co-locate tests in `__tests__` directories alongside source.
- Naming: `*.test.ts` / `*.test.tsx`.
- Critical test coverage: spaced-repetition algorithm, journey progression logic, check-in validation, notification scheduling, paywall gating.
- Always run: typecheck + test + lint before merging.

## Commit & Pull Request Guidelines
- Follow conventional commits: `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `chore: ...`.
- Keep commits focused and scoped to a single change.
- PRs should include:
    - A short problem/solution summary.
    - Clear validation steps/commands.
    - Screenshots or recordings for UI changes (especially mobile).

## Architecture Notes (Quick Map)
- Journey engine + progression logic: `apps/api/src/services/journeyService.ts`
- Spaced-repetition algorithm (pure, testable): `packages/shared/src/algorithm/spacedRepetition.ts`
- Notification engine: `apps/api/src/services/notificationService.ts` + `apps/api/src/jobs/`
- Community: `apps/api/src/services/communityService.ts`
- Payment: `apps/api/src/services/paymentService.ts`
- Admin CMS: `apps/web/src/pages/admin/`
- Mobile screens: `apps/mobile/src/screens/` organized by feature (journey, community, progress, auth, onboarding, payment, completion)
- Shared types: `packages/shared/src/types/`
