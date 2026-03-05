# Design Desk Documentation

This document is updated continuously as milestones land so it reflects reality.

## What Design Desk is
- A local-first design editor that is reliable in live demos and rigorous under engineering review.
- The entire state model is operation-driven, canonically serialized, and replayable.
- Collaboration, replay, persistence, and export all run fully locally with the bundled server and scripts.

## Status
- Milestone 01: complete
- Milestone 02: complete
- Milestone 03: complete
- Milestone 04: complete
- Milestone 05: complete
- Milestone 06: complete
- Milestone 07: complete
- Milestone 08: complete
- Milestone 09: complete
- Milestone 10: complete
- Milestone 11: complete
- Milestone 12: complete
- Milestone 13: complete
- Milestone 14: complete
- Milestone 15: complete
- Milestone 16: complete
- Milestone 17: complete
- Milestone 18: complete
- Milestone 19: complete
- Milestone 20: complete
- Milestone 21: complete
- Milestone 22: complete
- Milestone 23: complete

## Local setup
- Node LTS on macOS.
- Install deps: `npm install`
- Start dev environment (app + collab server): `npm run dev`
- App: `http://localhost:5173`
- Collab server health: `http://localhost:8787`
- The app auto-adds `?sessionId=...` to the URL.
- Autosave is scoped by `sessionId`, so refresh restores the same session state.

## Verification commands
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests: `npm run test`
- Build: `npm run build`
- Export CLI: `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`

## Demo recipes
- Multiplayer in two tabs:
    1) Run `npm run dev`
    2) Copy the session link from the TopBar
    3) Open the same link in a second tab
    4) Edit in either tab and watch cursors, selections, and edits sync
- Replay mode:
    1) Make a few edits
    2) Open the Replay tab in the left panel
    3) Scrub backward, change speed, and step through frames
    4) Use Branch from here to replace the live document from a prior frame

## Repo structure overview
- `src/core/*`: framework-agnostic model, ops, determinism, sync, replay, export
- `src/features/*`: canvas, layers, inspector, prototype, comments, replay, commands
- `src/app/*`: app shell layout and wiring
- `src/ui/*`: shared UI primitives (panels, modal, toasts)
- `src/styles/*`: tokens and shared animation styles
- `server/*`: local WebSocket collaboration server
- `scripts/*`: CLI scripts, including export
- `examples/*`: demo-ready design files
- `docs/*`: architecture and brand guidance
- `plans.md`: source-of-truth milestones and decisions

## Design file format overview (high level)
- Design files are canonical JSON snapshots of `DesignDocument` (`src/core/model/types.ts`).
- Core structure:
    - `meta`: document identity, timestamps, version, and settings
    - `nodes`: a scene graph keyed by `NodeId`
    - `rootId`: the root frame id
    - registries: `components`, `prototype`, `comments`, and `journal`
- Canonicalization lives in `src/core/serialization/canonical.ts` and is used for autosave, export, and determinism tests.
- Use the export CLI to generate files from the live starter document: `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`.

## Design guidance
- Brand direction and UI rules: `docs/design/brand-guidelines.md`
- Mission-control chrome (top bar + background) carries the atmosphere; panels stay crisp and readable.

## App shell
- Top bar, layers panel, canvas region, and inspector are wired up.
- These live in `src/app/layout/*` and share `src/ui/PanelFrame.tsx`.

## Core model + determinism
- Scene graph types live under `src/core/model/*`.
- Canonical serialization lives in `src/core/serialization/canonical.ts`.
- Starter content lives in `src/demo/starterDocument.ts`.
- Starter determinism is enforced in `src/core/model/__tests__/starterDeterminism.test.ts`.
- The document store (`src/core/model/documentStore.ts`) seeds an ID factory from `document.meta.id` and exposes `nextNodeId()` for deterministic, collision-safe insertions.

## Property-based tests + perf guardrails
- Perf utilities live in `src/core/perf/seededRandom.ts` and `src/core/perf/documentCache.ts`.
- `computeWorldGeometry` now caches per-document geometry when no overrides are provided, guarded by `document.meta.version` in `src/core/selection/hitTest.ts`.
- Determinism properties are covered in `src/core/ops/__tests__/ops.property.test.ts`, `src/core/transform/__tests__/transform.property.test.ts`, and `src/core/replay/__tests__/replay.property.test.ts`.

## Starter + demo projects
- The default load is the starter document from `src/demo/starterDocument.ts`.
- Demo variants and picker metadata are defined in `src/demo/demoProjects.ts`.
- The TopBar now uses `src/features/demo/DemoProjectsPicker.tsx`, which replaces the session document, resets local modes, resets the camera, and confirms the load with a toast.
- The dashboard-focused demo hides the other frames and moves the dashboard to the origin so it is visible immediately after reset.

## Toasts + motion polish
- Toast provider: `src/ui/ToastProvider.tsx`
- Toast hook + types: `src/ui/toastContext.ts`
- Shared animation styles: `src/styles/animations.css` (imported in `src/main.tsx`)
- Demo picker and File menu actions emit toasts so demo flows have visible confirmations.

## Realtime collaboration
- Protocol + message types: `src/core/collab/protocol.ts`
- Client transport + sync engine: `src/core/collab/client.ts`, `src/core/collab/syncEngine.ts`
- Presence state + UI: `src/core/collab/presence.ts`, `src/features/collab/PresenceOverlay.tsx`, `src/app/layout/TopBar.tsx`
- Behavior notes:
    - The server is authoritative for snapshots and sequence ordering; the client rebases pending local ops on top of server-ordered ops.
    - Presence, cursors, selections, and edits sync across tabs in the same session.
    - While a `document:replace` is in flight, local ops are queued until the replace broadcast arrives.
- Tests: `src/core/collab/__tests__/syncEngine.test.ts`
- Local multiplayer demo:
    1) Run `npm run dev`
    2) Copy the session link shown in the TopBar
    3) Open it in a second tab and edit concurrently

## Version history snapshots
- Snapshot engine + store: `src/core/history/snapshots.ts`
- Local persistence helper: `src/core/persistence/localStore.ts`
- History UI: `src/features/history/HistoryPanel.tsx`
- Integrations: `src/App.tsx`, `src/features/layers/LayersPanel.tsx`
- Tests: `src/core/history/__tests__/snapshots.test.ts`
- Behavior notes:
    - The snapshot engine starts at app mount and tracks snapshots per `document.meta.id`.
    - An initial snapshot is captured when none exists, auto snapshots land every 25 applied ops, and document replacements also capture snapshots.
    - History is bounded to 80 snapshots per document and trims the oldest unlabeled auto snapshots first while preserving named milestones whenever possible.
    - Restoring a snapshot first captures the current state, then replaces the document via the collab presence bridge so other tabs stay in sync.

## Replay mode
- Replay engine: `src/core/replay/replayEngine.ts`
- Replay state + playback controls: `src/core/replay/replayState.ts`
- Replay lock bridge: `src/core/replay/bridge.ts`
- Replay UI: `src/features/replay/ReplayPanel.tsx`
- Canvas + presence integrations: `src/features/canvas/CanvasView.tsx`, `src/core/model/documentStore.ts`, `src/core/collab/presence.ts`
- Tests: `src/core/replay/__tests__/replay.test.ts`
- Behavior notes:
    - Replay frames are derived deterministically by sorting journal entries and applying only entries beyond the baseline max sequence.
    - Scrubbing to any non-final frame activates replay mode, renders from the replay document, and locks document edits until replay is exited or branched.
    - Playback speed controls (0.5x, 1x, 2x, 4x), step forward/back, and pause all operate on the same frame index model to avoid drift.
    - Branch-from-here deep-clones the selected frame document and replaces the live document via the collab presence bridge so all local tabs converge on the branch.

## Persistence + file menu
- Autosave storage engine: `src/core/persistence/storage.ts`
- Canonical file IO helpers: `src/core/persistence/fileIO.ts`
- File menu UI: `src/features/files/FileMenu.tsx`
- App startup wiring: `src/App.tsx`
- Behavior notes:
    - Autosave writes canonical JSON per session key (`design-desk:autosave:${sessionId}`) and reloads it at startup via the collab replace bridge.
    - The TopBar now includes a File menu with Save now, Export JSON, Import JSON (replace), and Copy share link.
    - Import resets comment/prototype/replay modes, clears selection + active interactions, resets the camera, and flushes autosave immediately.
    - Demo flow: edit, refresh to confirm autosave, then export/import via the File menu.

## Export pipeline (JSON + React/Tailwind)
- JSON export helper: `src/core/export/exportJson.ts`
- Deterministic codegen entrypoint: `src/core/export/codegen/generate.ts`
- React/Tailwind emitter: `src/core/export/codegen/emitters/reactTailwind.ts`
- CLI script: `scripts/export.mts`
- Example design file: `examples/starter.design.json`
- Usage: `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`
- Tests: `src/core/export/__tests__/exportJson.test.ts`, `src/core/export/codegen/__tests__/codegenSnapshot.test.ts`

## Canvas rendering + camera
- Document state: `src/core/model/documentStore.ts`
- Camera state + math helpers: `src/core/camera/cameraStore.ts`
- Element sizing hook: `src/core/utils/useElementSize.ts`
- SVG renderer: `src/features/canvas/SvgScene.tsx`
- Canvas view + HUD controls: `src/features/canvas/CanvasView.tsx`
- Interactions:
    - Hold space and drag to pan (or middle mouse drag).
    - Use ctrl/cmd + wheel to zoom at the pointer.
    - Use the bottom-right controls to zoom/reset around the viewport center.

## Selection + hit testing
- World geometry + hit testing: `src/core/selection/hitTest.ts`
- Selection state store: `src/core/selection/selectionStore.ts`
- Selection overlay: `src/features/canvas/SelectionOverlay.tsx`
- Interactions:
    - Click selects the top-most visible node.
    - Shift-click toggles selection.
    - Drag on empty space marquee selects intersecting nodes (shift-drag adds).
    - Marquee selection prefers descendants over container ancestors when both intersect.

## Direct manipulation (drag, resize, rotate, nudge)
- Transform controller + draft transforms: `src/features/transform/transformController.ts`
- Resize math: `src/features/transform/resizeMath.ts`
- Rotate math: `src/features/transform/rotateMath.ts`
- Handles overlay: `src/features/canvas/HandlesOverlay.tsx`
- Rendering + hit testing honor drafts via `SvgScene` transform overrides and `computeWorldGeometry(document, overrides)`.
- Interactions:
    - Drag a selection to move it (multi-select drag supported).
    - Use the resize handles on a single selection.
    - Use the rotate handle above the selection.
    - Arrow keys nudge unlocked selections by 1; shift + arrow nudges by 10.

## Commands, ordering, and shortcuts
- Command execution + deterministic planning: `src/features/commands/commandRegistry.ts`
- In-memory clipboard snapshot + paste count: `src/features/commands/clipboardStore.ts`
- Shortcut definitions + key resolution: `src/features/commands/shortcuts.ts`
- Canvas context menu hook: `src/features/contextMenu/CanvasContextMenu.tsx`
- Shortcuts modal overlay: `src/ui/ShortcutsModal.tsx`
- Behavior notes:
    - Selection roots are pruned before commands run so descendants are not duplicated or reordered twice when a parent is selected.
    - Grouping requires a shared parent, inserts the group at the minimum sibling index, and rewrites child `x/y` values relative to the group's bounding box; ungroup restores direct children to the parent at the group index while preserving world position.
    - Z-order commands operate per parent and move multi-selection as a block by computing an insertion anchor among unselected siblings.
    - Paste and duplicate re-id entire subtrees via `nextNodeId()`; paste increments its offset on each paste action.
    - Keyboard shortcuts and the context menu both route through the command registry, and canvas shortcuts are ignored while the shortcuts modal is open.
- Tests: `src/features/commands/__tests__/commands.test.ts`

## Guides + snapping
- Guide engines:
    - Grid snapping: `src/core/guides/grid.ts`
    - Alignment snapping: `src/core/guides/alignment.ts`
    - Distribution snapping: `src/core/guides/distribution.ts`
    - Guide types: `src/core/guides/types.ts`
- Guide rendering overlay: `src/features/canvas/GuidesOverlay.tsx`
- Snapping is applied during drag interactions only and runs against a static snapshot of world bounds captured at drag start.
- The moving subtree and ancestor groups are excluded from snap targets to avoid stale derived bounds.
- Alignment and distribution snapping take precedence over grid snapping on each axis, with alignment winning tie-breaks.
- Grid snapping aligns `minX`/`minY` and caps its effective threshold at one-third of the grid size.
- Per-axis snapping is gated by a zoom-scaled ~1px movement epsilon so stationary axes do not emit guides.
- Behavior coverage lives in `src/core/guides/__tests__/guides.test.ts`.

## Layers panel
- Layers UI: `src/features/layers/LayersPanel.tsx`
- Selectors + presentation ordering: `src/features/layers/layersSelectors.ts`
- Drag-and-drop resolution: `src/features/layers/layersDnd.ts`
- Tests: `src/features/layers/__tests__/layersSelectors.test.ts`
- The Assets tab now renders the components workflow via `src/features/components/ComponentsPanel.tsx`.
- The History tab renders the version timeline with restore + milestones via `src/features/history/HistoryPanel.tsx`.
- The Replay tab renders deterministic journal playback and branching via `src/features/replay/ReplayPanel.tsx`.
- Behavior notes:
    - The layers list shows top-most siblings first by reversing each parent's `childIds` for presentation.
    - Search is a case-insensitive substring match that keeps matching nodes and their ancestors visible.
    - Dragging uses before/inside/after bands and emits deterministic `move-node` ops.
    - Visibility, lock, and rename actions emit `update-node` ops.
    - Layer editing controls and drag-and-drop are disabled while replay mode is active.
    - Jump centers the camera on the current selection using `src/core/canvas/viewportStore.ts`, which is updated by `src/features/canvas/CanvasView.tsx`.

## Components system
- Component model + derived sync: `src/core/components/componentModel.ts`
- Component source mapping helpers: `src/core/components/types.ts`
- Commands: `src/features/components/componentCommands.ts`
- Assets UI: `src/features/components/ComponentsPanel.tsx`
- Tests: `src/core/components/__tests__/components.test.ts`
- Behavior notes:
    - Component registry is derived from the scene graph and rebuilt on apply, undo/redo, and document replacement.
    - Master edits propagate to instances deterministically, while instance overrides are recorded for text values and fills.
    - Instance root positions stay local (master `x/y` changes do not move instances), but size and other properties still sync.
    - Overrides clear themselves when an instance value matches the master, allowing future master changes to flow through again.
    - Creating a component currently requires a single selection root (group first for multi-select).

## Inspector panel
- Inspector UI shell: `src/features/inspector/InspectorPanel.tsx`
- Bindings + deterministic ops: `src/features/inspector/inspectorBindings.ts`
- Section components:
    - Geometry: `src/features/inspector/sections/GeometrySection.tsx`
    - Appearance (fill, stroke, radius, opacity, shadow): `src/features/inspector/sections/FillSection.tsx`
    - Text: `src/features/inspector/sections/TextSection.tsx`
- Shared controls: `src/features/inspector/controls.tsx`
- Tests: `src/features/inspector/__tests__/inspectorBindings.test.ts`
- Behavior notes:
    - Mixed values display a "Mixed" badge/placeholder, with the primary selection providing the base value shown in controls.
    - Inspector edits skip locked nodes and emit deterministic `update-node` ops sorted by node id.
    - Frame fills are applied to `background`, while other node kinds update `fills`.
    - Inputs commit on blur (or Cmd/Ctrl+Enter for text content) to avoid generating no-op or excessively granular history entries.

## Insert tools + toolbar
- Insert toolbar: `src/features/insert/InsertToolbar.tsx`
- Insert logic: `src/features/insert/insertTools.ts`
- Default node styles + sizes: `src/features/insert/defaultStyles.ts`
- Interactions:
    - Insert buttons create Frame, Group, Rectangle, Ellipse, Line, Text, Image, Button, Icon, and Chart nodes.
    - New nodes are centered on the current viewport in world space.
    - When a container is selected, inserts target that container; otherwise they target the selected node's parent or the root frame.
    - Group insertion creates a visible placeholder child so the group is immediately selectable.

## Prototype mode + preview
- Prototype state + mode orchestration: `src/features/prototype/prototypeStore.ts`
- Prototype helpers + deterministic expansion: `src/core/prototype/types.ts`, `src/core/prototype/prototypeModel.ts`
- Prototype overlay + HUD: `src/features/prototype/PrototypeOverlay.tsx`
- Preview overlay + player HUD: `src/features/prototype/PreviewPlayer.tsx`
- Canvas integration + mode gating: `src/features/canvas/CanvasView.tsx`
- Behavior notes:
    - The TopBar Prototype button toggles between design, prototype, and preview states via `togglePrototypeMode()` and `startPreview()` / `stopPreview()`.
    - Prototype mode disables design editing commands and shows a HUD for start-frame selection and preview launch.
    - Hotspots are stored under `document.prototype.hotspots` and are always scoped to a source frame with a local rect and optional `targetFrameId`.
    - Deleting a frame (or subtree) also deletes any hotspots that reference it, and undo/redo restores them deterministically.
    - Preview mode renders a derived document where only the active root frame is visible and navigation follows hotspot targets with back/escape support.
    - Determinism coverage lives in `src/core/prototype/__tests__/prototype.test.ts` and the starter hash is updated in `src/core/model/__tests__/starterDeterminism.test.ts`.

## Comments + annotations
- Comment mode state + orchestration: `src/features/comments/commentsStore.ts`
- Helpers + deterministic sorting/rounding: `src/core/comments/types.ts`
- Ops support: `src/core/ops/types.ts`, `src/core/ops/apply.ts`, `src/core/ops/history.ts`
- UI surface: `src/features/comments/CommentsOverlay.tsx`, `src/features/comments/CommentsPanel.tsx`
- Integrations: `src/app/layout/TopBar.tsx`, `src/features/layers/LayersPanel.tsx`, `src/features/canvas/CanvasView.tsx`
- Behavior notes:
    - Comment mode is toggled from the TopBar or Comments tab and switches the canvas cursor to a crosshair.
    - Clicking the canvas in comment mode drops a pin (rounded to 0.5px) and creates a default thread.
    - The Comments tab lists unresolved threads first, supports jump-to-pin camera centering, and allows resolve/reopen plus message replies with a local author name.
    - Determinism coverage lives in `src/core/comments/__tests__/comments.test.ts`.

## Quality commands
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests: `npm run test`
- Build: `npm run build`
- Export CLI: `npm run export -- --input ./examples/starter.design.json --out ./tmp/export`
- Snapshot-focused tests: `npm run test -- snapshots`
- Replay-focused tests: `npm run test -- replay`
- Persistence-focused tests: `npm run test -- fileIO`

## Troubleshooting
- Port 5173 already in use: stop the old process, for example `lsof -i :5173 -t | xargs kill`.
- Port 8787 already in use: stop the old process, for example `lsof -i :8787 -t | xargs kill`.
- Collaboration not connecting: confirm `npm run dev` is running and open `http://localhost:8787` to verify server health.
- Unexpected autosave state: use the Demo picker in the TopBar or import a known-good file via the File menu.