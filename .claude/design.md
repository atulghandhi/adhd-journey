# FocusLab Brand Guidelines

## Design Thesis

FocusLab should feel like a calm, confident coach in your pocket. It is warm but structured, energetic but never overwhelming. Surfaces are clean and breathable, while micro-animations add just enough life to reward interaction without overstimulating an ADHD brain. The app must feel like it was built *for* you — not like another generic wellness app.

## Personality

- Core adjectives: focused, warm, energetic, trustworthy, playful-but-not-childish
- Non-goals: clinical/medical aesthetic, passive quote apps, gamification overload, corporate wellness
- Emotional arc: curiosity on open → confidence during task → satisfaction on check-in → anticipation for tomorrow

## Visual System

### Color

Green-themed wellness palette. Light, pale, and calming — evoking health, growth, and improvement.

#### Light mode (default)
| Token | Hex | Usage |
|---|---|---|
| `green-900` | `#1B4332` | Primary text, headings |
| `green-700` | `#2D6A4F` | Secondary text, labels |
| `green-500` | `#40916C` | Primary accent — CTAs, active states, progress fills, links |
| `green-400` | `#52B788` | Hover/pressed states, secondary buttons |
| `green-200` | `#B7E4C7` | Borders, dividers, inactive tab icons |
| `green-100` | `#D8F3DC` | Card backgrounds, input backgrounds, tag fills |
| `green-50` | `#F0FFF4` | Page/screen background |
| `white` | `#FFFFFF` | Card surfaces, modals, bottom sheet |
| `success` | `#22C55E` | Check-in completion, streak badge, positive feedback |
| `warning` | `#F59E0B` | Amber — reminders, nudges, attention states |
| `error` | `#EF4444` | Destructive actions only (delete, report). Never for missed days. |
| `text-primary` | `#1B4332` | Main body text (maps to green-900) |
| `text-secondary` | `#4B5563` | Muted text, timestamps, captions |
| `text-placeholder` | `#9CA3AF` | Input placeholders |

#### Dark mode
| Token | Hex | Usage |
|---|---|---|
| `dark-bg` | `#0F1A14` | Page/screen background |
| `dark-surface` | `#1A2E23` | Card backgrounds, bottom sheet |
| `dark-surface-raised` | `#243D2F` | Modals, elevated cards |
| `dark-border` | `#2D6A4F` | Borders, dividers |
| `dark-text-primary` | `#E8F5E9` | Main body text |
| `dark-text-secondary` | `#A5D6A7` | Muted text |
| Accent colors (`green-500`, `success`, `warning`, `error`) | Same as light mode | CTAs and feedback stay consistent across modes |

#### Rules
- Dark mode: **manual toggle in Settings** with 3 options: Light / Dark / System. Default: **Light**. Store preference in `profiles` table (add `theme_preference` column, default `'light'`).
- Gradients: subtle top-to-bottom gradient (`green-50` → `white`) on journey screen background. Never on text or buttons.
- Never use red/error color for missed days or inactivity. Only for destructive actions (delete account, report post).

### Typography

Single font family: **Montserrat** (`"Montserrat", sans-serif`). Load via `expo-google-fonts` on mobile, `next/font/google` on web.

| Element | Weight | Size (mobile) | Size (web) | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|---|
| Display / hero | 700 (Bold) | 28px | 36px | 1.2 | -0.02em | Day number, completion screen headline |
| Screen title | 700 (Bold) | 24px | 30px | 1.25 | -0.01em | Screen headers ("Day 6 — The Dopamine Lemon") |
| Task title (card) | 600 (SemiBold) | 20px | 24px | 1.3 | 0 | Task card title in journey list |
| Section heading | 600 (SemiBold) | 18px | 20px | 1.3 | 0 | "Explanation", "Deeper Reading", "Community" |
| Body text | 400 (Regular) | 16px | 16px | 1.6 | 0.01em | Task body, explanations, community posts |
| Body emphasis | 500 (Medium) | 16px | 16px | 1.6 | 0.01em | Bold words within body text, key phrases |
| Caption / meta | 400 (Regular) | 13px | 13px | 1.4 | 0.02em | Timestamps, "Sarah — Day 12", streak label |
| Button text | 600 (SemiBold) | 16px | 16px | 1.0 | 0.02em | All button labels |
| Tab label | 500 (Medium) | 11px | — | 1.0 | 0.03em | Bottom tab bar labels |
| Input text | 400 (Regular) | 16px | 16px | 1.5 | 0 | Text input values |
| Placeholder | 400 (Regular) | 16px | 16px | 1.5 | 0 | Input placeholders (use `text-placeholder` color) |

#### Rules
- ADHD users scan, they don't read. Max 3 short lines before a visual break (card edge, divider, or heading).
- Task body (the action): max 2-3 sentences. If longer, break into bullet points.
- Explanation body: short paragraphs (2-3 sentences each) separated by spacing.
- Never render a wall of text. Use markdown headings and lists.

### Layout

- Grid: 8px rhythm base
- Task-first rule: on every task screen, the actionable task is above the fold with zero scrolling required
- Breathing room: panels and sections use generous padding; density is the enemy of ADHD UX
- Card-based: content sections (task, explanation, community) are distinct cards with clear visual separation
- Bottom navigation: thumb-friendly, max 4–5 tabs

### Depth and Materials

- Shadows: soft, warm shadows for cards and floating elements (not harsh drop shadows)
- Borders: minimal — prefer shadow/elevation over border-heavy design
- Surfaces: layered cards on a subtle background; avoid flat designs that make sections blend together

### Motion

All animations use `react-native-reanimated` with spring physics. No `Animated.timing` with linear/ease-in/ease-out — springs only.

#### Spring configs (`withSpring` parameters)
| Config name | damping | stiffness | mass | Use case | Perceived feel |
|---|---|---|---|---|---|
| `default` | 15 | 150 | 1 | Task card entrance, general transitions | Apple Dynamic Island-style: 3-5% overshoot, one gentle oscillation, ~300-400ms |
| `snappy` | 12 | 200 | 1 | Check-in pop, button press feedback, reactions | Quick and celebratory, noticeable bounce |
| `gentle` | 20 | 80 | 1 | Day unlock "breathe", progress ring fill | Slow and dramatic, smooth settle |
| `quick` | 20 | 300 | 1 | Toast entrance, tab switch | Near-instant, minimal overshoot |

#### Signature motions
- **Task card entrance**: translate Y from +20px to 0 + scale from 0.97 → 1.0, using `default` spring. Stagger 50ms between cards in journey list.
- **Check-in completion pop**: scale from 1.0 → 1.15 → 1.0 using `snappy` spring + localized confetti burst (see below) + success haptic.
- **Confetti burst**: Use `react-native-confetti-cannon` or custom Skia/reanimated particle effect. 15-20 small colored circles (`green-500` + `success` + `green-200`) burst upward from the check-in button, arc outward, and fade over 400ms. NOT full-screen confetti — localized burst around the button only.
- **Progress ring/bar fill**: animated arc fill using `gentle` spring. Slight overshoot past target value, then settle back.
- **Day unlock**: locked card scales from 1.0 → 1.03 → 1.0 using `gentle` spring (the "breathe"), then fades lock icon out (200ms opacity) and transitions to active state.
- **Emoji rating tap**: selected emoji scales 1.0 → 1.3 → 1.0 using `snappy` spring. Unselected emojis scale down slightly (0.9) with `quick` spring.
- **Toast entrance**: slide up from bottom (translate Y from +100 to 0) using `quick` spring. Auto-dismiss after 3s with opacity fade (200ms).

#### Haptics (`expo-haptics`)
| Interaction | Haptic type | `expo-haptics` call |
|---|---|---|
| Check-in submit | Light | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Task unlock | Medium | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Day completion | Success | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Emoji rating tap | Light | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Error / validation fail | Error | `Haptics.notificationAsync(NotificationFeedbackType.Error)` |

#### Reduced motion
- All animations respect OS `prefers-reduced-motion` (AccessibilityInfo on RN). Also provide a manual toggle in Settings.
- When reduced motion is on: replace all springs with simple 150ms opacity fades. Disable confetti. Keep haptics (they're separate from visual motion).

## Signature Elements

### Journey progress (in-app)
Vertical scrollable list with 30 nodes (circles) connected by a line — a visual "path" that makes the journey feel like a story, not a checklist.
- **Completed node**: filled circle in `green-500`, checkmark icon inside, connected by solid `green-400` line.
- **Active node**: pulsing circle in `green-500` (gentle scale pulse 1.0 → 1.1 → 1.0 on `gentle` spring, looping). Larger than other nodes (28px vs 20px). Connected by solid line above, dashed line below.
- **Locked node**: hollow circle with `green-200` border, small lock icon in `text-secondary` color. Connected by dashed `green-200` line.
- The active node is always auto-scrolled into view on screen load.
- Day number labels appear to the left of each node. Task title appears to the right.

### Journey progress (widget)
Progress ring (arc) showing day/30 as fill percentage. Ring stroke in `green-500`, background stroke in `green-200`. Center text: "Day 12" in bold. Below ring: truncated task title. Tap → deep link to current task.

### Task card
The hero element. White card on `green-50` background. Rounded corners (16px). Soft shadow (`0 2px 8px rgba(27,67,50,0.08)`). Large task title (`screen title` weight), task body below. Inviting but not intimidating.

### Streak badge
Small pill-shaped badge showing 🔥 + streak count (e.g., "🔥 7"). Displayed in the journey screen header, next to the day number. Uses `success` background with white text. When streak is 0 or user returns after absence: badge is hidden (not shown as "0" — no shame).

### Locked tasks
Visible in the journey list but clearly gated: muted colors (`green-200` text, `green-100` background), lock icon, cannot be tapped. Title is visible (teasing anticipation), but task body is hidden (no spoilers).

## Component Guidance

### Buttons
- **Primary**: `green-500` background, `white` text, rounded corners (12px), full-width on mobile. One per screen max.
- **Secondary**: transparent background, `green-500` text, `green-200` border, rounded corners (12px).
- **Ghost**: transparent background, `green-700` text, no border. For "Maybe later", "Skip", etc.
- **Destructive**: `error` background, `white` text. Only for delete/report actions.
- All buttons: min height 48px, `button text` typography, `snappy` spring scale animation on press (0.97 → 1.0).

### Inputs
- Min height 48px, `green-100` background, `green-200` border, rounded corners (12px).
- Focus state: `green-500` border (2px), subtle `green-100` glow.
- Placeholder text uses `text-placeholder` color and should guide (e.g., "Write a book, learn guitar, finish my project..." not "Enter text").

### Cards
- Rounded corners (16px), `white` background, soft shadow (`0 2px 8px rgba(27,67,50,0.08)`), 16px internal padding.
- In dark mode: `dark-surface` background, shadow replaced by `dark-border` 1px border.

### Navigation
Bottom tab bar with 4 tabs. Use icons from `lucide-react-native` (or `@expo/vector-icons` Feather set):

| Tab | Icon (active) | Icon (inactive) | Label |
|---|---|---|---|
| Journey | `compass` (filled) | `compass` (outline) | Journey |
| Community | `message-circle` (filled) | `message-circle` (outline) | Community |
| Progress | `bar-chart-2` (filled) | `bar-chart-2` (outline) | Progress |
| Account | `user` (filled) | `user` (outline) | Account |

- Active tab: `green-500` icon + label. Inactive tab: `green-200` icon, `text-secondary` label.
- Tab bar background: `white` (light) / `dark-surface` (dark) with top border in `green-100` / `dark-border`.

### Toasts
- Slide in from bottom, 60px above the tab bar, using `quick` spring.
- Rounded corners (12px), `green-900` background, `white` text. For errors: `error` background.
- Auto-dismiss after 3s with 200ms opacity fade. Never block interaction.

### Check-in controls
5 emoji faces in a horizontal row: 😫 😕 😐 🙂 🤩 (mapped to values 1–5 internally).
- Each emoji is 44x44px tap target.
- Selected emoji: scales 1.0 → 1.3 → 1.0 using `snappy` spring, `green-100` circular background highlight.
- Unselected emojis: scale down to 0.85 with `quick` spring, slightly muted opacity (0.5).
- "Did you try it?" toggle: pill-shaped toggle, `green-500` when on, `green-200` when off.

### Community reactions
Fixed emoji set displayed as a horizontal row below each post:
👎 👍 🔥 ❤️ 😮
- Tap to toggle. Active reaction: `green-100` background pill with count. Inactive: transparent.
- Own reaction highlighted with `green-500` border.

### Loading skeletons
Gray rounded rectangles matching content layout, with a left-to-right shimmer gradient animation (`green-100` → `green-50` → `green-100`). Use `moti/skeleton` or a custom reanimated shimmer.

### Empty states
Centered illustration area (simple SVG or emoji) + short message + optional CTA button.
- Community: "No posts yet — be the first to share your experience!" + "Write a post" button.
- Check-in history: "Complete your first check-in to see your journey here."
- Progress: "Start Day 1 to begin tracking your progress."

## ADHD-Specific UX Rules

- **One action per screen**: never present multiple competing CTAs.
- **Task first, explanation second**: the user should know what to DO before they know WHY.
- **Progressive disclosure**: explanation and deeper reading are below the fold, expandable, never forced.
- **No dead ends**: every screen has a clear next action or way back.
- **Visual progress everywhere**: the user should always know where they are in the journey.
- **Novelty in consistency**: same structure every day, but micro-variations in copy, colors, or animations to keep it fresh.

### Forgiveness UX — welcome back messages
When the user returns after inactivity, show a dismissible banner above the current task card on the Journey tab:

- **24–47 hours inactive**: "Welcome back! Ready to pick up where you left off?" — light `green-100` background, `green-700` text, dismiss X button.
- **48+ hours inactive**: "Hey — starting again is the hardest part, and you just did it. Let's go." — light `green-100` background, `green-700` text, dismiss X button.
- Never mention how many days were missed. Never show streak as "0". Hide the streak badge entirely if streak is broken — it reappears once the user completes a check-in.

## Accessibility

- Contrast targets: WCAG AA minimum (4.5:1 for body text, 3:1 for large text and UI elements)
- Touch targets: minimum 44x44pt (iOS) / 48x48dp (Android)
- Screen reader: all interactive elements labeled, task content structured with proper headings
- Motion: respect `prefers-reduced-motion` and provide manual toggle in Settings. When on: replace springs with 150ms opacity fades, disable confetti, keep haptics.
- Color: never convey meaning through color alone; pair with icons or text labels.

## Do and Don't

- Do: keep the accent palette to 1–2 colors and reuse tokens religiously
- Do: make completions feel celebratory (small animation + haptic)
- Do: use whitespace aggressively — ADHD brains need visual breathing room
- Do: show progress at every opportunity
- Don't: use red for anything except destructive actions (never for "you missed a day")
- Don't: auto-play videos or load heavy media on task screens
- Don't: stack multiple modals or overlays
- Don't: use tiny text or dense layouts anywhere in the core journey flow
