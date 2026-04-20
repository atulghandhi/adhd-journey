# Toolkit & Retention Strategy

## Core Insight

The 30 tasks are not a checklist to complete and forget — they are strategies to install into daily life. The app's job shifts from "guide through 30 days" to "help the user keep using 3-5 strategies that actually work for them." Behavior maintenance is fundamentally different from behavior initiation.

## Behavioral Science Foundation

### Why ADHD brains abandon strategies that worked
1. **Novelty decay** — dopamine reward drops once a strategy feels familiar
2. **Out of sight, out of mind** — ADHD impairs prospective memory; if a strategy isn't externally cued, it doesn't exist
3. **All-or-nothing thinking** — missing one day triggers shame → avoidance → abandonment
4. **Implementation intention gap** — knowing a strategy ≠ using it; when-then plans are 2-3x more effective (Gollwitzer, 1999)
5. **Transition fragility** — the moment the 30-day structure ends, there's no scaffolding

### What evidence says works for sustained change in ADHD
- **Spaced retrieval** — already in our SR algorithm; resurface strategies, not just once
- **Active recall > passive review** — testing effect (Roediger & Karpicke, 2006); ask "what was the strategy?" not "here's the card again"
- **Self-selection increases commitment** — Self-Determination Theory (Deci & Ryan); autonomy = motivation
- **Visual cue exposure** — ADHD prospective memory research (Kliegel et al.); external cues compensate for internal memory failure
- **Micro-commitment** — Cialdini's consistency principle + ADHD small-step research
- **Identity-based framing** — "I am someone who breathes before reacting" > "I should do breathing exercises" (Clear, Atomic Habits)
- **Context-dependent repetition** — habit formation takes 2-5 months with stable environmental cues
- **Reflection without judgment** — ACT/mindfulness-based ADHD approaches (Zylowska); non-judgmental noticing reduces shame spiral

---

## V1: Toolkit (CURRENTLY IMPLEMENTED)

### Concept
Each completed task can become a "keeper" — a strategy the user wants to incorporate into daily life. In the current app, the user-facing tab label is already **Toolkit**.

### Check-in flow addition
After the emoji rating and reflection prompts, before submit:
- "Want to keep this strategy in your toolkit?"
- Three options: **Keep it 🧰** / **Maybe later** / **Not for me**
- Default: no selection required (skippable — low friction)

### Toolkit tab structure
```
┌─────────────────────────┐
│ Progress bar (X/30)     │  ← compact
│ Streak badge            │
├─────────────────────────┤
│ 🧰 MY TOOLKIT (N)      │  ← retained strategies
│ ┌─────────────────┐     │
│ │ Day 1: Cycling   │◄───│── tap → full card, editable
│ │ Day 3: Morning   │    │
│ │ Day 9: Breathing  │    │
│ └─────────────────┘     │
│                         │
│ ▼ Maybe later (N)       │  ← collapsible, muted
│ ▼ Not for me (N)        │  ← collapsible, greyed
│                         │
│ ▼ Journey map           │  ← collapsible, demoted
├─────────────────────────┤
│ 📅 RECENT ACTIVITY      │
│ (compact timeline)      │
└─────────────────────────┘
```

### Key behaviors
- Tapping a toolkit card opens the full day's card (read mode + editable for interactive tasks like cycling list)
- User can move cards between Keep / Maybe / Not for me at any time
- Journey map is preserved but collapsible (emotional satisfaction, not primary navigation)
- Tasks not yet reached don't appear in any category

---

## App Disrupt as Active Resurfacing

### Concept
Instead of in-app nudges (which require the user to open the app), use the iOS Shortcuts mindful gateway as the delivery mechanism for strategy reminders.

### How it works
1. User sets up iOS Shortcuts (guided by the app, similar to "one sec" app)
2. When user opens YouTube/TikTok/Instagram/games, a shortcut fires
3. 3-5 second breathing pause overlay appears
4. During or after the pause, surface a retained toolkit strategy via SR scheduling:
   - "Remember: you cycle projects when stuck. Your list: [X, Y, Z]"
   - "Breathe 1:2 before reacting today"
   - "Your morning protection rule: no phone for 15 min"
5. Timed check-ins at 10min/30min if user continues to the app — similar pause + strategy recall

### Why this is better than in-app nudges
- **Context-dependent** — appears at the exact behavioral moment that matters
- **Zero app-opening friction** — user doesn't need to decide to open the app
- **Keeps daily task page clean** — no extra cards competing for attention
- **The intercept IS the spaced repetition** — gateway = delivery mechanism for SR-scheduled strategy reminders

### Current implementation status
- The mobile app already includes a toolkit flow and an `App Disrupt` surface in the Toolkit screen.
- The app-side breathing / gateway UI already exists.
- Native FamilyControls bridge and extension files now exist in the worktree, but Expo config wiring is still pending.
- The core retention idea remains the same: surface saved strategies at the moment of distraction instead of only inside the app.

---

## V3+: Advanced Retention Features (DEFERRED)

### Implementation Intentions
After "Keep it 🧰", optionally ask:
- **Where will this help most?** (chip selection: Morning start / When I reach for phone / During work / When overwhelmed / At bedtime / Custom)
- **What's your tiny version?** (10 seconds / 1 minute / 3 minutes / Full version)
- Auto-generate if-then plan: "If [context], then I'll [tiny version of strategy]"

### Identity Card Framing
When retaining a strategy, user writes a one-line identity version:
- Day 1 cycling → "I rotate projects before I burn out"
- Day 3 morning → "I protect my mornings"
- Day 9 breathing → "I breathe before I react"
These appear as the daily nudge/gateway text instead of the generic strategy title.

### Context Chips for Reflection
Replace free-text reflection with tappable chips first:
- Hard to start / Forgot / Got distracted / Helped a bit / Worked better than expected / Not relevant today
- Then "Add a note" as optional free-text

### Task Type Taxonomy (future)
Split 30 tasks into behavioral categories:
1. **Living tools** — editable forever (rotation list, derailment plans, best-day recipe, phone rules)
2. **Skills to practice** — need repetition (urge surfing, breathing, concentration drills)
3. **Setup tasks** — environmental changes (workspace, medication placement, bedtime phone parking)
4. **Decision/support tasks** — real-world support access (therapy, medication, appointments)

---

## 3rd Party Analysis: Key Takeaways

### Adopt now
- Keep the `Toolkit` naming consistent across mobile, docs, and any future web surface
- "Keep / Maybe later / Not for me" > binary checkbox
- Living tools should be editable from Toolkit (esp. Day 1 cycling list, Day 14 trap plans)
- Copy improvements: "Did you give it a real try?" > "Did you try it?"
- Community needs scaffolded prompts, not blank boxes

### Adopt later
- Context chips before free-text (lower friction reflection)
- Task-specific check-in labels ("Saved it" / "Practiced it" / "Set it up")
- Structured community prompts per task

### Disagree / defer
- Renaming "Journey" → "Today" — Journey is brand identity, users signed up for structure
- 20-second "Lock It In" flow at check-in — too much friction for V1
- Reorganizing all 30 tasks into 4 product types — premature optimization
- Removing journey map entirely — demote, don't kill
- Heavy emphasis on "course feel" problem — the structure IS the value prop for ADHD users

### Sequencing recommendation
1. **Now**: keep the Toolkit flow strong and easy to edit
2. **Next**: finish the native App Disrupt / FamilyControls wiring so strategy surfacing is fully automatic on iOS
3. **Later**: Implementation intentions, identity cards, context chips, task taxonomy
