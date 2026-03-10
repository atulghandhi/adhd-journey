# FocusLab Architecture

FocusLab is a mobile-first ADHD journey app with a cloud-synced backend, admin CMS, and native home screen widgets. The architecture prioritizes offline resilience, low-friction interactions, and an algorithm-driven reinforcement engine that adapts to each user's progress.

## Guiding principles

- Retention over cleverness: every architectural choice serves user engagement.
- Offline-first mobile: the current task and recent check-ins work without internet.
- Content-driven: task content lives in the database, managed via admin CMS, not hardcoded.
- Algorithm-tunable: spaced-repetition parameters are configurable without code changes.

## System overview

```
┌───────────-──┐   ┌─────────────┐   ┌─────────────────-─┐
│  iOS App     │   │ Android App │   │  Web Dashboard    │
│  (primary)   │   │  (primary)  │   │  (admin + user)   │
└──────┬───────┘   └──────┬──────┘   └────────┬──────────┘
       │                  │                    │
       └──────────┬───────┘                    │
                  │         ┌──────────────────┘
                  ▼         ▼
          ┌───────────────────────┐
          │     Backend API       │
          │  (REST + WebSocket)   │
          └───────────┬───────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │ Database │ │  Object  │ │ Notification │
    │ (Postgres│ │  Storage │ │   Services   │
    │  + Redis)│ │ (S3/R2)  │ │ (Push+Email) │
    └──────────┘ └──────────┘ └──────────────┘
```

## Data model

### Users
- `id`, `email`, `name`, `avatar_url`
- `auth_provider` (email/password, Apple, Google)
- `role` (user, admin)
- `payment_status` (free, paid) + `payment_receipt`
- `notification_preferences` (channels, quiet hours, timezone)
- `created_at`, `last_active_at`

### Tasks (admin-authored content)
- `id`, `order` (1–30), `title`
- `task_body` (markdown — the immediate action)
- `explanation_body` (markdown — the why)
- `deeper_reading` (markdown — optional)
- `difficulty_rating` (1–5, used by spaced-repetition)
- `default_duration_days` (1 for most, 2–3 for complex tasks)
- `tags` (array — for categorization and search)
- `is_active` (boolean — admin can draft/unpublish)
- `created_at`, `updated_at`

### User Progress
- `user_id`, `task_id`
- `status` (locked, active, in_review, completed)
- `unlocked_at`, `completed_at`
- `current_day` (for multi-day tasks: which day of the task they're on)
- `extended_by_algorithm` (boolean — was this task extended beyond default duration)

### Check-ins
- `id`, `user_id`, `task_id`
- `type` (completion, reinforcement_review)
- `quick_rating` (1–5 emoji scale)
- `tried_it` (boolean)
- `prompt_responses` (JSON — optional deeper reflection answers)
- `time_spent_seconds` (how long the check-in screen was open)
- `created_at`

### Spaced Repetition State
- `user_id`, `task_id`
- `ease_factor` (SM-2 style, starts at 2.5)
- `interval_days` (current interval before next review)
- `review_count`
- `next_review_date`
- `last_review_rating`

### Community Posts
- `id`, `user_id`, `task_id`
- `body` (text)
- `is_hidden` (admin moderation)
- `created_at`

### Community Reactions
- `id`, `post_id`, `user_id`
- `emoji` (string — the reaction type)

### Community Replies
- `id`, `post_id`, `user_id`
- `body` (text)
- `is_hidden`
- `created_at`

### Notification Log
- `id`, `user_id`
- `channel` (push, email)
- `template_id`
- `sent_at`
- `opened_at` (nullable — for tracking engagement)

### Notification Templates
- `id`, `channel` (push, email)
- `subject` / `title`
- `body` (with template variables: `{{task_title}}`, `{{streak}}`, `{{day_number}}`, `{{user_name}}`)
- `tone_tag` (encouraging, playful, direct, reflective — for rotation diversity)
- `is_active`

## API design

RESTful JSON API with the following resource groups:

### Auth
- `POST /auth/register` — email/password signup
- `POST /auth/login` — email/password login
- `POST /auth/social` — Apple/Google OAuth
- `POST /auth/refresh` — token refresh
- `GET /auth/me` — current user profile

### Tasks (public, gated by progress)
- `GET /tasks` — list tasks with user's progress status (locked/active/completed)
- `GET /tasks/:id` — full task content (only if unlocked)
- `GET /tasks/:id/community` — discussion thread for a task (only if unlocked)

### Progress
- `GET /progress` — user's full journey state (current day, streak, completion map)
- `POST /progress/check-in` — submit a check-in for the active task
- `GET /progress/reinforcement` — get today's reinforcement review task (if any)
- `POST /progress/reinforcement/check-in` — submit reinforcement review check-in

### Community
- `POST /community/posts` — create a post on a task thread
- `POST /community/posts/:id/react` — add/remove a reaction
- `POST /community/posts/:id/reply` — reply to a post
- `POST /community/posts/:id/report` — report a post

### Notifications
- `PUT /notifications/preferences` — update notification settings
- `POST /notifications/device` — register push token

### Payment
- `POST /payment/verify` — verify App Store / Google Play receipt
- `GET /payment/status` — check entitlement

### Admin (admin role only)
- `CRUD /admin/tasks` — manage task content
- `GET /admin/analytics` — aggregate user stats
- `GET /admin/community` — moderation queue
- `PUT /admin/community/posts/:id` — hide/unhide post
- `CRUD /admin/notifications/templates` — manage notification templates
- `PUT /admin/spaced-repetition/config` — tune algorithm parameters

## Spaced-repetition algorithm

Based on SM-2 with ADHD-specific modifications:

### Core formula
```
new_interval = old_interval * ease_factor
new_ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
```

### ADHD modifications
- **Shorter initial intervals**: first review at 1 day (not 1 day then 6 days like standard SM-2). ADHD users need more frequent early reinforcement.
- **Struggle detection**: if `quick_rating <= 2` or `tried_it == false`, the algorithm flags the task for extended practice and reduces the interval.
- **Multi-day extension**: if a task is flagged as struggling, the current active task can be extended by 1–2 additional days before the next task unlocks.
- **Review cap**: maximum 1 reinforcement review per day (alongside the active task) to avoid overwhelm.
- **Decay boost**: if a user misses multiple days, the algorithm shortens intervals for recent tasks to re-establish momentum.

### Tunable parameters (admin-configurable)
- `base_interval_days`: starting interval for first review (default: 1)
- `ease_floor`: minimum ease factor (default: 1.3)
- `struggle_threshold`: rating at or below which triggers extended practice (default: 2)
- `max_reviews_per_day`: cap on reinforcement reviews (default: 1)
- `decay_multiplier`: how aggressively to shorten intervals after inactivity (default: 0.5)

## Notification engine

### Scheduling logic
1. Each day, a background job runs per user (based on their timezone).
2. The job selects ONE channel for the day (rotating: push → email → push → email...).
3. The job selects a template from the pool for that channel, weighted by:
    - `tone_tag` diversity (avoid repeating the same tone two days in a row)
    - Templates not recently used for this user
4. Template variables are interpolated with the user's current state.
5. The notification is dispatched and logged.

### Quiet hours
- Notifications are only sent within the user's configured window (default: 8am–9pm in their timezone).
- If the scheduled time falls outside the window, it shifts to the next valid time.

## Offline strategy

### What works offline (mobile)
- Viewing the current active task (cached locally)
- Viewing completed tasks and check-in history (cached)
- Submitting a check-in (queued, synced when online)
- Viewing the progress map

### What requires connectivity
- Unlocking the next task (server validates progression)
- Community threads (real-time data)
- Payment verification
- Notification preferences
- Widget data refresh

### Sync approach
- Mobile apps cache the current task, progress state, and recent check-ins locally.
- Check-ins submitted offline are queued in a local store and synced on reconnect.
- Conflict resolution: server state wins for progression; local check-in data merges (append-only).

## Widget architecture

### Data flow
1. Backend exposes a lightweight endpoint: `GET /widget/state` → `{ day: 12, total: 30, streak: 5, task_title: "Urge Surfing" }`
2. Mobile app fetches this on each task unlock and caches it in shared app group storage (iOS) / SharedPreferences (Android).
3. The widget reads from shared storage — never calls the network directly.
4. Widget refreshes via iOS `WidgetKit` timeline / Android `WorkManager` periodic sync.

### Display
- Progress ring or bar (day / 30)
- Streak count
- Truncated task title
- Tap → deep link to current task screen

## Payment flow

### Purchase
1. User hits the paywall at task 16.
2. App initiates in-app purchase via StoreKit (iOS) / Google Play Billing (Android).
3. On successful purchase, the app sends the receipt to `POST /payment/verify`.
4. Backend validates the receipt with Apple/Google servers.
5. Backend updates `user.payment_status = paid` and returns confirmation.
6. App unlocks tasks 16–30.

### Entitlement checking
- On app launch and task navigation, check `user.payment_status` from cached user profile.
- Periodic server-side re-validation of receipts (handles refunds/chargebacks).

## Security considerations

- JWT-based auth with refresh tokens.
- Rate limiting on auth endpoints (prevent brute force).
- Community posts sanitized for XSS.
- Admin CMS behind role-based access control.
- Payment receipts validated server-side (never trust the client).
- User data encrypted at rest.
- GDPR-ready: user data export and deletion endpoints.

## Future extensibility (keep in mind, don't build yet)

- **Work hub desktop mode**: tasks breakdown, break reminders, white noise, focus timer.
- **Native mindful gateway**: app-intercept overlays for Android (Accessibility Service) and iOS (Screen Time API).
- **SMS notifications**: additional channel in the notification engine.
- **Multiple journeys**: anxiety, motivation, etc. — the task/progress model should support a `journey_id` foreign key even if V1 only has one journey.
- **AI-powered insights**: analyze check-in patterns to provide personalized recommendations.
