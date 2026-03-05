# Design Desk Brand Guidelines

## Design Thesis

Design Desk should feel like a mission-control studio for product teams. It is confident, slightly cinematic, and always readable at a glance. Surfaces are crisp and structured, while gradients and motion add just enough atmosphere to make demos feel alive.

## Personality

- Core adjectives: focused, technical, premium, coordinated
- Non-goals: playful toys, glassmorphism soup, neon cyberpunk
- Emotional arc: calm setup -> confident action -> satisfying confirmation

## Visual System

### Color

- Primary palette: deep plum surfaces with rosy neutrals
- Accent palette: magenta (`--color-accent`) for primary actions, emerald for positive states, amber for warnings
- Surface palette: white and soft mauve-tinted grays over an atmospheric blush background
- Gradients: directional plum -> magenta gradients for global chrome; avoid reintroducing bright blues

### Typography

- Display font: Space Grotesk
- Body font: IBM Plex Sans
- Numbers/mono: inherit body font unless a dense readout needs `code`
- Scale notes: uppercase micro-labels are acceptable when paired with generous letter spacing

### Layout

- Grid: 8px rhythm with deliberate 16px/24px jumps for panel padding and section breaks
- Spacing rhythm: prefer fewer, larger gaps over many tiny ones
- Density targets: panels can be information-dense, but primary actions must remain visually isolated

### Depth and Materials

- Shadows: soft, wide shadows for panels; tighter shadows for floating elements like menus and toasts
- Borders: use cool gray borders to define structure before adding more color
- Texture usage: gradients live on the page background and top bar, not every component

### Motion

- Timing: 180-320ms for most UI transitions, 420ms max for celebratory reveals
- Easing: smooth ease-out for entrances, ease-in-out for toggles
- Signature motions: subtle rise + fade on entry, small scale-in for confirmations

## Signature Elements

- Mission-control chrome: the top bar and canvas background carry the brand weight
- Status surfaces: badges, toasts, and presence chips should feel like instrumentation readouts
- Demo affordances: project pickers and banners should feel curated, not generic dropdowns

## Component Guidance

- Buttons: uppercase micro-labels are fine in the top bar; elsewhere prefer sentence case
- Inputs: favor clear borders and calm backgrounds; highlight focus with accent color, not glow
- Navigation: treat tabs as segmented controls with clear active contrast
- Cards and containers: use rounded corners and soft shadows, then layer accent strokes sparingly

## Accessibility

- Contrast targets: keep text on surfaces at 4.5:1 or better; badges should remain legible at a glance
- Motion fallback: respect reduced motion by removing large translations and scale effects

## Do and Don't

- Do: keep the palette tight and reuse tokens
- Do: make confirmations feel intentional (toasts, badges, subtle motion)
- Don't: introduce new accent hues without a token
- Don't: stack gradients on gradients