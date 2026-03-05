You are Codex acting as a senior staff engineer and tech lead. Build a polished, locally runnable “Design Desk” web app from scratch.

Core goals

* This must be impressive to non-engineers in a live demo (drag/drop editor, layers panel, comments, multiplayer cursors, replay, live preview, export).
* This must also be impressive to engineers (clean architecture, strong types, tests, deterministic serialization, codegen, sync + ops engine).
* You will run for hours: plan first, then implement milestone by milestone. Do not skip the planning phase.

Hard requirements

* Local run experience: one command to start (document exact commands). Must run on macOS with Node LTS.
* Tech stack: TypeScript + React + Vite + Tailwind. Use only open source dependencies.
* Runs fully locally: no external hosted services.
* Must include a local server for realtime collaboration (WebSocket).
* Persist designs locally and export to files.
* Every milestone must include verification steps (tests, lint, typecheck, deterministic snapshots).

Deliverable
A repo that contains:

* A working web app implementing the features below
* A demo “starter file” that loads by default so I can show it instantly
* A short architecture doc explaining the data model, rendering pipeline, and sync + ops engine
* Scripts: dev, build, test, lint, typecheck, export
* A `plans.md` file capturing the full implementation plan and ongoing notes

Product spec (build this)

A) Canvas editor

* Infinite-ish canvas with pan and zoom
* Add nodes: Frame, Group, Rectangle, Ellipse, Line, Text, Image (URL), Button, Icon (SVG), Chart placeholder
* Drag, resize, rotate
* Snap-to-grid, alignment guides, and spacing distribution guides (basic but real)
* Multi-select, group/ungroup, lock/unlock
* Keyboard shortcuts: delete, copy/paste, undo/redo, zoom, nudge, duplicate, group
* Context menu: duplicate, bring forward/back, send to front/back, group, lock
* Accurate hit-testing, selection outlines, resize handles, rotation handle

B) Left panel: Layers + assets

* Layers tree with nesting (frames/groups), reorder via drag
* Visibility toggle, lock toggle, rename
* Search filter and “jump to layer”
* Assets tab: color styles, text styles, components (reusable symbols)

C) Right panel: Properties inspector

* Position/size, rotation
* Fill (solid + simple gradient), stroke, border radius, opacity, shadows (basic)
* Text: font size, weight, line height, alignment, color
* Constraints: pins + center constraints relative to frame
* Component overrides: allow overriding text + fills on instances

D) Components system

* Create a component from selection
* Insert component instances
* Instances inherit from the master, with override support
* “Go to main component” and “detach instance”

E) Prototype connections

* In a “Prototype” mode, allow linking one frame to another via hotspots
* Trigger: On click
* Preview mode supports navigation between frames using those links

F) Comments and annotations

* Comment mode: click to drop a pin on the canvas
* Threaded comments per pin (author name can be locally set)
* Resolve and reopen comments
* Comments list panel with jump-to-pin

G) Realtime multiplayer collaboration (single-machine, fully local)

* Local collaboration server (Node + WebSocket) started with the same dev command
* Open two browser tabs to the same session and see:

    * Live presence list (avatars or initials)
    * Live cursors with names
    * Live selections with colored outlines
    * Live edits syncing in near real-time
* Support optimistic updates with eventual consistency
* Basic conflict handling rules documented (prefer last-writer wins where needed)
* Include a “share link” that encodes the session id (still local)

H) Version history (local)

* Automatic snapshots of the design (store locally)
* Timeline list with restore
* Deterministic serialization so snapshots are diffable
* Ability to name a version milestone (for demo)

I) Replay mode (must be demo-ready)

* Maintain an append-only operations log (ops journal) for the current file/session
* Provide a Replay panel with:

    * Play, pause, step forward/back
    * A scrubber slider with timestamps or step numbers
    * Speed controls (0.5x, 1x, 2x, 4x)
    * “Branch from here” option to resume editing from a replay position (creates a new local version)
* Replay must be deterministic:

    * Same initial state + same ops log must always reconstruct the same design
    * Use stable IDs and stable ordering
* Persist ops log locally with the design JSON

J) Export

* Export the current design to:

    1. A JSON file (canonical source of truth, includes ops log optionally)
    2. Generated React + Tailwind code that reproduces the design with clean component structure
* Export must be deterministic: same design JSON => same generated output.
* Include a CLI script: `npm run export -- --input <design.json> --out <dir>` that works without opening the UI.
* If components exist, generate them as reusable React components.

K) Quality and engineering

* Strong TypeScript types for:

    * scene graph
    * operations model
    * collaboration messages
* Deterministic IDs and stable ordering
* Unit tests for:

    * selection model
    * transforms + constraints
    * serialization determinism
    * ops application determinism
    * codegen snapshot determinism
* Add property-based tests for ops or transforms if reasonable
* Basic performance guardrails: avoid re-render storms on drag, memoize hot paths

Process requirements (follow strictly)

1. PLANNING FIRST (write this file before coding anything):

    * Create `plans.md` with a milestone plan (at least 14 milestones) that will take hours.
    * For each milestone include: scope, key files/modules, acceptance criteria, and commands to verify.
    * Include a “risk register” with top technical risks and mitigation plans (rendering, transforms, realtime sync, replay determinism, export).
    * Include a “demo script” section describing a 3-minute demo flow for non-engineers that includes multiplayer + replay.
    * Include an “architecture overview” section describing:

        * scene graph data model
        * selection + transform system
        * rendering approach (SVG or Canvas, and why)
        * operations model (what an op looks like, how undo/redo works)
        * replay system (journal format, deterministic apply, branching)
        * sync engine (what is synced, how conflicts are handled, what is authoritative)
        * export pipeline and determinism strategy

2. SCAFFOLD SECOND:

    * Initialize the repo with Vite + React + TypeScript + Tailwind.
    * Add lint/typecheck/test tooling (Vitest recommended).
    * Add a small Node server for WebSocket collaboration (TypeScript).
    * Ensure `npm run dev` starts both the web app and the local collaboration server.
    * Ensure the app shows the shell UI layout (top bar, left panel, canvas, right inspector).

3. IMPLEMENT THIRD:

    * Implement one milestone at a time.
    * After each milestone: run verification commands, fix issues, commit with a clear message.
    * Keep diffs reviewable and avoid giant unstructured changes.

4. UX polish throughout:

    * Clean, modern UI with subtle animations.
    * Empty states, toasts, keyboard shortcut modal, and a demo mode banner.
    * Include a “Demo Projects” picker that loads 2-3 impressive sample files (marketing landing page, dashboard, mobile app mock).

5. If you hit complexity choices:

    * Prefer correctness and determinism over extra features.
    * Document tradeoffs and decisions in `plans.md` as you go.

Start now.
First, create `plans.md` with the complete plan, risk register, demo script, and architecture overview. Do NOT start coding until `plans.md` exists and is coherent.