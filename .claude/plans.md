# Design Desk Implementation Plan

This document is the complete execution plan, risk register, demo script, and architecture overview. We will implement milestone by milestone, validating each step with lint, typecheck, tests, and deterministic snapshots.

Guiding principles:
- Determinism over flash: stable IDs, stable ordering, canonical serialization.
- Clear separations: model/ops/sync/export are framework-agnostic and testable.
- Demo-ready throughout: always keep a polished starter file and visible progress.

## Verification checklist (kept current)

Core commands (run after every milestone):
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- Last verified: Milestone 24 (2026-01-26)

Final validation sweep (Milestone 24 exit criteria):
- [x] `npm run dev`
- [x] `npm run build`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`

## Milestones (at least 14; executed in order)

Each milestone includes scope, key files/modules, acceptance criteria, and verification steps.

### Milestone 01 - Repo scaffold + tooling foundation [x]
Scope:
- Initialize Vite + React + TypeScript + Tailwind.
- Add Vitest, ESLint, Prettier (or equivalent), and strict TypeScript settings.
- Establish path aliases and base folder structure.

Key files/modules:
- `package.json`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `vite.config.ts`
- `tailwind.config.ts`, `postcss.config.cjs`, `src/index.css`
- `eslint.config.*` (or `.eslintrc.*`)
- `src/main.tsx`, `src/App.tsx`
- `src/core/*`, `src/features/*`, `src/ui/*` (directories)

Acceptance criteria:
- `npm install` succeeds on Node LTS.
- `npm run dev` starts the Vite app.
- Tailwind styles render.
- Lint/typecheck/tests run (even if minimal).

Verification commands:
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

### Milestone 02 - Local collaboration server + unified dev command [x]
Scope:
- Add a local Node + WebSocket server in TypeScript.
- Ensure `npm run dev` starts both web and server concurrently.
- Define message envelopes and session model skeleton.

Key files/modules:
- `server/index.ts`
- `server/sessionManager.ts`
- `server/protocol.ts`
- `server/tsconfig.json`
- `package.json` scripts for concurrent dev

Acceptance criteria:
- One command launches both app and server.
- Server accepts WebSocket connections and echoes test messages.
- Session ID is recognized in the URL.

Verification commands:
- `npm run dev`
- Manual: open browser console, verify WS connection and echo
- `npm run lint && npm run typecheck && npm run test`

### Milestone 03 - App shell layout + design system tokens [x]
Scope:
- Build top bar, left panel, canvas region, and right inspector layout.
- Define CSS variables and foundational tokens (colors, spacing, radii, shadows).
- Add demo banner and empty states scaffolding.

Key files/modules:
- `src/app/layout/AppShell.tsx`
- `src/app/layout/TopBar.tsx`
- `src/app/layout/LeftPanel.tsx`
- `src/app/layout/RightPanel.tsx`
- `src/app/layout/CanvasRegion.tsx`
- `src/styles/tokens.css`

Acceptance criteria:
- Shell UI renders cleanly on desktop and mobile widths.
- Panels resize sensibly; canvas region is central focus.
- Tokens used instead of ad-hoc values.

Verification commands:
- `npm run dev`
- Manual: resize browser, inspect layout
- `npm run lint && npm run typecheck && npm run test`

### Milestone 04 - Core data model: scene graph, IDs, canonical serialization [x]
Scope:
- Define strong types for nodes, transforms, styling, constraints, and documents.
- Implement deterministic ID generation and stable ordering rules.
- Implement canonical serialization/deserialization.

Key files/modules:
- `src/core/model/types.ts`
- `src/core/model/nodeKinds.ts`
- `src/core/model/document.ts`
- `src/core/model/ids.ts`
- `src/core/serialization/canonical.ts`
- `src/core/serialization/__tests__/canonical.test.ts`

Acceptance criteria:
- Document round-trips without semantic changes.
- Canonical JSON output is stable across runs.
- IDs are deterministic where required (e.g., starter/demo content).

Verification commands:
- `npm run test -- canonical`
- `npm run lint && npm run typecheck && npm run test`

### Milestone 05 - Operations engine: ops model, apply, undo/redo, journal [x]
Scope:
- Define operation types and an operation envelope.
- Implement deterministic op application with structural sharing where useful.
- Implement undo/redo stacks and append-only journal.

Key files/modules:
- `src/core/ops/types.ts`
- `src/core/ops/apply.ts`
- `src/core/ops/history.ts`
- `src/core/ops/journal.ts`
- `src/core/ops/__tests__/apply.test.ts`
- `src/core/ops/__tests__/history.test.ts`

Acceptance criteria:
- Applying the same op sequence yields identical state every time.
- Undo/redo works for create/update/delete and reorder.
- Journal entries include enough information for replay.

Verification commands:
- `npm run test -- ops`
- `npm run lint && npm run typecheck && npm run test`

### Milestone 06 - Rendering pipeline on SVG + camera (pan/zoom) [x]
Scope:
- Implement camera state and viewport transforms.
- Render the scene graph via SVG for precise hit-testing and overlays.
- Support pan and zoom with wheel/trackpad and controls.

Key files/modules:
- `src/core/camera/cameraStore.ts`
- `src/features/canvas/CanvasView.tsx`
- `src/features/canvas/SvgScene.tsx`
- `src/features/canvas/CameraControls.tsx`
- `src/features/canvas/__tests__/camera.test.ts`

Acceptance criteria:
- Canvas pans and zooms smoothly.
- Nodes render in correct order with transforms applied.
- SVG overlays can be layered for guides/selections later.

Verification commands:
- `npm run dev`
- Manual: pan/zoom interactions
- `npm run lint && npm run typecheck && npm run test`

### Milestone 07 - Hit-testing + selection model (single and multi-select) [x]
Scope:
- Implement accurate hit-testing in canvas coordinates.
- Add selection state, marquee selection, and multi-select behavior.
- Provide selection outlines and handles scaffolding.

Key files/modules:
- `src/core/selection/selectionStore.ts`
- `src/core/selection/hitTest.ts`
- `src/features/canvas/SelectionOverlay.tsx`
- `src/core/selection/__tests__/selection.test.ts`

Acceptance criteria:
- Clicking selects the correct node.
- Shift-click toggles selection.
- Marquee selection selects intersecting nodes.

Verification commands:
- `npm run test -- selection`
- Manual: selection interactions in UI
- `npm run lint && npm run typecheck && npm run test`

### Milestone 08 - Direct manipulation: drag, resize, rotate, nudge [x]
Scope:
- Implement pointer-driven transforms with stable op emission.
- Add resize handles, rotation handle, and keyboard nudge.
- Ensure minimal re-render storms during drag.

Key files/modules:
- `src/features/transform/transformController.ts`
- `src/features/transform/resizeMath.ts`
- `src/features/transform/rotateMath.ts`
- `src/features/canvas/HandlesOverlay.tsx`
- `src/core/transform/__tests__/transform.test.ts`

Acceptance criteria:
- Drag/resize/rotate feel responsive.
- Operations recorded match the final state exactly.
- Performance is acceptable during continuous drag.

Verification commands:
- `npm run dev`
- Manual: drag/resize/rotate and nudge with arrow keys
- `npm run lint && npm run typecheck && npm run test`

### Milestone 09 - Authoring primitives: insert tools + starter content [x]
Scope:
- Implement node creation tools: Frame, Group, Rectangle, Ellipse, Line, Text, Image (URL), Button, Icon, Chart placeholder.
- Add a default starter file and demo project loader scaffold.

Key files/modules:
- `src/features/insert/insertTools.ts`
- `src/features/insert/defaultStyles.ts`
- `src/demo/starterDocument.ts`
- `src/demo/demoProjects.ts`
- `src/core/model/__tests__/starterDeterminism.test.ts`

Acceptance criteria:
- Toolbar inserts each node type successfully.
- Starter document loads instantly and is visually impressive.
- Starter document serialization is deterministic.

Verification commands:
- `npm run dev`
- Manual: insert each node type and verify starter loads by default
- `npm run lint && npm run typecheck && npm run test`

### Milestone 10 - Guides + snapping: grid, alignment, distribution [x]
Scope:
- Implement snap-to-grid, alignment guides, and basic distribution guides.
- Provide visible guide overlays and snapping thresholds.

Key files/modules:
- `src/core/guides/grid.ts`
- `src/core/guides/alignment.ts`
- `src/core/guides/distribution.ts`
- `src/features/canvas/GuidesOverlay.tsx`
- `src/core/guides/__tests__/guides.test.ts`

Acceptance criteria:
- Dragging near edges/centers snaps predictably.
- Guides render and disappear appropriately.
- Snapping logic is deterministic and test-covered.

Verification commands:
- `npm run test -- guides`
- Manual: drag nodes to trigger guides and snapping
- `npm run lint && npm run typecheck && npm run test`

### Milestone 11 - Layers panel: tree, reorder, visibility/lock/rename/search [x]
Scope:
- Build layers tree reflecting scene graph hierarchy.
- Support drag reorder, visibility toggle, lock toggle, rename, and search filter.
- Implement "jump to layer" behavior.

Key files/modules:
- `src/features/layers/LayersPanel.tsx`
- `src/features/layers/layersSelectors.ts`
- `src/features/layers/layersDnd.ts`
- `src/features/layers/__tests__/layersSelectors.test.ts`

Acceptance criteria:
- Layers tree stays in sync with canvas selection.
- Reordering updates render order deterministically.
- Visibility/lock updates reflect on canvas.

Verification commands:
- `npm run dev`
- Manual: reorder, rename, visibility/lock, search and jump
- `npm run lint && npm run typecheck && npm run test`

### Milestone 12 - Properties inspector: geometry + visual styles + text [x]
Scope:
- Implement right panel controls for geometry, rotation, fill, stroke, radius, opacity, shadows, and text styles.
- Ensure inspector writes ops and respects multi-selection rules.

Key files/modules:
- `src/features/inspector/InspectorPanel.tsx`
- `src/features/inspector/sections/GeometrySection.tsx`
- `src/features/inspector/sections/FillSection.tsx`
- `src/features/inspector/sections/TextSection.tsx`
- `src/features/inspector/inspectorBindings.ts`
- `src/features/inspector/__tests__/inspectorBindings.test.ts`

Acceptance criteria:
- Inspector updates reflect immediately on canvas.
- Multi-selection handles mixed values clearly.
- Changes are recorded as deterministic ops.

Verification commands:
- `npm run dev`
- Manual: edit geometry, fills, strokes, text properties
- `npm run lint && npm run typecheck && npm run test`

### Milestone 13 - Grouping, locking, ordering, context menu, shortcuts modal [x]
Scope:
- Implement group/ungroup, lock/unlock, and z-order commands.
- Add context menu with required actions.
- Add keyboard shortcuts and a shortcuts modal.

Key files/modules:
- `src/features/commands/commandRegistry.ts`
- `src/features/commands/shortcuts.ts`
- `src/features/contextMenu/CanvasContextMenu.tsx`
- `src/features/commands/__tests__/commands.test.ts`
- `src/ui/ShortcutsModal.tsx`

Acceptance criteria:
- Context menu actions match toolbar/shortcut actions.
- Keyboard shortcuts cover required behaviors.
- Order changes are stable and deterministic.

Verification commands:
- `npm run test -- commands`
- Manual: right-click actions and shortcut flows
- `npm run lint && npm run typecheck && npm run test`

### Milestone 14 - Components system: masters, instances, overrides [x]
Scope:
- Implement creating components from selection.
- Support inserting instances, overrides (text + fills), go-to-main, and detach.
- Model component linkage in scene graph and ops.

Key files/modules:
- `src/core/components/types.ts`
- `src/core/components/componentModel.ts`
- `src/features/components/ComponentsPanel.tsx`
- `src/features/components/componentCommands.ts`
- `src/core/components/__tests__/components.test.ts`

Acceptance criteria:
- Instances inherit master updates unless overridden.
- Overrides persist deterministically.
- Go-to-main and detach work as expected.

Verification commands:
- `npm run test -- components`
- Manual: create component, place instances, override, update master
- `npm run lint && npm run typecheck && npm run test`

### Milestone 15 - Prototype mode: hotspots + frame-to-frame navigation [x]
Scope:
- Add Prototype mode toggle.
- Allow drawing hotspots that link frames with on-click triggers.
- Implement preview mode navigation.

Key files/modules:
- `src/core/prototype/types.ts`
- `src/features/prototype/prototypeStore.ts`
- `src/features/prototype/PrototypeOverlay.tsx`
- `src/features/prototype/PreviewPlayer.tsx`
- `src/core/prototype/__tests__/prototype.test.ts`

Acceptance criteria:
- Hotspots can be created, edited, and removed.
- Preview navigation follows defined links.
- Prototype data serializes deterministically.

Verification commands:
- `npm run dev`
- Manual: create hotspots and preview navigation
- `npm run lint && npm run typecheck && npm run test`

### Milestone 16 - Comments and annotations: pins, threads, resolve/reopen [x]
Scope:
- Implement comment mode with canvas pins.
- Add threaded comments per pin with author name.
- Comments list panel with jump-to-pin behavior.
- Decision: comments will render as a third tab in the existing left panel, comment mode will be toggled from the TopBar, pin coordinates will be rounded to 0.5px for stable serialization, and the comments list will sort unresolved threads first then by thread id.

Key files/modules:
- `src/core/comments/types.ts`
- `src/features/comments/commentsStore.ts`
- `src/features/comments/CommentsOverlay.tsx`
- `src/features/comments/CommentsPanel.tsx`
- `src/core/comments/__tests__/comments.test.ts`

Acceptance criteria:
- Pins appear at deterministic coordinates.
- Threads support add, resolve, reopen.
- Jump-to-pin focuses the camera appropriately.

Verification commands:
- `npm run dev`
- Manual: create pins, add threads, resolve, jump
- `npm run lint && npm run typecheck && npm run test`

### Milestone 17 - Realtime sync: presence, cursors, selections, edits [x]
Scope:
- Implement client sync engine over WebSocket.
- Sync ops journal, presence, live cursors, and selections.
- Support optimistic updates and basic LWW conflict handling.
- Decision: render the presence list in the TopBar and add a dedicated canvas overlay for remote cursors and remote selections.
- Decision: treat the server as authoritative for session snapshots and sequence ordering, and rebase pending local ops by replaying the seq-ordered op log plus any local pending ops.
- Decision: sync demo-project document replacements via a `document:replace` message that broadcasts a canonical snapshot and resets the server-side op log/sequence.
- Decision: generate a per-tab `userId`/`actorId` via sessionStorage and use a shared deterministic hash to assign user colors.
- Decision: when a `document:replace` is in-flight, queue local ops (do not send) and ignore incoming ops until the replace broadcast arrives, preventing new ops from applying to the old server snapshot.
- Decision: run the server watcher with `tsx --tsconfig server/tsconfig.json` so `@/` path aliases resolve under tsx (the root `tsconfig.json` only contains project references).

Key files/modules:
- `src/core/collab/protocol.ts`
- `src/core/collab/client.ts`
- `src/core/collab/presence.ts`
- `src/core/collab/syncEngine.ts`
- `server/sessionManager.ts`
- `server/broadcast.ts`
- `src/core/collab/__tests__/syncEngine.test.ts`

Acceptance criteria:
- Two tabs in same session see live cursors, selections, and edits.
- Presence list updates on join/leave.
- Conflicts resolve predictably (documented LWW).

Verification commands:
- `npm run dev`
- Manual: open two tabs with same session id and edit concurrently
- `npm run lint && npm run typecheck && npm run test`

### Milestone 18 - Version history: snapshots, restore, milestones [x]
Scope:
- Implement local snapshot storage with canonical serialization.
- Add version timeline UI with restore and named milestones.
- Ensure snapshots are diffable.
- Decision: add a dedicated `History` tab inside `src/features/layers/LayersPanel.tsx` for the version timeline UI.
- Decision: store snapshots per `document.meta.id` in localStorage (with an in-memory fallback), ordered by a monotonic snapshot seq and trimmed to a bounded history.
- Decision: when trimming snapshot history, drop the oldest unlabeled auto snapshots first and preserve labeled milestones whenever possible.
- Decision: capture an initial snapshot when none exists, then auto-snapshot every 25 applied ops and on document replacements; naming a milestone captures a new labeled snapshot immediately.
- Decision: extend `useDocumentStore().lastChange` with an `opCount` field so the snapshot engine can count both local and remote operations without relying on journal deltas.
- Decision: restoring a snapshot first captures the current state (auto) so users can restore back, then replaces the document with the selected canonical snapshot without duplicating it.
- Decision: snapshot restores and history-driven replacements should flow through `useCollabPresenceStore().replaceDocument` when collaboration is active so other tabs remain in sync.

Key files/modules:
- `src/core/history/snapshots.ts`
- `src/features/history/HistoryPanel.tsx`
- `src/core/history/__tests__/snapshots.test.ts`
- `src/core/persistence/localStore.ts`

Acceptance criteria:
- Snapshots are created automatically and can be restored.
- Named milestones are persisted and visible.
- Snapshots are deterministic and diffable.

Verification commands:
- `npm run test -- snapshots`
- Manual: create milestones and restore older snapshots
- `npm run lint && npm run typecheck && npm run test`

### Milestone 19 - Replay system: deterministic journal playback + branching [x]
Scope:
- Implement deterministic replay from journal.
- Build Replay panel with play/pause/step/scrub/speed.
- Support branch-from-here to create a new version.

Key files/modules:
- `src/core/replay/replayEngine.ts`
- `src/core/replay/replayState.ts`
- `src/features/replay/ReplayPanel.tsx`
- `src/core/replay/__tests__/replay.test.ts`

Acceptance criteria:
- Replay reproduces the same state from same initial state + journal.
- Stepping forward/back is stable and accurate.
- Branch-from-here creates a new version without mutating history.

Verification commands:
- `npm run test -- replay`
- Manual: record edits, replay them, branch at a midpoint
- `npm run lint && npm run typecheck && npm run test`

### Milestone 20 - Persistence: local files, imports, autosave, share links [x]
Scope:
- Persist designs locally (browser storage + file export/import).
- Encode session id in shareable local links.
- Ensure journal is stored alongside design data.

Key files/modules:
- `src/core/persistence/storage.ts`
- `src/core/persistence/fileIO.ts`
- `src/app/session/sessionId.ts`
- `src/features/files/FileMenu.tsx`
- `src/core/persistence/__tests__/fileIO.test.ts`

Acceptance criteria:
- Designs autosave locally and load on refresh.
- Importing a design JSON restores state and journal.
- Share link retains the session id.

Verification commands:
- `npm run dev`
- Manual: refresh, import/export JSON, use share link
- `npm run lint && npm run typecheck && npm run test`

### Milestone 21 - Deterministic export pipeline: JSON + React/Tailwind codegen [x]
Scope:
- Implement canonical JSON export.
- Implement deterministic React + Tailwind code generation.
- Support component-aware codegen with reusable components.

Key files/modules:
- `src/core/export/exportJson.ts`
- `src/core/export/codegen/types.ts`
- `src/core/export/codegen/generate.ts`
- `src/core/export/codegen/emitters/reactTailwind.ts`
- `src/core/export/codegen/__tests__/codegenSnapshot.test.ts`
- `scripts/export.mts`

Acceptance criteria:
- Same input JSON yields byte-identical generated output.
- Components emit as reusable React components.
- CLI works without opening the UI.

Verification commands:
- `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`
- `npm run test -- codegen`
- `npm run lint && npm run typecheck && npm run test`

### Milestone 22 - Demo projects picker + UX polish pass [x]
Scope:
- Implement Demo Projects picker with 2-3 impressive samples.
- Add toasts, empty states, subtle animations, and demo-friendly affordances.
- Ensure the default load is demo-ready.
- Design direction: keep the existing mission-control palette (cyan/sky + amber accents) and add ambient motion and tactile surfaces rather than re-theming the app.

Key files/modules:
- `src/demo/demoProjects.ts`
- `src/features/demo/DemoProjectsPicker.tsx`
- `src/ui/ToastProvider.tsx`
- `src/styles/animations.css`

Acceptance criteria:
- Demo picker loads multiple projects instantly.
- UI feels polished and intentional to non-engineers.
- No core regressions.

Verification commands:
- `npm run dev`
- Manual: demo flows, including picker and banner
- `npm run lint && npm run typecheck && npm run test`

### Milestone 23 - Engineering hardening: property-based tests + perf guardrails [x]
Scope:
- Add property-based tests for ops/transforms/replay where reasonable.
- Add performance guardrails: memoization, throttled persistence, minimal hot-path allocations.
- Review and tighten types and module boundaries.

Key files/modules:
- `src/core/ops/__tests__/ops.property.test.ts`
- `src/core/transform/__tests__/transform.property.test.ts`
- `src/core/replay/__tests__/replay.property.test.ts`
- `src/core/perf/*`

Acceptance criteria:
- Property-based tests validate determinism invariants.
- Drag/resize remains responsive on demo documents.
- Test suite remains reliable and reasonably fast.

Verification commands:
- `npm run test`
- Manual: stress drag on busy demo files
- `npm run lint && npm run typecheck`

### Milestone 24 - Documentation + final verification sweep [x]
Scope:
- Write architecture doc describing model, rendering, ops/sync/replay/export.
- Ensure all scripts exist: dev, build, test, lint, typecheck, export.
- Validate one-command local run experience end to end.

Key files/modules:
- `docs/architecture.md`
- `README.md`
- `plans.md` (updated with decisions and notes)
- `examples/*.design.json`

Acceptance criteria:
- Docs are clear and support both demo and engineering review.
- All required scripts run locally on macOS Node LTS.
- Final verification checklist passes.

Verification commands:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`

## Risk register (top technical risks + mitigations)

1) Rendering + interaction complexity on an infinite-ish canvas
- Risk: Interaction bugs and visual drift between model and render output.
- Mitigation: SVG rendering with explicit world-to-screen transforms, plus layered overlays for guides/selections. Test camera math and hit-testing early (Milestones 06-07).

2) Transform math (resize/rotate) with nested groups/frames
- Risk: Subtle math errors, especially with rotation, constraints, and nesting.
- Mitigation: Centralize transform math in pure functions, test them thoroughly, and emit minimal ops that reflect final computed values (Milestone 08 + 23).

3) Realtime sync correctness + determinism
- Risk: Divergence between tabs or non-deterministic ordering of ops.
- Mitigation: Make the op journal authoritative, apply ops deterministically, and enforce stable ordering and last-writer-wins for conflicts. Test sync engine with simulated latency/order changes (Milestone 17 + 23).

4) Replay determinism + branching
- Risk: Replay drift or inability to step backward cleanly.
- Mitigation: Journal entries must be pure ops with stable IDs. Replay uses canonical initial state, deterministic apply, and explicit checkpoints for efficient stepping (Milestone 19).

5) Deterministic export/codegen
- Risk: Non-deterministic iteration order creates diff noise or unstable snapshots.
- Mitigation: Canonical serialization rules, stable sort keys, and snapshot tests that assert byte-identical outputs (Milestone 04 + 21).

6) Performance under heavy drag + frequent updates
- Risk: Re-render storms and sluggish drag experiences.
- Mitigation: Use a small number of state stores, separate transient drag state from committed state, batch ops, memoize render nodes, and throttle persistence (Milestone 08 + 23).

## Demo script (3 minutes, non-engineers, includes multiplayer + replay)

0:00-0:20 - Instant wow
- Launch with `npm run dev`.
- Show the starter file loading immediately with a polished layout.
- Pan/zoom fluidly to signal an infinite canvas.

0:20-1:20 - Editing power
- Insert a new frame and a few shapes/text.
- Use multi-select, alignment guides, and snap-to-grid.
- Demonstrate right-panel edits (fill, radius, shadow, text size).
- Open context menu and use bring-to-front/back.

1:20-2:00 - Components + prototype
- Convert a button group into a component.
- Insert two instances and override text/fill on one.
- Switch to Prototype mode and link two frames, then preview the flow.

2:00-2:40 - Multiplayer collaboration
- Open a second tab using the same session id (share link).
- Show live cursors, selections, and edits syncing in real time.
- Emphasize this is fully local with the included server.

2:40-3:00 - Replay + version history + export
- Open Replay panel, scrub back, and step forward.
- Branch from a midpoint to create a new version.
- Export JSON and run CLI export to React + Tailwind.

## Architecture overview

This section describes the intended architecture that we will implement and keep aligned with the codebase as it evolves.

### Scene graph data model
Goals:
- Strong typing, deterministic IDs, and stable ordering.
- A normalized model that still supports hierarchical operations.

Approach:
- A `DesignDocument` contains:
    - `meta`: document metadata, version info, and settings.
    - `nodes`: a dictionary keyed by `NodeId`.
    - `root`: the root node id.
    - `components`: component masters and instance linkage metadata.
    - `prototype`: frame links and hotspots.
    - `comments`: pins and threads.
    - `journal`: append-only ops log for replay/sync.
- Each node includes:
    - `id`, `kind`, `name`
    - `parentId`, `childIds` (ordered)
    - geometry: `x`, `y`, `width`, `height`, `rotation`
    - styling: fills, strokes, radius, opacity, shadows, text styles as applicable
    - flags: `locked`, `visible`
    - component fields: `componentId`, `instanceOf`, `overrides`
- Deterministic ordering:
    - `childIds` order is authoritative for rendering.
    - All iteration for serialization/codegen uses explicit stable sort keys.

### Selection + transform system
Goals:
- Accurate hit-testing and intuitive transforms.
- Keep transform math pure and testable.

Approach:
- Maintain a `SelectionState` store separate from the document.
- Hit-testing resolves to node ids using:
    - camera transforms (screen -> world)
    - node bounds in world space
    - z-order traversal from topmost to bottommost
- Transform interactions:
    - Pointer movement updates transient interaction state.
    - On commit (or throttled intervals), emit ops that update the document.
    - Transform math (resize/rotate) lives in pure utilities.

### Rendering approach (SVG, and why)
Choice: SVG for the editor surface.

Rationale:
- Precise hit regions, easy overlays for guides/selections/cursors.
- Built-in transforms and good fidelity for typical design-tool primitives.
- Easier DOM inspection during development and demos.

Implementation notes:
- Use a single SVG root with grouped layers:
    1) scene content
    2) guides overlay
    3) selection/handles overlay
    4) collaboration overlay (cursors/selections)
- Camera transform applied at a high level to minimize per-node math.

### Operations model (ops, undo/redo, determinism)
Goals:
- Deterministic application and a journal that powers sync + replay.
- Minimal, explicit ops that are easy to test and reason about.

Approach:
- Define a discriminated union `DesignOp` with explicit payloads.
- All mutations go through `applyOp(document, op) -> document`.
- Undo/redo:
    - Store inverse ops where feasible, or compute inverses at apply time.
    - Maintain two stacks: `undoStack`, `redoStack`.
- Journal:
    - Append-only list of applied ops with metadata (timestamp, actorId, seq).
    - Journal entries are stable and serializable.

### Replay system (journal format, deterministic apply, branching)
Goals:
- Same initial state + same journal => same final state.
- Support stepping, scrubbing, and branching without drift.

Approach:
- Replay engine:
    - Inputs: canonical initial document and journal entries.
    - Applies ops in deterministic order using stable sorting by sequence keys.
- Stepping backwards:
    - Use checkpoints (snapshots) at intervals for efficient rewind.
    - Alternatively, rebuild from the nearest checkpoint.
- Branching:
    - "Branch from here" creates a new version with:
        - a canonical snapshot at the chosen step
        - a truncated journal as the new base

### Sync engine (what syncs, conflicts, authority)
Goals:
- Near real-time multi-tab collaboration locally.
- Deterministic convergence with simple conflict rules.

Approach:
- What syncs:
    - Journal ops (authoritative state changes)
    - Presence data (cursors, selections, user profile)
- Authority model:
    - The server is authoritative for session membership and broadcast ordering.
    - Clients are authoritative for local optimistic updates but reconcile to server order.
- Conflict handling:
    - Default to last-writer-wins for property conflicts.
    - Reorder operations use stable indices and deterministic reconciliation rules.

### Export pipeline + determinism strategy
Goals:
- Deterministic export for both JSON and generated React/Tailwind code.
- Component-aware structure in generated output.

Approach:
- JSON export:
    - Use canonical serialization with stable ordering and optional journal inclusion.
- Codegen:
    - Build an intermediate representation (IR) derived from the scene graph.
    - Normalize and sort IR deterministically.
    - Emit React components with Tailwind classes.
    - Components:
        - Masters become reusable React components.
        - Instances map to component usage with overrides passed as props.
- Determinism tactics:
    - Stable iteration order everywhere.
    - Pure formatting rules.
    - Snapshot tests assert byte-identical outputs.

## Implementation notes and decision log (updated as we go)

- Milestone 01:
    - Tailwind CSS v4 did not expose the expected CLI in this environment, so we pinned `tailwindcss@3.4.17` for a stable local setup.
    - Vite config now imports `defineConfig` from `vitest/config` so the `test` block typechecks cleanly.
- Milestone 02:
    - Added a typed local WebSocket collaboration server with a start/stop handle so it can be exercised in Vitest.
    - `npm run dev` now launches both the Vite app and the collab server concurrently.
    - If port `5173` is already in use from a prior run, stop the old process (for example, `lsof -i :5173 -t | xargs kill`).
- Milestone 03:
    - Introduced `src/styles/tokens.css` and a reusable `PanelFrame` to keep the layout consistent and easy to evolve.
    - The shell now renders `TopBar`, `LeftPanel`, `CanvasRegion`, and `RightPanel` with mobile-friendly ordering.
- Milestone 04:
    - Added strong model types, deterministic ID factories, and canonical serialization with stability tests.
    - `createEmptyDocument` defaults to a random seed for uniqueness, while determinism is available by passing a fixed seed.
- Milestone 05:
    - Implemented a typed ops engine with deterministic apply, undo/redo history, and an append-only journal.
    - Undo/redo restamps timestamps by default so `updatedAt` reflects the latest action while remaining deterministic given the journal.
    - Node deletion currently focuses on the scene graph; registry cleanup (components/prototype/comments) will be expanded alongside those features to preserve restore correctness.
- Milestone 06:
    - Seeded a deterministic starter document via ops, then cleared history/journal so the default canvas is demo-ready without pre-populating undo.
    - Added a dedicated camera store with pure math helpers and `useShallow` selectors (Zustand v5 removes the equality function argument).
    - Implemented the SVG rendering pipeline with sorted gradient defs, a root-level camera transform, and a simple HUD + zoom controls overlay.
- Milestone 07:
    - Added a dedicated selection store plus world-geometry hit testing that mirrors SVG render order for predictable top-most selection.
    - Marquee selection prunes ancestor containers when descendants are selected, preventing large frames from always dominating multi-selects.
    - Selection overlays now render inside the SVG camera transform via an `overlay` slot on `SvgScene`, which keeps guides/selections aligned at any zoom level.
- Milestone 08:
    - Introduced a transform controller with transient draft transforms so drag/resize/rotate preview smoothly without mutating the document on every pointer move.
    - `computeWorldGeometry` and `SvgScene` now accept transform overrides, ensuring hit testing, overlays, and rendering stay aligned during interactions.
    - Resize and rotate handles are currently shown for single selection only, while multi-select drag is supported; this keeps the math deterministic and reviewable.
    - Arrow-key nudging (shift = larger step) emits deterministic update ops, and transform math/controller behavior is covered in `src/core/transform/__tests__/transform.test.ts`.
- Milestone 09:
    - Starter content now lives in `src/demo/starterDocument.ts` with all node kinds represented and a deterministic hash test.
    - The document store adds `nextNodeId`, seeded by `document.meta.id`, and self-heals the seed when documents are replaced directly in tests.
    - Insert tools center new nodes in the viewport, target the active container when possible, and create a placeholder child for new groups.
    - Demo project switching is wired into the TopBar and resets camera/selection; the dashboard-focused demo repositions the dashboard to the origin for immediate visibility.
- Milestone 10:
    - Added deterministic guide engines in `src/core/guides/alignment.ts`, `src/core/guides/distribution.ts`, and `src/core/guides/grid.ts`, with shared types in `src/core/guides/types.ts`.
    - Drag snapping now runs against a static snapshot of world bounds captured at drag start, excluding the moving subtree and any ancestor groups with stale derived bounds.
    - Alignment and distribution candidates take precedence over grid snapping per axis, with tie-breaking favoring alignment for predictable behavior.
    - Grid snapping aligns `minX`/`minY` and caps its effective threshold at one-third of the grid size to avoid over-quantizing movement.
    - Per-axis snapping is gated by a zoom-scaled ~1px movement epsilon so stationary axes do not emit guides or grid snaps.
    - `useTransformStore` now exposes `snapGuides`, and `src/features/canvas/GuidesOverlay.tsx` renders guides within the camera transform alongside selection overlays.
- Milestone 11:
    - Replaced the placeholder left panel with `src/features/layers/LayersPanel.tsx`, including search, rename-on-double-click, visibility/lock toggles, and drag reorder.
    - Layers presentation is derived by `buildLayerItems` in `src/features/layers/layersSelectors.ts`, which reverses each sibling list so top-most nodes appear first while preserving canonical render order.
    - Drag-and-drop resolution lives in `src/features/layers/layersDnd.ts`, mapping display order back to canonical indices and blocking descendant moves before emitting `move-node` ops.
    - Jump-to-layer now centers the camera on the current selection using a shared viewport size store (`src/core/canvas/viewportStore.ts`) that is updated by `src/features/canvas/CanvasView.tsx`.
    - Deterministic behavior and the display-index mapping are covered in `src/features/layers/__tests__/layersSelectors.test.ts`.
- Milestone 12:
    - Replaced the placeholder right panel with `src/features/inspector/InspectorPanel.tsx`, wired into `src/app/layout/RightPanel.tsx`.
    - Added deterministic inspector bindings in `src/features/inspector/inspectorBindings.ts`, including primary-selection base values, locked-node skips, and change detection that avoids no-op history entries.
    - Introduced shared inspector controls in `src/features/inspector/controls.tsx` plus focused sections in `src/features/inspector/sections/GeometrySection.tsx`, `src/features/inspector/sections/FillSection.tsx`, and `src/features/inspector/sections/TextSection.tsx`.
    - Fill operations update frame backgrounds vs shape fills correctly, gradient editing is capped to two stops, and stroke/shadow toggles add defaults only where missing.
    - Inspector inputs commit on blur (or Cmd/Ctrl+Enter for text) to keep the ops journal concise while still producing immediate updates once edits are committed.
    - Core inspector behaviors and determinism guarantees are covered in `src/features/inspector/__tests__/inspectorBindings.test.ts`.
- Milestone 13:
    - Added a deterministic command system in `src/features/commands/commandRegistry.ts`, including root pruning, parent-sorted ordering, and a planner that applies ops sequentially to keep indices stable.
    - Grouping now requires a shared parent, inserts the new group at the minimum sibling index, and rewrites child `x/y` values relative to the group's bounding box; ungroup restores direct children to the group's parent at the group index while preserving world position.
    - Z-order commands operate within each parent and treat multi-selection as a block by removing selected ids, computing an insertion anchor, and moving nodes before that anchor.
    - Copy/paste/duplicate use an in-memory clipboard (`src/features/commands/clipboardStore.ts`), prune ancestor selections to roots, re-id full subtrees via `nextNodeId`, and apply deterministic offsets (with paste count increments).
    - Keyboard shortcuts are centralized in `src/features/commands/shortcuts.ts`, the canvas context menu lives in `src/features/contextMenu/CanvasContextMenu.tsx`, and the shortcuts modal is rendered from `src/ui/ShortcutsModal.tsx`.
    - Behavior is covered by `src/features/commands/__tests__/commands.test.ts`, including block ordering, grouping/ungrouping, ancestor pruning, and incremental paste offsets.
- Milestone 14:
    - Added a component model (`src/core/components/componentModel.ts`) that rebuilds the component registry from the scene graph and deterministically expands ops so master edits sync to instances.
    - Instance nodes now track their master source ids via `data.__componentSourceId`, enabling structural sync for create/move/delete operations and precise mapping for updates.
    - Extended op metadata with `skipComponentEffects` and added override-clearing semantics (null sentinels) so overrides can be removed when instance values match the master.
    - The document store now routes ops through the component expansion pipeline and reserves ids from incoming ops to avoid collisions when generating derived instance ids.
    - The Assets tab now ships the components workflow with `src/features/components/ComponentsPanel.tsx` and `src/features/components/componentCommands.ts` (create main, insert instance, go-to-main, detach).
    - Component creation currently requires a single selection root; group first for multi-select cases.
    - Behavior coverage lives in `src/core/components/__tests__/components.test.ts` and is included in the full lint/typecheck/test sweep.
- Milestone 15:
    - Replaced prototype link edges with frame-scoped hotspots in `src/core/model/types.ts` and initialized the registry deterministically in `src/core/model/document.ts`.
    - Added a prototype expansion pipeline in `src/core/prototype/prototypeModel.ts` and wired it into `src/core/model/documentStore.ts` so deleting frames also deletes affected hotspots (with undo/redo restore).
    - Implemented mode/state orchestration in `src/features/prototype/prototypeStore.ts`, including draft hotspots, target picking, preview history, and camera fitting to the active frame.
    - Added prototype and preview overlays in `src/features/prototype/PrototypeOverlay.tsx` and `src/features/prototype/PreviewPlayer.tsx`, then integrated them into `src/features/canvas/CanvasView.tsx` with design-mode gating for editing commands.
    - Strengthened determinism coverage in `src/core/prototype/__tests__/prototype.test.ts` and updated the starter determinism hash in `src/core/model/__tests__/starterDeterminism.test.ts`.
- Milestone 16:
    - Added comment helpers in `src/core/comments/types.ts`, including 0.5px coordinate rounding and deterministic unresolved-first sorting for the panel.
    - Extended ops in `src/core/ops/types.ts`, `src/core/ops/apply.ts`, and `src/core/ops/history.ts` to support pins, threads, messages, and resolve/reopen with invertible restore snapshots.
    - Implemented comment mode state orchestration in `src/features/comments/commentsStore.ts`, covering pin creation, thread selection, author names, resolve/reopen, and jump-to-pin camera centering.
    - Shipped the UI surface with `src/features/comments/CommentsOverlay.tsx`, `src/features/comments/CommentsPanel.tsx`, the new Comments tab in `src/features/layers/LayersPanel.tsx`, the TopBar toggle in `src/app/layout/TopBar.tsx`, and comment-mode gating in `src/features/canvas/CanvasView.tsx`.
    - Added coverage in `src/core/comments/__tests__/comments.test.ts`, including behavior checks and canonical serialization determinism.
- Milestone 17:
    - Added shared collaboration protocol, per-tab identity, presence state, and a sync engine that rebases pending local ops over authoritative server sequences.
    - The document store now exposes `applyRemoteOps`, `setDocumentFromCollab`, and `lastChange` origins so remote/rebase updates do not re-broadcast local ops.
    - Canvas now publishes world-space cursor updates, renders remote selections/cursors via `src/features/collab/PresenceOverlay.tsx`, and the TopBar shows live presence plus sync-safe demo document replacements.
    - `npm run dev` now runs the server with `tsx --tsconfig server/tsconfig.json`, fixing path-alias resolution in the Node runtime.
- Milestone 18:
    - Added the snapshot engine and per-document persistence in `src/core/history/snapshots.ts` backed by `src/core/persistence/localStore.ts`.
    - Snapshots now capture an initial version, auto-snapshot every 25 applied ops, record document replacements, and trim to a bounded history while preserving named milestones whenever possible.
    - Snapshot restore first captures the current state, then replaces the document through `useCollabPresenceStore().replaceDocument(...)` so other tabs stay in sync.
    - The history timeline UI ships as `src/features/history/HistoryPanel.tsx` and is integrated as a new History tab in `src/features/layers/LayersPanel.tsx`.
    - The snapshot engine starts at app mount via `src/App.tsx`, ensuring history accrues even when the History tab is hidden.
    - Added deterministic coverage in `src/core/history/__tests__/snapshots.test.ts` and targeted verification via `npm run test -- snapshots`.
    - `localStore` now detects Vitest and uses its in-memory fallback to avoid noisy localStorage warnings in tests.
- Milestone 19:
    - Implemented a deterministic replay engine in `src/core/replay/replayEngine.ts` that derives frame documents by applying journal entries beyond the baseline max sequence.
    - Added a replay state store in `src/core/replay/replayState.ts`, including playback controls, branching, document subscriptions, and a replay lock bridge that gates editing.
    - `src/features/canvas/CanvasView.tsx` now renders from the replay document when active and suppresses editing, presence cursors, and comments during replay.
    - The Replay tab ships as `src/features/replay/ReplayPanel.tsx` and is integrated into `src/features/layers/LayersPanel.tsx` alongside lock-aware layer controls.
    - Replay branching routes through `useCollabPresenceStore().replaceDocument(...)` so branch state becomes authoritative for all local tabs.
    - Added coverage in `src/core/replay/__tests__/replay.test.ts`, including determinism, step stability, branch isolation, and replay locking.
- Milestone 20:
    - Added session-scoped autosave storage in `src/core/persistence/storage.ts`, using canonical serialization and a debounced document-store subscription.
    - App startup now loads autosaved documents via `useCollabPresenceStore().replaceDocument(...)` before starting snapshot/replay engines, and stops autosave on cleanup.
    - Implemented canonical file IO helpers in `src/core/persistence/fileIO.ts` and shipped a top-bar File menu in `src/features/files/FileMenu.tsx` with save, import, export, and share-link copy.
    - Import flows explicitly exit replay/comment/prototype modes, clear selection/interaction state, reset the camera, and flush autosave after replace.
    - Added persistence coverage in `src/core/persistence/__tests__/fileIO.test.ts`, including session isolation and a refresh simulation that stops autosave before resetting the document.
- Milestone 21:
    - Added canonical export helpers in `src/core/export/exportJson.ts` plus export coverage in `src/core/export/__tests__/exportJson.test.ts`.
    - Implemented deterministic codegen context building in `src/core/export/codegen/generate.ts`, sorting components by `componentId` and normalizing the scene from root-child world bounds.
    - The React/Tailwind emitter now generates reusable component definitions, merges `className` even without overrides, and applies instance rotation/opacity deltas relative to the master while scaling via `scale-x/y` classes.
    - Shipped the CLI at `scripts/export.mts`, wired into `npm run export`, and generated `examples/starter.design.json` from the starter document for verification and demos.
    - Determinism is enforced via the codegen hash test in `src/core/export/codegen/__tests__/codegenSnapshot.test.ts` and the milestone verification command `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`.
- Milestone 22:
    - Captured the design thesis and brand rules in `docs/design/brand-guidelines.md` to keep the mission-control direction explicit.
    - Added shared motion styles in `src/styles/animations.css` and wired a toast system via `src/ui/toastContext.ts` and `src/ui/ToastProvider.tsx`.
    - Extended `src/demo/demoProjects.ts` with picker metadata (accent, gradient, highlights) and replaced the TopBar dropdown with the curated card picker in `src/features/demo/DemoProjectsPicker.tsx`.
    - Demo loads and File menu actions now emit toasts, and demo selection resets local modes plus the camera for a reliable demo reset.
- Milestone 23:
    - Added deterministic perf utilities in `src/core/perf/seededRandom.ts` and `src/core/perf/documentCache.ts` to support fuzz-style testing and reference-safe memoization.
    - `computeWorldGeometry` now caches geometry for documents without transform overrides, keyed by `document.meta.version` in `src/core/selection/hitTest.ts`.
    - Shipped property-based determinism checks in `src/core/ops/__tests__/ops.property.test.ts`, `src/core/transform/__tests__/transform.property.test.ts`, and `src/core/replay/__tests__/replay.property.test.ts`.
    - The geometry cache assumes documents are treated as immutable snapshots and relies on `meta.version` changes to invalidate cached results.
- Milestone 24:
    - Added the architecture overview at `docs/architecture.md` and replaced the Vite template README with project-specific quick start, scripts, and demo flows in `README.md`.
    - Updated `documentation.md` to explicitly cover the required operator guidance: what Design Desk is, verification commands, demo recipes, repo structure, design file format, and troubleshooting.
    - Ran the final validation sweep locally on 2026-01-26: bounded `npm run dev`, plus `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`.