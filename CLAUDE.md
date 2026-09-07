# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A recipe-graph generator: paste a recipe as text and it renders a **Cooking-for-Engineers-style
bracket matrix** (ingredients = rows, process verbs = nested bracket-columns). The whole app is
**one file**, `index.html` — inline `<style>` + one IIFE `<script>`, no build step, no bundler.
Tailwind is *not* used despite what the `frontend-design` skill's CLAUDE.md says.

### Framework exception — the library ring

The **library route only** (`#/library`) is a **React Three Fiber** island — a deliberate, scoped
exception to "no framework". React, `three`, `react-dom`, and `@react-three/fiber` load as ES modules
via an **import map** in `index.html`'s `<head>` (from `esm.sh`, pinned versions) — still no bundler,
still no build step. The island is one `<script type="module" async>` at the end of `<body>` that
builds its tree with `React.createElement` (no JSX) and exposes `window.RecidexLibrary = { mount,
unmount }`. A **second, smaller module island** sits beside it — `window.RecidexExport` (jsPDF +
html2canvas, also via the import map) for the recipe-graph PDF/JPEG export. Everything else — the
router, `#/new`, the recipe view, persistence, the graph pipeline — stays vanilla DOM in the IIFE.
Do not extend the framework to other routes without a matching explicit decision.

## Commands

```bash
node serve.mjs                          # static server, project root → http://localhost:3000
node screenshot.mjs <url> [label] [w] [h]   # puppeteer-core + system Chrome → ./temporary screenshots/screenshot-N[-label].png
```

- `screenshot.mjs` hardcodes Chrome at `/Applications/Google Chrome.app/...` (macOS). It auto-increments
  the filename; read the PNG back with the Read tool to inspect.
- No test suite, no linter. `npm test` is a stub.
- To exercise a flow that needs interaction (generator submit, the R3F ring: wheel-scroll / hover
  preview / click-through, generate→loading→ring, the ring⇄recipe morph + freeze-frame handoff,
  the recipe-view carousel: wheel-sync between `.rv-labels` and `.rv-stage` / card flip / Edit →
  Save / Delete / Export, Duplicate), write a throwaway `.mjs` in the project root (so it resolves
  `puppeteer-core` from `node_modules`), run it, then delete it. `/tmp/*.mjs` can't resolve the
  dependency. Note the recipe view has **two** `.pill.red` buttons in the DOM (topbar "+ Add new"
  comes first) — target the Save/Generate one by text, not `querySelector('.pill.red')`. The ring
  needs WebGL — headless Chrome needs `--enable-unsafe-swiftshader --use-angle=swiftshader
  --use-gl=angle`.
- **Dev/test hooks** (set by the R3F island once mounted on `#/library`): `window.__recidexRing`
  (array of `{id,title,category,angleDeg}` placements), `window.__recidexSpin(rad)` (jump ring
  rotation), `window.__recidexFocus(id)` (force the hover-preview card), `window.__recidexOpen(id)`
  (run the real open-recipe flow incl. morph + handoff — set by `viewLibrary`, not the module).
  `window.RecidexExport.ready` / `window.RecidexLibrary.ready` gate the two module islands.
- **Headless-Chrome caveat:** CSS transitions/animations are fast-forwarded between forced paints,
  so mid-transition *screenshots* of the morph / handoff / column-cascade are unreliable — verify
  those by sampling element state (`getComputedStyle` opacity, `getAnimations()`, projected rects)
  instead. Temporarily bumping a duration constant + slow-sampling is the fallback.
- Deep-link routes for screenshots: `#/library`, `#/new`, `#/recipe/r1`…`#/recipe/r6`, `#/edit/r1`
  (seed ids are deterministic — see `seed()`).

## Architecture (all in `index.html`)

Hash router (`render()` / `currentRoute()`) swaps four views into `#app`:

| Route | Function | Reference image | Notes |
|---|---|---|---|
| `#/library` (default) | `viewLibrary` + the R3F island | — | **React Three Fiber ring** (see "Framework exception"). `viewLibrary` (vanilla) drops a fixed `#lib-stage` div into `#app` and calls `window.RecidexLibrary.mount(stage, {recipes, categories, onOpen, resume})`. The module's `Ring` places one card `<group>` per recipe on a circle (radius `R`) — grouped into **5 category segments** (`CATEGORIES`), each recipe at `segIndex*72° + fan`. Ring `rotation.y` is driven **only** by wheel `deltaY` (`WHEEL_K`), damped in `useFrame` — **no auto-rotation**. Geometry follows the pmnd.rs homepage ring-gallery pattern: each card is a **4:3 landscape** plane (`CARD_W`/`CARD_H`) oriented **tangent to the circle** (`rotation.y = angle − 90°` — the face normal runs along the tangent, giving the fanned stacked-slat look; side segments present their faces, the front/back arcs go edge-on) with a textured front and a blank `PAPER_BACK` reverse. `cardTexture(recipe, big)` is a **pixel port of the recipe view's DOM flip-card front** (`labelFace`): chocolate-bar label — tracked Chathura title, red `batchNo()`, yield, `TOTAL TIME` / `dietLine()`, `INGREDIENTS` (quantities stripped via `ingShort`, 3-line clamp), ✦ stamp, wavy `--paper-edge` rules, dog-ear, faint grain. `batchNo`/`dietLine`/`ingShort` are re-implemented in the module (the vanilla shell's copies aren't reachable). The ring card and the carousel card must stay visually identical — the ring→recipe handoff depends on it. The card **back** (`PAPER_BACK`, far arc only) is deliberately still blank, not the graph. `CatLabel` puts one billboarded category label (`CAT_LABEL` display names) near each segment's arc — child of the rotating group (orbits with the ring) but yaw-billboarded so it stays upright. `Rig` owns the camera — an **elevated, oblique** base framing (`CAM_BASE`/`CAM_TARGET`, `lookAt` each frame) so the whole ring reads as an ellipse, plus **subtle cursor parallax** (`pointer` ref from a window `pointermove`; x → azimuth `PARALLAX_AZ`, y → elevation `PARALLAX_EL`), additive to scroll. **Hover** (`Card` raycast `onPointerOver`, 320ms debounced clear) shows `CenterPreview` — a *duplicate* of the hovered card that fades/scales in at a fixed point in the ring's opening (`PREVIEW_POS`, billboarded); the original never leaves its slot. Clicking a card *or* the preview calls `onOpen`. **Ring ⇄ recipe morph** (`anim` module-global + `easeInOut`): `RecidexLibrary.exitToRecipe(id, peerIds)` sets `anim.phase='toRecipe'`; over `MORPH_MS` every `Card` blends (in world space, then back to local) from its ring slot to its `carouselSlot` — selected → forefront (`CAROUSEL_ORIGIN`, scale tuned so it projects onto the DOM `.rv-flip` rect), peers → vertical depth stack, non-peers recede + fade — while `Rig` blends `CAM_BASE`→`CAM_RECIPE`. `exitToRecipe`'s promise is **rAF-driven** (resolves when `anim.raw>=1`, not a bare timeout) so the frame is settled before the snapshot. **Freeze-frame handoff** (`HANDOFF_MS`): forward — `openRecipe` calls `RecidexLibrary.snapshot()` → `{url: canvas.toDataURL (needs gl.preserveDrawingBuffer), rect: selected card's screen box projected through a temp `CAM_RECIPE` camera}`, stashed in `pendingSnap`; `render()` floats `#recidex-snap` (that PNG, full-frame, z 58) over the incoming view, tears the canvas down immediately, and `viewRecipe(root,id,snap)` skips the `.rv` `rvEnter` fade, nudges `.rv-stage` so the real forefront card starts exactly under the snapshot then eases home, and `dissolveOut`s `#recidex-snap` (~`HANDOFF_MS`). Reverse — `render()` reparents `.rv`+`.rv-crumb` into a fixed `#recidex-rv-freeze` (with the page-ground gradient, z 6), `viewLibrary` mounts R3F under it with `resume.hold` freezing the carousel layout while the freeze `dissolveOut`s, then the `toRing` morph runs. The right-column entrance waits for **both** `#lib-stage` and `#recidex-snap` to be gone. `viewNew` clears a stale `recidex-morph` so a `/new` detour can't misfire the reverse. `window.__recidexSpin(rad)` / `window.__recidexFocus(id)` / `window.__recidexOpen(id)` / `window.__recidexRing` are dev/test hooks. |
| `#/new` | `viewNew` | — | paste form + live `renderGraph` preview + a required **Category `<select>`** (options show `CAT_LABEL` display names, values are the 5 canonical `CATEGORIES`) + **Description** / **Notes** `<textarea>`s; `Generate graph` pushes to `DB.recipes`, sets `sessionStorage['recidex-generating']`, routes to `/library` |
| `#/edit/:id` | `viewNew(root, editId)` | — | the same form, prefilled from the recipe. Primary button is **Save changes** (not "Generate graph"), no "Fill sample", Cancel → `#/recipe/:id`. Save does `Object.assign(recipe, draft)` in place (`delete draft.id` first), `save()`, routes back to `#/recipe/:id` — no loading screen, no new id. The **Category** `<select>` (options show `CAT_LABEL` display names, values are the canonical `CATEGORIES`) is how category gets reassigned — there is no "Move to…" action. Below the form actions, set apart, a red **`.btn-del` "Delete recipe"** → inline confirm row ("Delete "title"? This can't be undone." · Cancel · red **Delete**) → `DB.recipes.splice` + `save()` + `go("/library")`. |
| `#/recipe/:id` | `viewRecipe` | — | three-zone layout. **Breadcrumb** `Library › [Category]` (fixed, no recipe segment). **Left** `.rv-labels` — every recipe in this recipe's category as `.rv-label` (Chathura, tint / active = paper). **Center** `.rv-stage` — a vertical depth-stack carousel of `.rv-flip` cards (`buildFlipCard`): front = `labelFace(recipe)` (chocolate-bar-label layout — tracked Chathura title, red `batchNo()`, `--paper-edge` rules, ✦ stamp, `#rv-inkbleed` SVG displacement on `.lc-ink`, faint SVG-noise paper grain via `.lc::before`), back = `renderGraph(recipe,{mini:true})` scaled to fit by `fitBackGraphs()`. A CSS dog-ear (`.rv-flip-hint`) marks the flip. **Right** `.rv-detail` — `.rv-scroll` (masked, no scrollbar: `.masked` class toggled by `syncMasks()` only when actually overflowing) holds title / description / **Instructions** (`Step N` subheads) / **Notes** (freeform, non-stepped); pinned below are the tag pills (`.rv-tag`, uniform orange, **no category pill**) and the action row — **Edit** (→ `#/edit/:id`), **Export** (PDF/JPEG menu — see Export below), **Duplicate** (clone + route). No "Save to…" / "Move to…". One shared `cur` index: wheel over `.rv-labels` *or* `.rv-stage`, or a click on a label / neighbour card, calls `setIndex()` → re-paints all three panes + `history.replaceState`s the hash (no re-render, no `hashchange`). **Right-column entrance:** on mount the text column (`.rv-title` → `.rv-desc` → Instructions/Notes block → `.rv-tags`+`.rv-actions`) is held at `opacity:0`, then does a light staggered `rvColIn` (opacity + `translateY(11px)`, 380ms, 72ms offsets) — fired ~175ms *after the card finishes arriving*, keyed off `#lib-stage` being removed from the DOM (not a fixed timeout), with an rAF fallback for deep-links and a `prefers-reduced-motion` bypass. The card and the left label list are excluded. |

### The graph pipeline (the core of the app)

`buildGraph(recipe)` → `{rows, cells, banners, nCols}`, then `renderGraph()` lays it out as a CSS grid
(`grid-column` / `grid-row` line math; column count from `cell.col`, widened cells use `cell.colEnd`).

`buildGraph` logic, in order:
1. `parseIng` splits each ingredient line into `{qty, name, kw}` (keyword list for step matching).
2. `verbOf` maps a step's leading verb to a short label via the `VERBS` table; `detail()` extracts
   temp/time tokens shown under `bake`/`chill`/etc.
3. Each ingredient is assigned to the **first step whose text contains one of its keywords**
   (prep/preheat steps skipped). Unmatched ingredients ("leftovers") attach to the first real step.
4. Walk steps building `groups` (open accumulators) and `cells`:
   - prep/preheat steps with no ingredients → full-width `banners` (top of the matrix).
   - `SEP` regex ("separate bowl") starts a **parallel stream** at column 0 instead of consuming the
     running group; `JOIN`/`MIX_REF` decide when a step folds prior group(s) in.
   - `cell.col` = deepest input column + 1; parallel streams start at 0.
5. Post-pass: a shallow stream's cell gets `colEnd` stretched to `consumer.col - 1` so it visually
   reaches the step that merges it (fills dead channels).

Changing the parser? The seed recipes in `seed()` are the de-facto test cases — `r1` (Espresso
Brownies) is the direct analogue of `recipe-card.png` and should always render as
`melt / mix / mix / whisk / fold in / bake` with two banner rows.

### The recipe-view flip card

`buildFlipCard(recipe)` → `.rv-flip` → `.rv-flip-inner` (`transform-style:preserve-3d`) → two
`.rv-face`s (`backface-visibility:hidden`): `.front` holds `labelFace(recipe)`, `.back` holds
`renderGraph(recipe,{mini:true})`. Clicking the forefront card toggles `.flipped` (rotateY 180°);
clicking a non-forefront card advances the carousel instead.

`fitBackGraphs(cards)` scales each back-face `.graph` down with a CSS `transform` (`transform-origin:
top left`, ~0.94 safety factor) and sizes the `.graph-wrap` to the scaled box so the flex-centering
in `.rv-face.back` still works. It's called via `fitBackGraphsSoon` (double-rAF) on mount, on flip,
on `document.fonts.ready`, on a 450ms timeout, and on `resize` (the listener self-removes once the
view is gone) — web-font swap and the mini layout settle late, so a single measurement is unreliable.

The SVG filter `#rv-inkbleed` (a hidden `<svg>` after `#app`: `feTurbulence` fractalNoise +
`feDisplacementMap`) is applied via `.lc-ink { filter:url(#rv-inkbleed) }` — a subtle bleed layered
on the existing typefaces, not a font change. The paper grain on `.lc::before` is an inline
`feTurbulence` SVG data-URI at ~4.5% opacity (`mix-blend-mode:multiply`) — no image asset.

**Export** — the recipe view's "Export" action opens a small `.rv-export-menu` popover (**PDF** /
**JPEG**). `doExport(recipe, fmt)` builds a full-resolution `renderGraph(recipe)` off-screen (drop
shadow stripped), waits `document.fonts.ready` + a double-rAF, then hands the `.graph` node to
`window.RecidexExport` — a second `<script type="module">` island (jsPDF + html2canvas via the import
map, same pattern as the R3F island). `RecidexExport.jpeg` → `html2canvas` (scale 2) → `toDataURL
('image/jpeg')` download; `RecidexExport.pdf` → same raster wrapped in a single-page `jsPDF` sized to
the image (px→pt). Files download as `<slug>-graph.{jpeg,pdf}`. The old pre-Recidex
`exportCard()`/`fitGraph()` are gone; this is the replacement.

### Persistence & data model

`localStorage` key `recipe-graph.v1` = `{recipes: [...]}`. A recipe is
`{id, title, sourceUrl, yield, totalTime, activeTime, category, description, notes, ingredients:[str], steps:[str], tags:[str], createdAt}`.
`category` is one of the 5 `CATEGORIES` (`Appetizers` · `Entrees` · `Dessert` · `Drinks` ·
`Sauce & Seasoning`) — it drives which ring segment the card lands in. `CAT_LABEL` maps each to a
short display name (`Appetizer` / `Entree` / `Dessert` / `Drink` / `Seasoning`) used by the ring
labels and the edit-form select; **it is defined twice** — once in the IIFE (near `CATEGORIES`) and
once in the R3F module (they can't share scope). Keep them in sync. `description` is a one-line
blurb and `notes` is freeform text — both shown only on the recipe view, never on the graph; seeds
carry a `description` and empty `notes`. `save()` after every mutation. `seed()` (ids `r1`–`r6`) runs
when storage is empty or via "Reset library". Tags are free-form strings. New recipes from the
generator get `uid()` ids; Duplicate also mints a `uid()` and appends " (copy)" to the title.

After a generate, `viewNew` sets `sessionStorage['recidex-generating']` and routes to `/library`;
`viewLibrary` shows a full-screen loading panel (`libLoading()`, the design system's "generating
state") for ~1.4s, then clears the key and re-renders so the ring mounts with the new card already
in place. No diffuse-in animation.

## Design constraints

The design system is **Recidex** (`brand_assets/design-system.html` is the rendered spec;
`brand_assets/Recidex Design System.dc.html` is its Claude Design source). `index.html`'s `:root`
is the implementation of its tokens.

- **Ground vs. artifact.** The app runs on a dark **brown ramp** (`--brown-05`…`--brown-40`) — brown
  is *only* ever a ground or an elevation, never a text color or a component fill you read text off.
  **Paper** (`--paper` `#F0EDE4`) appears *only where a recipe lives* — the `.graph` matrix, cards,
  sheets, print. If a surface is off-white and isn't a recipe artifact, it's wrong. `--ink` is the
  only text color used on paper.
- **Type** is two families: **Chathura** (`--font-display`) for titles / section heads / the
  wordmark / label numerals — regular weight only, never below ~20px, never running text; and
  **JetBrains Mono** (`--font-mono`, also aliased to `--font-ui`) for everything else — body, steps,
  labels, buttons, inputs — weights 300 / 400 / 500.
- **Accent.** `--orange` `#C07000` is *interaction* — eyebrow labels, focus, filled tags, selected
  states; it carries `--ink` text when filled and is **not** a primary-action color. `--red`
  `#C43D2E` is a **rare marker** (batch/ID numerals, the active dot) — at most one red per viewport.
  The old `--grad-accent` orange→burnt-red gradient is retired. **One sanctioned exception to
  "red is never danger":** the edit form's `.btn-del` (red text → red-fill "Delete" on confirm).
  The edit form shows no batch numerals, so it's still one red per viewport.
- **No borders.** No outlines, no 1px strokes on chrome. Separation is surface value, blur, or space.
  Buttons and tags carry a 5px radius (`--radius-btn`); every other surface is square. The one
  survivor is the `.graph`'s internal bracket rules — they're structural recipe content (drawn in
  `--paper-edge` on paper), not chrome.
- **Buttons.** One paper primary per view (`.pill.red` — paper fill, ink text), reserved for
  generation/commit. `.pill.ghost` is the `--brown-30` secondary (any number). Bare `.pill` is
  quiet — no fill, hover shifts to orange. Focus indicator everywhere is a 2px inset orange
  underline (`box-shadow: inset 0 -2px 0`), never an outline ring.
- **Motion is slow.** Transitions run on `--ease-liminal` at `--dur-state` (400ms) / `--dur-enter`
  (600ms) / `--dur-resolve` (900ms). Nothing snaps or spins — no spinners, progress bars, or
  percentages. The page ground carries a 6s breathing olive glow (`body::after`, `@keyframes
  breathe`), disabled under `prefers-reduced-motion`.
- **Spacing** is base-8 with a 4px half-step: `--space-1`…`--space-9` = 4·8·12·16·24·32·48·96·176.
  Gaps come from the scale via flex/grid `gap`, not per-element margins. Layouts sit off-center.
- Per the product decision: recipes are **pasted as text**; the URL field is stored as a source link
  only — there is no scraping/fetch.
- `brand_assets/` also holds stale iOS screenshots (`IMG_58xx.PNG`) that predate Recidex — ignore
  them; the two design-system files are the only current references.

## External config

A `~/.codex/config.toml` exists. To import its user-level items (MCP servers, commands, subagents,
skills, instructions) into Claude Code, reply `/import` to see what's importable, then
`/import --yes=<digest>`.
