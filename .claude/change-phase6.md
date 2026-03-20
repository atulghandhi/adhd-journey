# Phase 6 — Account Screen Polish

Priority: **Low** (cosmetic improvements)

Depends on: None

---

## Overview

The Account screen (screenshots 4 & 5) is functional but has a few visual issues identified in the screenshot review. These are low-priority cosmetic fixes.

---

## 6.1 Replace theme toggle buttons with a segmented control

### Problem
The three full-width `PrimaryButton`s for Light / Dark / System are visually heavy for a "set once and forget" setting. They dominate the card and use the same CTA style as high-importance actions like "I did it" or "Write a post."

### File to modify
`apps/mobile/src/screens/account/AccountScreen.tsx`

### Current implementation
Find the theme preference section in `AccountScreen.tsx`. It likely renders 3 `PrimaryButton`s vertically, each with a checkmark prefix for the selected option.

### New implementation: segmented control

Create a reusable component `apps/mobile/src/components/ui/SegmentedControl.tsx`:

```tsx
interface SegmentedControlProps<T extends string> {
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  value: T;
}
```

**Rendering:**
- Outer container: horizontal `flex-row`, `bg-focuslab-border dark:bg-dark-border`, `rounded-2xl`, `p-1`
- Each segment: `flex-1`, `items-center`, `py-2.5`, `rounded-xl`
- Selected segment: `bg-white dark:bg-dark-surface`, subtle shadow
- Selected text: `text-focuslab-primaryDark dark:text-dark-text-primary`, `font-semibold`
- Unselected text: `text-focuslab-secondary dark:text-dark-text-secondary`, `font-medium`
- Transition: use Reanimated `useAnimatedStyle` to slide a background indicator view to the selected position (translateX animation with `SPRING_QUICK`)

**Usage in AccountScreen:**
```tsx
<SegmentedControl
  onChange={handleThemeChange}
  options={[
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System", value: "system" },
  ]}
  value={themePreference}
/>
```

### Haptics
Add `selectionChanged` haptic on segment change (import `useHaptics`).

### Dark mode
- The segmented control adapts naturally: dark surface for selected, dark border for background
- In the dark mode screenshot (image 4), the card has dark green borders — the segmented control should feel at home

---

## 6.2 Verify sign-out and delete-account exist

### Check
Read `apps/mobile/src/screens/account/AccountScreen.tsx` and verify it includes:
1. A **Sign out** button — should exist somewhere in the screen
2. A **Delete account** button — required for App Store compliance

### If missing
Add them at the bottom of the Account screen, below the Notifications card:

**Sign out:**
```tsx
<AppCard>
  <PrimaryButton onPress={handleSignOut}>
    Sign out
  </PrimaryButton>
</AppCard>
```

**Delete account:**
```tsx
<View className="mt-4 items-center">
  <Pressable onPress={handleDeleteAccount}>
    <Text className="text-sm font-medium text-gray-400 dark:text-gray-500">
      Delete my account
    </Text>
  </Pressable>
</View>
```

- Delete uses ghost/muted text style (not a prominent button)
- On tap: show a confirmation alert (`Alert.alert(...)`) before proceeding
- Delete action: call `supabase.rpc('delete_user_account')` or similar. If the RPC doesn't exist, create it in a migration. At minimum, sign out and show a toast saying "Account deletion request sent" and handle it manually for now.

### App Store requirement
Apple requires a delete-account option for all apps that offer account creation. This MUST be accessible (not hidden in a sub-menu). Placing it at the bottom of the Account screen in muted text is acceptable.

---

## 6.3 Dark mode card border visibility

### Problem (from screenshot review)
In dark mode (screenshot 4), card edges are quite subtle (dark-on-dark). The `AppCard` component uses `dark:border dark:border-dark-border` which is `#2D6A4F` on a `#1A2E23` surface — only ~15% contrast.

### File to modify
`apps/mobile/src/components/ui/AppCard.tsx`

### Current (line 6):
```tsx
className="rounded-[22px] bg-white p-5 shadow-sm shadow-black/10 dark:border dark:border-dark-border dark:bg-dark-surface dark:shadow-none"
```

### Option A: Slightly lighter border
Change `dark:border-dark-border` to a custom lighter value:
```tsx
dark:border-[#3A7D5C]
```
This is halfway between `dark-border` (#2D6A4F) and `green-400` (#52B788) — more visible but still subtle.

### Option B: Add a subtle dark mode shadow instead
```tsx
dark:shadow-sm dark:shadow-black/20
```
Remove `dark:shadow-none` and add a subtle dark shadow. This may look better than a brighter border.

### Recommended: Option A
Brighter border is simpler and more predictable across devices. Change the class to:
```tsx
className="rounded-[22px] bg-white p-5 shadow-sm shadow-black/10 dark:border dark:border-[#3A7D5C] dark:bg-dark-surface dark:shadow-none"
```

### Impact
This is a global change — `AppCard` is used on every screen. Verify all screens look good in dark mode after the change:
- Journey screen
- Community screen
- Progress screen
- Account screen
- Completion screen
- Quiz screen

---

## 6.4 Notification toggle UX improvement (minor)

### Problem
The push/email buttons in the Account screen (screenshots 4-5) use `PrimaryButton` with checkmark prefix, same as the theme buttons. These are binary toggles — they'd be better as switches.

### File to modify
`apps/mobile/src/screens/account/AccountScreen.tsx`

### Find the notification channel toggles
They likely render something like:
```tsx
<PrimaryButton onPress={togglePush}>
  {pushEnabled ? "✓ push" : "push"}
</PrimaryButton>
```

### Replace with native `Switch` components
```tsx
<View className="flex-row items-center justify-between rounded-2xl bg-focuslab-background px-4 py-3 dark:bg-dark-bg">
  <Text className="text-base font-medium text-focuslab-primaryDark dark:text-dark-text-primary">
    Push notifications
  </Text>
  <Switch
    onValueChange={togglePush}
    trackColor={{ false: "#B7E4C7", true: "#40916C" }}
    thumbColor="#FFFFFF"
    value={pushEnabled}
  />
</View>
```

Same pattern for email toggle.

The `Switch` component is already used in `CheckInSheet.tsx` (line 258) for the "Did you try it?" toggle, so there's precedent in the codebase.

---

## Verification

### Visual checks
- [ ] Segmented control renders correctly for theme preference (3 segments)
- [ ] Selected segment has white/elevated background
- [ ] Segment change animates smoothly (sliding indicator)
- [ ] Push/email use native Switch toggles instead of buttons
- [ ] Sign out button is visible and functional
- [ ] Delete account link is visible at the bottom
- [ ] Dark mode card borders are more visible
- [ ] All screens with `AppCard` look correct in both light and dark mode

### Functional checks
- [ ] Theme change persists (stored in profile)
- [ ] Sign out returns to login screen
- [ ] Delete account shows confirmation dialog
- [ ] Notification toggles update profile preferences
- [ ] Haptic fires on segmented control change
