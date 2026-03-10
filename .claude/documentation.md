# FocusLab Documentation

This document is updated continuously as milestones land so it reflects reality.

## What FocusLab is

- A mobile-first ADHD journey app that guides users through a 30-task sequential program designed to build lasting focus habits.
- Content is drawn from ADHD research (Dr. Alok Kanojia's "30 Days with ADHD", HealthyGamerGG, motivational literature).
- The app uses gated progression, spaced reinforcement (SM-2 inspired algorithm), novelty-driven notifications, and community accountability to maximize retention for ADHD users.
- Platforms: iOS + Android (native, primary), web dashboard (admin CMS + user stats, secondary).

## Status

- Milestone 01: not started
- Milestone 02: not started
- Milestone 03: not started
- Milestone 04: not started
- Milestone 05: not started
- Milestone 06: not started
- Milestone 07: not started
- Milestone 08: not started
- Milestone 09: not started
- Milestone 10: not started
- Milestone 11: not started
- Milestone 12: not started
- Milestone 13: not started
- Milestone 14: not started
- Milestone 15: not started
- Milestone 16: not started
- Milestone 17: not started
- Milestone 18: not started

## Local setup

(Will be populated when tech stack is finalized and Milestone 01 is complete.)

### Prerequisites
- Node LTS on macOS
- iOS: Xcode + iOS Simulator (for iOS development)
- Android: Android Studio + emulator (for Android development)
- Database: PostgreSQL (local or Docker)
- Redis: local or Docker (for caching/sessions)

### Dev commands (TBD — will match chosen framework)
- Mobile app dev server
- Web dashboard dev server
- Backend API dev server
- Run all services concurrently

## Verification commands

(Will be populated per chosen stack.)
- Lint
- Typecheck
- Unit tests
- Integration tests
- Build

## Admin CMS usage

(Will be documented when Milestone 04 is complete.)
- How to access the admin panel
- How to create / edit / reorder tasks
- How to manage notification templates
- How to tune spaced-repetition parameters
- How to moderate community posts
- How to manage reward bundle content

## Notification configuration

(Will be documented when Milestone 09 is complete.)
- Push notification setup (APNs + FCM credentials)
- Email service setup (API keys, sender domain)
- Template management via CMS
- Quiet hours and timezone handling

## Payment flow testing

(Will be documented when Milestone 11 is complete.)
- Sandbox/test environment setup for iOS and Android
- How to trigger test purchases
- How to verify receipt validation
- How to test entitlement gating

## Demo flow

(Will be refined as milestones land.)
1. Launch app → onboarding (name + motivating question) → Day 1 task appears
2. Read task, try it, tap "Done" → quick check-in (emoji rating + did-you-try-it)
3. Optional: fill in deeper reflection prompts
4. Next day: new task unlocked, previous task enters spaced-repetition pool
5. Reinforcement review card appears alongside active task when algorithm schedules it
6. Community: tap into task thread, see other users' experiences, post a win
7. Widget: home screen shows Day X/30 + streak + task title
8. Notification: receive a push notification with varied copy encouraging today's task
9. Day 16: paywall for free users, seamless continuation for paid users
10. Day 30: completion screen → quiz → reward bundle → option to restart

## Repo structure overview

(Will be finalized in Milestone 01.)

```
focuslab/
├── apps/
│   ├── mobile/          # React Native / Expo — iOS + Android
│   │   ├── src/
│   │   │   ├── screens/       # Screen components by feature
│   │   │   ├── components/    # Shared UI components
│   │   │   ├── navigation/    # Tab + stack navigation
│   │   │   ├── stores/        # State management
│   │   │   ├── services/      # API client, IAP, widget bridge
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── animations/    # Spring animation configs
│   │   │   └── theme/         # Colors, typography, spacing tokens
│   │   ├── ios/               # iOS native (WidgetKit extension)
│   │   └── android/           # Android native (widget, etc.)
│   │
│   ├── web/             # Next.js or Vite + React — admin CMS + user dashboard
│   │   ├── src/
│   │   │   ├── pages/         # Route pages (admin/, dashboard/)
│   │   │   ├── components/    # Shared UI components
│   │   │   └── services/      # API client
│   │   └── ...
│   │
│   └── api/             # Backend API (Node.js)
│       ├── src/
│       │   ├── routes/        # REST endpoints by resource
│       │   ├── services/      # Business logic (journey, spaced-rep, notifications)
│       │   ├── jobs/          # Scheduled jobs (daily notifications, reviews)
│       │   ├── middleware/    # Auth, rate limiting, error handling
│       │   ├── db/            # Schema, migrations, seed
│       │   └── utils/         # Helpers
│       └── ...
│
├── packages/
│   └── shared/          # Shared TypeScript types + utilities
│       └── src/
│           ├── types/         # Task, Progress, CheckIn, User, etc.
│           └── algorithm/     # Spaced-repetition (pure, testable)
│
├── .claude/             # Project spec files (this directory)
├── docs/                # Additional documentation
└── package.json         # Workspace root
```

## Data model overview (high level)

- **Users**: auth credentials, profile, payment status, notification preferences
- **Tasks**: admin-authored content (title, task body, explanation, deeper reading, difficulty, tags)
- **User Progress**: per-user per-task state (locked → active → completed), timestamps, multi-day tracking
- **Check-ins**: quick rating + optional deeper reflections, tied to task + user
- **Spaced Repetition State**: per-user per-task algorithm state (ease factor, interval, next review date)
- **Community Posts**: text posts on per-task threads, with replies and emoji reactions
- **Notification Log**: sent notifications with template, channel, and open tracking
- **Notification Templates**: admin-managed templates with tone tags for diversity rotation

See `architecture.md` for the complete schema and API design.

## Troubleshooting

(Will be populated as issues are discovered during implementation.)

### Common issues
- **Database connection fails**: Ensure PostgreSQL is running locally or via Docker. Check connection string in `.env`.
- **Push notifications not delivering**: Verify APNs/FCM credentials are configured. Check device token registration.
- **Widget not updating**: Widget reads from shared app storage. Ensure the app has written fresh data after task unlock.
- **Payment sandbox issues**: Ensure you're using sandbox/test accounts for App Store and Google Play. Production receipts won't validate in sandbox mode.
- **Auth token expired**: The app should auto-refresh tokens. If it fails, log out and back in.
