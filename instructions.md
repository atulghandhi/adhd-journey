# FocusLab Instructions

This file explains:

- how to set up the project locally
- how to test the app on every platform this repo targets
- how to create and use an admin account
- how to use the app as a normal user
- how to deploy the backend, web app, iOS app, and Android app

## 1. What this repo ships

- Mobile app: iOS and Android via Expo / React Native (NativeWind for styling, Reanimated for animations)
- Web app: Next.js dashboard and admin CMS
- Backend: Supabase Postgres, Auth, Storage, and Edge Functions (Deno)
- Shared package: `@focuslab/shared` — constants, journey progression, spaced repetition, timezone helpers, quiz scoring, and TypeScript types shared between mobile and web

Edge Functions duplicate core domain logic in `supabase/functions/_shared/domain.ts` because Deno cannot import from the npm workspace. The shared package has equivalence tests to verify the two stay in sync.

## 2. Prerequisites

Install these first:

- Node.js 20+
- npm 11+
- Docker Desktop
- Supabase CLI
- Xcode and iOS Simulator for iOS testing
- Android Studio and an Android emulator for Android testing
- An Expo / EAS account for mobile release builds
- Apple Developer access for App Store / TestFlight releases
- Google Play Console access for Android releases

## 3. First-time local setup

1. Install dependencies.

```bash
npm install
```

2. Copy the environment template.

```bash
cp .env.example .env.local
```

3. Start the local Supabase stack.

```bash
supabase start
```

4. Copy the local Supabase URL and keys printed by `supabase start` into `.env.local`.

At minimum, fill these:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

5. Reset the database so migrations and seed data are applied.

```bash
supabase db reset
```

6. Regenerate database types if the schema changed.

```bash
npm run db:types
```

7. Start the apps.

For everything:

```bash
npm run dev
```

Or run each surface separately:

```bash
npm run dev --workspace @focuslab/web
npm run start --workspace @focuslab/mobile
```

8. Sync Expo mobile env vars into the mobile workspace before testing on a physical device or simulator.

```bash
npm run mobile:env:sync
```

This writes `apps/mobile/.env.local` from your repo root `.env.local` so Expo sees the same Supabase project.

## 4. Set up an admin account

### Local admin setup

1. Start Supabase and the web app.
2. Sign up a normal user in either:
   - mobile app, or
   - web app at `http://127.0.0.1:3000/auth/register`
3. Confirm the email from local Inbucket at `http://127.0.0.1:54324`.
4. Promote that user with the admin script:

```bash
npm run make-admin -- you@example.com
```

5. Sign in on the web app.
6. Open `http://127.0.0.1:3000/admin`.

### Production admin setup

1. Make sure these env vars point at production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Make sure the user has already signed up once.
3. Run:

```bash
npm run make-admin -- you@example.com
```

4. Have that user sign in to the web app and open `/admin`.

## 5. What an admin can do

Admins use the web CMS at `/admin`.

- `Tasks`: create tasks, reorder them, delete them, and open the full editor
- `Task editor`: change title, tags, order, difficulty rating (1–5), default duration (days), active flag, task body (markdown), explanation (markdown), deeper reading (markdown), delete a task, and live-preview the mobile card
- `Templates`: create, edit, activate/deactivate, and delete push/email notification templates
- `SR Config`: tune spaced-repetition parameters
- `Rewards`: manage the resource links shown in the completion/resources flow
- `Moderation`: review reported posts, hide/unhide them, or delete them
- `Analytics`: review tracked users, completion rate, drop-off by task, notification open rate, popular threads, and moderation counts

This CMS does not currently manage users, auth settings, or payment refunds directly.

## 6. How to test locally

### Shared backend smoke test

Run these before testing any client:

```bash
supabase start
supabase db reset
```

Useful local tools:

- Supabase Studio: `http://127.0.0.1:54323`
- Inbucket email inbox: `http://127.0.0.1:54324`
- Web app: `http://127.0.0.1:3000`

Quick local Edge Function smoke test:

```bash
npm run test:delete-account
```

That script creates a disposable local user, inserts owned rows, calls `delete-account`, and verifies the auth user, profile, progress, and community post rows are gone.

Known local limitation:

- `supabase start` or `supabase functions serve` may fail with a TLS certificate error (`UnknownIssuer`) if you are behind a corporate proxy that intercepts `deno.land` or `jsr.io` traffic. This is a container trust-store issue, not a FocusLab code bug.

Corporate proxy workaround for Edge Functions:

1. Create a local scratch directory. It is ignored by git.

```bash
mkdir -p supabase/.local
```

2. Export the proxy CA chain into a local PEM file.

For Netskope / Goskope on macOS:

```bash
security find-certificate -a -p -c "caadmin.netskope.com" -c "ca.ctm.eu.goskope.com" /Library/Keychains/System.keychain ~/Library/Keychains/login.keychain-db > supabase/.local/proxy-ca.pem
```

If your company uses a different proxy, export that root or intermediate CA chain instead.

3. Build a local Edge Runtime image override using the CA bundle.

```bash
npm run supabase:edge-runtime:trust -- supabase/.local/proxy-ca.pem public.ecr.aws/supabase/edge-runtime:v1.71.0
```

If `supabase start` is using a different Edge Runtime tag, pass that tag as the second argument instead.

4. Restart Supabase.

```bash
supabase stop
supabase start
```

5. Remove the exported certificate file if you no longer need it.

```bash
rm -f supabase/.local/proxy-ca.pem
```

The Docker image override stays only on your machine. If the Edge Runtime tag changes later, rerun the helper script for the new tag.

### Web testing

1. Start the web app:

```bash
npm run dev --workspace @focuslab/web
```

2. Open:
   - `http://127.0.0.1:3000/auth/register`
   - `http://127.0.0.1:3000/auth/login`
   - `http://127.0.0.1:3000/dashboard`

3. Create a normal user and confirm email in Inbucket.
4. Sign in and verify:
   - dashboard loads
   - journey snapshot appears
   - recent check-ins render after mobile usage
5. If you need admin coverage, promote that user and verify:
   - `/admin/tasks`
   - `/admin/templates`
   - `/admin/settings`
   - `/admin/rewards`
   - `/admin/moderation`
   - `/admin/analytics`

### iOS testing

1. Start the backend:

```bash
supabase start
supabase db reset
```

2. Start the iOS app:

```bash
npm run ios --workspace @focuslab/mobile
```

3. If the simulator does not auto-open, start the Expo dev server and launch it from there:

```bash
npm run start --workspace @focuslab/mobile
```

4. In the app, test this flow:
   - register a new user
   - confirm the email from Inbucket
   - log in
   - complete onboarding (welcome → name → motivating question)
   - open Day 1
   - submit a quick check-in (emoji rating, tried-it toggle, optional reflection)
   - verify the check-in pop animation fires on success
   - open Community, Progress, and Account tabs
   - change theme preference (light / dark / system) and verify dark mode applies immediately
   - change notification quiet hours
   - restart the journey
   - toggle device reduced-motion in iOS Settings → Accessibility → Motion and verify animations fall back to simple fades and haptics are suppressed
   - turn off network and submit a check-in — it should queue offline and sync when reconnected

5. If RevenueCat is not configured, test the paywall with the dev bypass button.

6. If you need real native-module validation for notifications or purchases, create a development build rather than relying only on the local dev server.

### Physical iPhone on a personal Mac

Expo Go is not the right path for this repo. Use a development build.

1. On the Mac you will use for the device build, install Xcode and make sure the iPhone trusts that Mac.
2. From the repo root, sync the mobile env:

```bash
npm run mobile:env:sync
```

3. Plug the iPhone into the Mac, unlock it, and enable Developer Mode if iOS asks.
4. Install the dev build:

```bash
cd apps/mobile
npx expo run:ios --device
```

5. In a second terminal, start Metro:

```bash
cd /path/to/adhd-journey
npm run start --workspace @focuslab/mobile -- --tunnel
```

6. Open the installed `FocusLab` app on the phone.

Notes:

- The phone cannot use `http://127.0.0.1:54321` to reach Supabase on your Mac. For device testing, make sure the mobile env points at a reachable remote project or tunneled backend.
- If signing fails on the personal Mac, open the generated Xcode project in `apps/mobile/ios`, select a Personal Team for the app target, and rerun `npx expo run:ios --device`.

### Android testing

1. Start an Android emulator in Android Studio.
2. Start the backend:

```bash
supabase start
supabase db reset
```

3. Launch the Android app:

```bash
npm run android --workspace @focuslab/mobile
```

4. Run the same smoke test as iOS:
   - register
   - confirm email
   - log in
   - finish onboarding
   - complete a task
   - submit check-ins
   - open Community, Progress, Account
   - test paywall behavior
   - test restart journey
   - test dark mode toggle
   - test offline check-in queueing

5. If you are testing push notifications or real purchases, use a dev build or preview build, not just the local JS server.

## 7. How to use the app as a normal user

1. Open the mobile app.
2. Create an account or sign in.
3. Confirm your email if prompted.
4. Complete onboarding:
   - welcome screen
   - enter your name
   - answer the motivating question
5. The app takes you to the current journey day.
6. Read the task and tap `I did it` when finished.
7. Submit the quick check-in:
   - emoji rating
   - whether you tried it
   - optional reflection notes
8. Return the next day for the next task.
9. Use the other tabs:
   - `Community`: post in the thread for the current task and react to others
   - `Progress`: review check-ins and journey map
   - `Account`: manage theme, quiet hours, push registration, resources, quiz, billing, and journey restart
10. At Day 16:
   - free users see the paywall
   - paid users continue
   - local dev builds can use the paywall bypass when RevenueCat is not configured
11. At the end of the 30-day journey:
   - open the completion summary
   - take the quiz
   - open reward/resources
   - continue with review cards or restart

## 8. Mobile architecture notes

- **Styling**: NativeWind (Tailwind CSS for React Native). All screens use `dark:` variant classes for dark mode.
- **Animations**: `react-native-reanimated` with five spring configs in `src/animations/springs.ts` — `SPRING_DEFAULT`, `SPRING_SNAPPY`, `SPRING_GENTLE`, `SPRING_QUICK`, `SPRING_SQUISH`. Buttons use asymmetric scaleX/scaleY squish on press for a Dynamic Island–style elastic feel.
- **Reduced motion**: `useReducedMotion` hook reads both the OS accessibility setting and a per-user profile flag. When active, all springs collapse to 150ms linear timing and all haptics are suppressed.
- **Haptics**: `useHaptics` hook wraps `expo-haptics` with five feedback types (light impact, medium impact, selection changed, success notification, error notification), all gated on reduced motion.
- **Theme**: `ThemeProvider` persists the user's last-known theme preference to AsyncStorage so returning users see the correct scheme immediately on launch, before the profile API responds.
- **Offline queue**: `offlineQueueStore` (Zustand + AsyncStorage) queues check-ins when the network is unavailable and replays them on reconnect via `OfflineQueueSync` in `AppProviders`.
- **Toasts**: `ToastProvider` shows spring-animated bottom toasts with auto-dismiss after 3 seconds. Rapid back-to-back calls correctly cancel the previous dismiss timer.
- **Mindful gateway**: Day 17 shows an extra button linking to the `MindfulGatewayTutorial` screen with platform-specific iOS Shortcuts / Android automation steps.

## 9. Deployment overview

There is no checked-in CI/CD pipeline in this repo. The steps below are the manual release path.

Deploy in this order:

1. production Supabase project
2. web app
3. iOS app
4. Android app

## 10. Deploy the backend (Supabase)

1. Create or choose the production Supabase project.
2. Log in and link the local repo:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

3. Set production secrets in Supabase for anything the functions need:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FCM_SERVER_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `REVENUECAT_SECRET_KEY`

4. Push the database schema:

```bash
supabase db push
```

5. Deploy all Edge Functions:

```bash
supabase functions deploy get-journey-state
supabase functions deploy complete-check-in
supabase functions deploy daily-notifications
supabase functions deploy daily-reviews
supabase functions deploy verify-payment
supabase functions deploy admin-analytics
supabase functions deploy health
```

6. Verify that production env vars used by mobile and web match this Supabase project.
7. Create the first production admin with `npm run make-admin -- you@example.com`.

## 11. Deploy the web app

The web app is a standard Next.js server app.

1. Set production env vars for the web runtime:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Install dependencies on the host:

```bash
npm install
```

3. Build the web app:

```bash
npm run build --workspace @focuslab/web
```

4. Start the web app:

```bash
npm run start --workspace @focuslab/web
```

5. Put the app behind HTTPS on your chosen host.
6. Verify these routes after deploy:
   - `/auth/login`
   - `/auth/register`
   - `/dashboard`
   - `/admin` with an admin account

## 12. Deploy iOS

The mobile app is configured for EAS Build. The iOS bundle identifier is `app.focuslab.mobile`.

1. Log in to EAS:

```bash
npx eas login
```

2. Make sure the Apple app exists in App Store Connect with bundle identifier `app.focuslab.mobile`.
3. Make sure production mobile env vars are available during the build:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY` if using live purchases

4. Create a development build when you need full native testing:

```bash
npx eas build --platform ios --profile development
```

5. Create an internal preview build when you need QA distribution:

```bash
npx eas build --platform ios --profile preview
```

6. Create the production build:

```bash
npx eas build --platform ios --profile production
```

7. Submit the production build:

```bash
npx eas submit --platform ios
```

8. Validate in TestFlight before App Store release:
   - login
   - onboarding
   - task/check-in flow
   - paywall flow
   - completion/resources
   - theme/account settings

## 13. Deploy Android

The Android package name is `app.focuslab.mobile`.

1. Log in to EAS:

```bash
npx eas login
```

2. Make sure the Android app exists in Google Play Console with package name `app.focuslab.mobile`.
3. Make sure production mobile env vars are available during the build:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_REVENUECAT_PUBLIC_SDK_KEY` if using live purchases

4. Create a development build when you need full native testing:

```bash
npx eas build --platform android --profile development
```

5. Create a preview build for internal distribution:

```bash
npx eas build --platform android --profile preview
```

6. Create the production build:

```bash
npx eas build --platform android --profile production
```

7. Submit the production build:

```bash
npx eas submit --platform android
```

8. Validate the build in an internal test track before wider rollout:
   - auth
   - onboarding
   - task/check-ins
   - community
   - account settings
   - paywall behavior
   - completion/resources

## 14. Recommended release checklist

Run these before each release:

```bash
npx turbo lint
npx turbo typecheck
npx turbo test
supabase db reset
```

Test suites cover:

- `packages/shared`: spaced repetition algorithm, journey progression, notifications, quiz scoring, and EF domain.ts equivalence (68+ tests via Vitest)
- `apps/mobile`: spring configs, emoji rating options, auth routing, button config (13 tests via Jest)
- `apps/web`: auth routing, home page render (3 tests via Vitest)

After deploy, verify:

- a new user can register and confirm email
- a normal user can complete onboarding
- a check-in persists and the success animation / haptic fires
- dark mode works on auth screens and toggles correctly in Account
- the admin can access `/admin`
- the paywall still behaves correctly with or without live RevenueCat credentials
- offline check-in queueing works when network is unavailable
