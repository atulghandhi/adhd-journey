# FocusLab Brand Guidelines

## Design Thesis

FocusLab should feel like a calm, confident coach in your pocket. It is warm but structured, energetic but never overwhelming. Surfaces are clean and breathable, while micro-animations add just enough life to reward interaction without overstimulating an ADHD brain. The app must feel like it was built *for* you — not like another generic wellness app.

## Personality

- Core adjectives: focused, warm, energetic, trustworthy, playful-but-not-childish
- Non-goals: clinical/medical aesthetic, passive quote apps, gamification overload, corporate wellness
- Emotional arc: curiosity on open → confidence during task → satisfaction on check-in → anticipation for tomorrow

## Visual System

### Color

- Primary palette: deep navy/charcoal base with warm accent tones
- Accent palette: a vibrant but not harsh primary accent (coral, warm orange, or electric teal — TBD with prototyping) for CTAs, progress, and active states
- Success states: warm green for completions and streaks
- Warning/attention: amber for reminders and nudges
- Surface palette: off-white and warm gray surfaces with generous whitespace
- Dark mode: required — many ADHD users work late; dark surfaces with the same accent palette
- Gradients: subtle directional gradients for progress elements and the journey map; never on text or buttons

### Typography

- Display font: a geometric sans-serif with personality (e.g., Satoshi, General Sans, or Plus Jakarta Sans)
- Body font: highly readable sans-serif (e.g., Inter, DM Sans)
- Task titles: large, bold, immediately scannable — the most prominent element on every screen
- Body text: comfortable line height (1.5+), short paragraphs, generous spacing
- Scale notes: use size and weight to create clear visual hierarchy; ADHD users scan, they don't read walls of text

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

- Timing: 200–350ms for standard transitions; spring physics preferred over linear/ease
- Easing: spring-based for entrances and interactive elements; ease-out for exits
- Signature motions:
    - Task card entrance: subtle rise + scale from 0.97 → 1.0 with spring
    - Check-in completion: satisfying scale-pop + confetti burst (small, 400ms)
    - Progress bar fill: animated with slight overshoot
    - Day unlock: the locked card "breathes" briefly before opening
- Haptics: light haptic tap on check-in submit, medium on task unlock, success haptic on day completion
- Reduced motion: all animations respect OS reduced-motion preference; fall back to simple opacity fades

## Signature Elements

- Journey progress: the primary visual anchor — always visible, always current. A progress ring, bar, or mini-map that makes 30 days feel achievable, not daunting.
- Task card: the hero element. Large title, clear action, inviting but not intimidating.
- Streak flame/badge: a small but visible streak indicator that rewards consistency without shame on breaks.
- Locked tasks: visible but clearly gated — teasing enough to create anticipation, not frustrating enough to create anxiety.

## Component Guidance

- Buttons: primary actions use the accent color with rounded corners; secondary actions are outlined or ghost. Avoid more than one primary CTA per screen.
- Inputs: large tap targets (min 48px height), clear focus states, placeholder text that guides rather than generic "Enter text..."
- Cards: rounded corners (12–16px), soft shadow, generous internal padding
- Navigation: bottom tab bar with 4–5 items max. Active state uses accent color + filled icon; inactive uses muted tone + outlined icon.
- Toasts/feedback: slide in from top or bottom with spring animation, auto-dismiss after 3s, never block interaction
- Check-in controls: emoji/rating selectors should be large, tappable, and feel satisfying to interact with (scale animation on tap)

## ADHD-Specific UX Rules

- One action per screen: never present multiple competing CTAs
- Task first, explanation second: the user should know what to DO before they know WHY
- Progressive disclosure: explanation and deeper reading are below the fold, expandable, never forced
- No dead ends: every screen has a clear next action or way back
- Visual progress everywhere: the user should always know where they are in the journey
- Forgiveness over punishment: missed days show encouragement ("Welcome back!"), never shame or guilt
- Novelty in consistency: same structure every day, but micro-variations in copy, colors, or animations to keep it fresh

## Accessibility

- Contrast targets: WCAG AA minimum (4.5:1 for body text, 3:1 for large text and UI elements)
- Touch targets: minimum 44x44pt (iOS) / 48x48dp (Android)
- Screen reader: all interactive elements labeled, task content structured with proper headings
- Motion: respect `prefers-reduced-motion` and provide toggle in settings
- Color: never convey meaning through color alone; pair with icons or text labels

## Do and Don't

- Do: keep the accent palette to 1–2 colors and reuse tokens religiously
- Do: make completions feel celebratory (small animation + haptic)
- Do: use whitespace aggressively — ADHD brains need visual breathing room
- Do: show progress at every opportunity
- Don't: use red for anything except destructive actions (never for "you missed a day")
- Don't: auto-play videos or load heavy media on task screens
- Don't: stack multiple modals or overlays
- Don't: use tiny text or dense layouts anywhere in the core journey flow
