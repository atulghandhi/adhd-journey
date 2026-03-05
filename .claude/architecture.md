# Design Desk Architecture

ADHD Journeys is a local-first, deterministic design studio built with React, TypeScript, Vite, Tailwind, and a small Node WebSocket server. The architecture prioritizes demo reliability and engineering clarity: every state transition is an explicit operation, documents serialize canonically, and multiplayer converges through an authoritative sequence order.

## Guiding principles

- Determinism over flash: stable IDs, stable ordering, and canonical JSON everywhere.
- Pure cores, thin UI: model, ops, replay, and export are framework-agnostic modules.
- Local-first ergonomics: one command runs the app and collaboration server.

## Runtime overview

- Web app: `npm run dev` starts Vite on `http://localhost:5173`.
- Local collab server: the same command starts the WebSocket server on `http://localhost:8787`.
- The session is encoded in the URL (`?sessionId=...`) and flows through autosave, collaboration, and demo reset behavior.

## Document model (scene graph + registries)

The core document type is `DesignDocument` in `src/core/model/types.ts`. It includes:

- `nodes`: a scene graph of strongly typed nodes (frame, group, shapes, text, image).
- `rootId`: the root frame that anchors world coordinates.
- Registries that derive from the graph or attach to it:
    - Components: `document.components`
    - Prototype hotspots: `document.prototype`
    - Comments: `document.comments`
    - Replay journal: `document.journal`
- Metadata: `document.meta` includes `id`, `name`, timestamps, and `version`.

Deterministic IDs come from `createIdFactory` (`src/core/model/ids.ts`) and are seeded by `document.meta.id` inside the document store.

## Operations model + history

All state changes flow through explicit operations (`DesignOp`) defined in `src/core/ops/types.ts` and applied by `applyOp` in `src/core/ops/apply.ts`.

Key properties:

- Operations are small, serializable patches.
- `touchDocument(..., op.timestamp)` ensures metadata updates are tied to the op, not wall-clock time.
- History is modeled as undo/redo stacks in `src/core/ops/history.ts`.

The application entry point for ops is the document store (`src/core/model/documentStore.ts`):

1. Rebuild the component registry from the current graph.
2. Reserve IDs referenced by incoming ops.
3. Expand component and prototype side effects:
    - `expandComponentOps(...)`
    - `expandPrototypeOps(...)`
4. Apply ops via `applyOpsWithResult(...)`.
5. Rebuild the component registry again to keep derived state consistent.

This keeps complex behavior deterministic while keeping the core ops engine pure.

## Rendering + interaction pipeline

Design Desk renders with SVG rather than Canvas.

- Camera state lives in `src/core/camera/cameraStore.ts`.
- World geometry (absolute bounds + render order) is computed in `src/core/selection/hitTest.ts`.
- The main scene is `src/features/canvas/SvgScene.tsx`.
- Overlays render in the same coordinate space:
    - Selection: `src/features/canvas/SelectionOverlay.tsx`
    - Handles: `src/features/canvas/HandlesOverlay.tsx`
    - Guides: `src/features/canvas/GuidesOverlay.tsx`

Interaction flow:

- Pointer events are captured in `src/features/canvas/CanvasView.tsx`.
- Transforms are staged via draft overrides in `src/features/transform/transformController.ts`.
- Draft transforms feed rendering and hit testing without mutating the document on every move.
- On commit, a minimal set of ops is emitted.

## Collaboration + authority model

Collaboration is fully local and uses WebSockets.

- Protocol types: `src/core/collab/protocol.ts`
- Server: `server/index.ts`
- Client transport: `src/core/collab/client.ts`
- Sync engine: `src/core/collab/syncEngine.ts`

Authority model:

- The server is authoritative for sequence ordering and broadcast.
- Clients are optimistic locally, then rebase pending ops on top of server-ordered ops.
- Presence (cursors, selections, identities) is synced separately from document ops.

The sync engine also bridges local modes (comments, prototype, replay) so replacements and remote updates stay coherent in each tab.

## Replay + version history

Replay is built directly on the ops journal.

- Replay frame construction: `src/core/replay/replayEngine.ts`
- Replay state and controls: `src/core/replay/replayState.ts`
- Replay UI: `src/features/replay/ReplayPanel.tsx`

Replay frames are derived by:

- Sorting journal entries deterministically.
- Applying only entries beyond the baseline max sequence.

Version history snapshots are managed by:

- Snapshot engine: `src/core/history/snapshots.ts`
- History UI: `src/features/history/HistoryPanel.tsx`

Restores and branches flow through the collaboration replace bridge so other tabs converge to the same state.

## Persistence + file system flows

There are two persistence layers:

- Session autosave: `src/core/persistence/storage.ts`
    - Keyed by session ID.
    - Canonical JSON.
    - Debounced writes.
- File import/export helpers: `src/core/persistence/fileIO.ts`

The File menu (`src/features/files/FileMenu.tsx`) routes imports, exports, and save-now actions through the same deterministic serialization helpers.

## Export pipeline + determinism strategy

Export works both in the UI and via CLI.

- CLI: `scripts/export.mts`
- Canonical JSON export: `src/core/export/exportJson.ts`
- React/Tailwind codegen:
    - Context building: `src/core/export/codegen/generate.ts`
    - Emitter: `src/core/export/codegen/emitters/reactTailwind.ts`

Determinism tactics include:

- Canonical serialization for JSON.
- Stable component ordering by `componentId`.
- Scene normalization based on root-child world bounds.
- Component-aware codegen with explicit override props.
- Hash-style snapshot tests to guard byte stability.

## Performance guardrails

Performance is addressed in hot paths without sacrificing clarity.

- Draft transform overrides prevent document churn during drag.
- `computeWorldGeometry` now caches per-document results when no overrides are present, keyed by `document.meta.version`.
- Property-based tests stress ops, transform math, and replay determinism.

See `src/core/perf/*` and the `*.property.test.ts` suites for the current guardrails.