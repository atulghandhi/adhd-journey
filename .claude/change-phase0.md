# Phase 0 — Bug Fixes

Priority: **Immediate** (broken UI in production screenshots)

---

## 0.1 Fix broken community reaction emoji rendering

### Problem
On the Community screen, reaction buttons (👎 👍 🔥 ❤️ 😮) render as green rectangles with `?` icons instead of emoji. The emoji characters are passed as `children` to `PrimaryButton`, which renders them inside a `<Text className="text-base font-semibold text-white">` inside an `AnimatedPressable`.

### Root cause
The `PrimaryButton` component at `apps/mobile/src/components/ui/PrimaryButton.tsx` renders children as white text on a green background. Emoji glyphs on iOS can fail to render when:
1. The font weight (`font-semibold` / 600) forces a system font that doesn't include emoji variants
2. The `text-white` color override strips native emoji color rendering on some iOS versions

### Files to modify
- `apps/mobile/src/screens/community/CommunityScreen.tsx` — lines 142-164 (reaction button rendering)

### Implementation
Replace the reaction `PrimaryButton` instances with a custom reaction pill component. Do NOT modify `PrimaryButton` itself (it's used everywhere and should stay as-is for text labels).

Create a new component `apps/mobile/src/components/ReactionPill.tsx`:

```tsx
// Signature:
interface ReactionPillProps {
  active: boolean;    // whether user has reacted with this emoji
  count: number;      // reaction count (0 = show emoji only, >0 = show emoji + count)
  emoji: string;      // the emoji character
  onPress: () => void;
}
```

Rendering rules:
- Use `AnimatedPressable` for the press animation (same as PrimaryButton)
- Layout: horizontal row, `items-center gap-1.5`
- The emoji MUST be rendered in a separate `<Text>` with `style={{ fontSize: 18 }}` and NO `text-white` or `font-semibold` class — this preserves native emoji color rendering
- The count (if > 0) is rendered in a second `<Text>` with `text-sm font-medium`
- Background: `active ? "bg-focuslab-primary" : "bg-focuslab-border dark:bg-dark-border"`
- Text color for count: `active ? "text-white" : "text-focuslab-primaryDark dark:text-dark-text-primary"`
- Padding: `px-3 py-2`, border-radius: `rounded-full`
- Min height: `min-h-[36px]` (smaller than PrimaryButton's `min-h-12` since these are inline)

Then update `CommunityScreen.tsx` lines 142-164: replace the `<PrimaryButton>` for each reaction with `<ReactionPill>`.

### How to verify
- Run `npx expo start` and navigate to Community tab
- Post something, then check that the reaction row shows actual emoji (👎 👍 🔥 ❤️ 😮) with proper colors
- Tap a reaction — it should toggle between active/inactive states
- Verify dark mode rendering too

---

## 0.2 De-emphasize the "Report" button

### Problem
In `CommunityScreen.tsx` lines 191-225, `Reply` and `Report` are both rendered as identical `PrimaryButton` components (full green, same size). Report should be visually secondary — it's a destructive/moderation action, not a primary flow.

### Files to modify
- `apps/mobile/src/screens/community/CommunityScreen.tsx` — lines 211-224

### Implementation
Replace the Report `PrimaryButton` with a ghost-style text button:

```tsx
<Pressable
  className="items-center justify-center rounded-2xl px-4 py-3"
  onPress={...existing onPress logic...}
>
  <Text className="text-sm font-medium text-gray-400 dark:text-gray-500">
    Report
  </Text>
</Pressable>
```

Import `Pressable` from `../../components/primitives` (already imported in the file's existing import block at line 8-13 — check if `Pressable` is included, add if not).

Do NOT change the `Reply` button — it stays as `PrimaryButton`.

### Design rationale (from design.md)
- `design.md` line 170: "Ghost: transparent background, green-700 text, no border. For 'Maybe later', 'Skip', etc."
- However, for Report we use `gray-400` instead of `green-700` to further reduce prominence since it's a moderation action, not a user flow action. This is intentional — it should be findable but not eye-catching.

### How to verify
- Community screen: Reply button should be the dominant green CTA
- Report should appear as muted gray text, tappable but not competing for attention
- Both should still function correctly (Reply creates reply, Report triggers report mutation)

---

## 0.3 Fix community username display

### Problem (cosmetic)
The username "BOB" renders in all-caps with wide letter spacing (`text-sm font-semibold uppercase tracking-[2px]`) at line 135-136. This matches the section label style (e.g., "COMMUNITY", "JOURNEY") rather than a human name.

### Files to modify
- `apps/mobile/src/screens/community/CommunityScreen.tsx` — line 135

### Implementation
Change the username Text className from:
```
text-sm font-semibold uppercase tracking-[2px] text-focuslab-secondary dark:text-dark-text-secondary
```
to:
```
text-sm font-semibold text-focuslab-secondary dark:text-dark-text-secondary
```

Remove `uppercase` and `tracking-[2px]`. The username should render in its natural case (e.g., "Bob" not "BOB").

### How to verify
- Community posts should show usernames in normal case, not ALL-CAPS
