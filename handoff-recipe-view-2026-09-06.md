# Session handoff — Recidex recipe view (Task C)

**Date:** 2026-09-06
**Branch:** `main` (uncommitted working tree)
**App:** Recidex — single-file recipe-graph generator (`index.html`)

---

## 1. Current Goal

Rebuild the recipe view (`#/recipe/:id`, `viewRecipe`) as a three-zone layout per the
`~/Downloads/recipe v6.png` reference:

- **Breadcrumb** `Library › [Category]` only — no recipe-name segment.
- **Left:** vertical scrollable label menu of every recipe in the current category.
- **Center:** vertical depth-stack card carousel — forefront card sharp, neighbours
  blurred/dimmed above & below; card flips (front = label face, back = bracket graph).
- **Right:** title / description / Instructions (`Step N`) / Notes, in a masked
  no-scrollbar scroll region, with tag pills + an action list pinned below.
- Bidirectional sync between the label list and the carousel.
- Card face: subtle paper grain + SVG ink-bleed + a flip affordance icon.
- Data model gains `description` + `notes`; add a real Edit flow.

This task (Task C) is the third of three sequential tasks. Task A (Recidex design
system adoption) and Task B (React Three Fiber library ring) are already done and
committed-adjacent (working tree has had uncommitted changes since before this session).

**Status: COMPLETE and verified. Not committed.**

---

## 2. Current State

### Completed & verified (headless-Chrome interaction tests + screenshots)

| Area | State |
|---|---|
| Data model `description` + `notes` | Added to recipe object; all 6 seeds have a `description`, empty `notes`. |
| Generator form | New **Description** + **Notes** `<textarea>`s; wired into `draft()`; "Fill sample" sets a description. |
| `#/edit/:id` route | `currentRoute()` returns `{name:"new", editId}`; `viewNew(root, editId)` prefills every field, swaps the primary button to **Save changes**, hides "Fill sample", Cancel → `#/recipe/:id`. Save = `delete draft.id` → `Object.assign(recipe, draft)` → `save()` → route to `#/recipe/:id`. **Verified**: edit title + notes → save → persists to `localStorage` → routes back, notes lose `.empty`. |
| `viewRecipe` three-zone layout | Breadcrumb, label menu, carousel, detail column all built. **Verified** on r1–r5, 1180px & 1440px. |
| Carousel ↔ label sync | Single `cur` index. Wheel over `.rv-labels` **or** `.rv-stage`, or click a label / neighbour card → `setIndex()` repaints all 3 panes + `history.replaceState` (no `hashchange`, no re-render). **Verified** both directions. |
| Flip card | Forefront card click → toggles `.flipped` (CSS rotateY). Non-forefront click → advances carousel. Back face = `renderGraph(recipe,{mini:true})`, scaled to fit by `fitBackGraphs()`. **Verified** graph sits fully inside the card face (`graphInside: true`, scale ~0.92). |
| Card label face (`labelFace()`) | Chocolate-bar-label layout: tracked Chathura title (uppercase), red `batchNo()` (stable 3-digit hash of id), `--paper-edge` rules, TOTAL TIME / diet line, INGREDIENTS (comma list, 3-line clamp), ✦ stamp. |
| Ink-bleed | `#rv-inkbleed` SVG filter (`feTurbulence` fractalNoise + `feDisplacementMap` scale 1.7) on `.lc-ink` only. Subtle. |
| Paper grain | Inline `feTurbulence` SVG **data-URI** on `.lc::before`, ~4.5% opacity, `mix-blend-mode:multiply`. **No image asset** (user rejected the 99 KB PNG). |
| Flip affordance | CSS dog-ear corner (`.rv-flip-hint`) bottom-right of the front face. |
| Scroll mask | `.rv-scroll` / `.rv-labels` get `mask-image` top+bottom fade **only** via a `.masked` class that `syncMasks()` toggles when the element actually overflows (guards against the short-list-fades-to-nothing bug). |
| Tag pills | `.rv-tag` — uniform orange + ink text. **No category pill anywhere.** |
| Action list | Edit (→ `#/edit/:id`), Duplicate (clone + `uid()` + " (copy)" + route), Export / Save to… / Move to… → `toast()` stubs. **Verified** Edit + Duplicate. |
| Library round-trip | `#/library` → `#/recipe/:id` → breadcrumb "Library" → `#/library` remounts the R3F ring cleanly, `window.__recidexRing` repopulates, **no console errors**. |
| `CLAUDE.md` | Architecture table (`#/new`, new `#/edit/:id` row, rewritten `#/recipe/:id` row), "The recipe-view flip card" section (replaces stale "Flip card & export"), data-model line (`description`, `notes`), deep-link routes (`#/edit/r1`), interaction-testing note (two `.pill.red` buttons caveat). |

### Explicitly left as stubs (agreed with user: "Edit real, rest pragmatic")

- **Export** — toast stub. Styled-DOM→PNG rasterisation without a library was judged
  disproportionate; the old `exportCard()`/`fitGraph()` pipeline was already removed
  pre-session.
- **Save to…** / **Move to…** — toast stubs.

### Not committed

Working tree is dirty (`index.html`, `CLAUDE.md`, new handoff file, plus pre-existing
untracked `brand_assets/`, `serve.mjs`, `screenshot.mjs`, `package.json`, etc.).
User has not asked for a commit.

### Server

`node serve.mjs` is running detached → http://localhost:3000 (serves project root;
`/` and `/index.html` both 200). Log: `/tmp/claude-501/serve.log`.

---

## 3. Key Files & Resources

| Path | Role |
|---|---|
| `<project-root>/index.html` | The entire app. All Task C code lives here: `:root` tokens + `.rv-*` / `.lc-*` CSS block (before the `@media` queries), the `#rv-inkbleed` `<svg>` after `#app`, seed `description`/`notes`, `currentRoute()` edit route, `viewNew(root, editId)`, `viewRecipe(root, id)` + helpers (`batchNo`, `dietLine`, `ingShort`, `labelFace`, `buildFlipCard`, `fitBackGraphs`, `fitBackGraphsSoon`). ~1070 lines. |
| `<project-root>/CLAUDE.md` | Project instructions — updated this session (see table above). Authoritative for architecture + design constraints. |
| `<project-root>/brand_assets/design-system.html` | Rendered Recidex spec. `label` token = "Chathura 19 / 0.2em / caps"; depth stack = "blur 4px@50%, 10px@30%, max two layers"; 8 non-negotiable rules (R1–R8). |
| `<project-root>/brand_assets/Recidex Design System.dc.html` | Claude Design source for the above. |
| `<project-root>/serve.mjs` | Static file server, project root → :3000. Run from project root. |
| `<project-root>/screenshot.mjs` | `node screenshot.mjs <url> [label] [w] [h]` → `./temporary screenshots/screenshot-N[-label].png` (auto-increment, DSF 2). Uses system Chrome. **No WebGL flags** — fine for the recipe view, NOT for the R3F ring. |
| `<project-root>/temporary screenshots/screenshot-11{1..4}-*.png` | Latest verification shots: `111-flip-fit2` (graph fits card), `112-recipe-r3`, `113-recipe-r5-narrow` (1180px), `114-recipe-final` (tuned neighbour offset). |
| `~/Downloads/recipe v6.png` | **The** layout reference for Task C. 14.7 MB. |
| `~/Downloads/chocolate-label-card.png` | Card-face (label) design reference — grayscale → Recidex paper/ink/red/paper-edge. |
| `/tmp/paper.png` | Downloaded Transparent Textures "Paper" PNG (74 KB). **Not used** — user rejected embedding it. Safe to ignore/delete. |
| `/tmp/claude-501/serve.log` | Running server's stdout/stderr. |

### Test-hook globals (in the R3F module, library route only)

- `window.__recidexRing` — array of `{id,title,category,angleDeg}` card placements.
- `window.__recidexSpin(rad)` — jump ring rotation absolutely.

### localStorage

Key `recipe-graph.v1` = `{recipes:[...]}`. **Do not rename.** `screenshot.mjs` /
puppeteer launches are ephemeral (no user-data-dir) so each run starts from `seed()`.

---

## 4. Durable Decisions

1. **One file, no build step.** `index.html` = inline `<style>` + IIFE `<script>` +
   one `<script type="module" async>` (R3F island). No bundler. No Tailwind.
2. **Framework exception is `#/library` ONLY.** The recipe view is **vanilla DOM**.
   Do not pull React into it.
3. **Recidex design system is law** (`CLAUDE.md` "Design constraints" + `design-system.html`):
   - Brown ramp = ground/elevation only, never text or a fill you read text off.
   - Paper (`--paper` `#F0EDE4`) only where a recipe lives (card faces, graph). `--ink` only on paper.
   - `--orange` = interaction (eyebrows, focus, filled tags). `--red` = rare marker,
     **at most one per viewport** — here it's the `batchNo()` on the card face.
   - No borders/outlines. 5px radius on buttons + tags only; everything else square.
     The graph's internal bracket rules are the one allowed rule set (`--paper-edge`).
   - One paper primary button per view (`.pill.red`). Focus = 2px inset orange underline.
   - Motion is slow (`--ease-liminal`, `--dur-state/enter/resolve` = 400/600/900ms).
     No spinners/progress bars.
   - Base-8 spacing via `gap`. Layouts off-center (R8).
   - Two type families only: Chathura (display, ≥~20px, regular weight) + JetBrains Mono (everything else).
4. **Recipe-view specifics agreed with the user:**
   - Breadcrumb: `Library › [Category]`, no recipe segment. "Library" links; category is non-link context.
   - Label typography: design-system `label` token, but rendered **title-case** (not the token's caps) with tint/paper active state, to match `recipe v6.png`. (Deliberate deviation.)
   - Carousel: **vertical** depth stack (user overrode the horizontal option).
   - Notes: freeform, **not** step-numbered. Editable **only** via Edit — no inline editing on the recipe view.
   - Scroll region = description → notes; tag pills + action list are **outside** it (pinned).
   - Scrollability shown by `mask-image` fade, never a scrollbar or arrows.
   - Category **never** appears as a pill.
   - Actions: Edit · Export · Duplicate · Save to… · Move to…
   - "Edit real, rest pragmatic": Edit + Duplicate functional; Export/Save to…/Move to… are toast stubs.
   - Seeds stay sparse: `description` yes, `notes` empty.
   - Paper texture: **inline SVG noise, not an image asset** (user: "I don't need the texture if it will take up a lot of storage space").
5. **`CATEGORIES` = 5**: `Appetizers · Entrees · Dessert · Drinks · Sauce & Seasoning`.
   Seeds only populate Appetizers / Entrees / Dessert (2 each) — Drinks & Sauce & Seasoning are empty.
6. **`setIndex()` uses `history.replaceState`**, never `location.hash`, so the pane
   swap does not trigger `render()` (which would rebuild the DOM and lose flip state).
7. **`fitBackGraphs` runs many times** (double-rAF on mount, on flip, on `fonts.ready`,
   on a 450 ms timeout, on `resize`). A single measurement is unreliable — the mini
   graph + web-font swap settle late. The `resize` listener self-removes once
   `grid.isConnected` is false.

---

## 5. Dead Ends / Failed Attempts

1. **Embedding the Transparent Textures "Paper" PNG as a data-URI.** Downloaded to
   `/tmp/paper.png` (74 KB → ~99 KB base64). User rejected it for file-size reasons.
   Replaced with an inline `feTurbulence` SVG data-URI (~few hundred bytes).
   **Do not re-add the PNG.**
2. **`mask-image` unconditionally on `.rv-labels` / `.rv-scroll`.** With a short
   (2-item) label list, the top+bottom fades overlapped and ghosted the entire list
   (`wrapH: 25`, everything inside the fade zones). Fixed with a `.masked` class that
   `syncMasks()` only adds when `scrollHeight - clientHeight > 4` **and** `clientHeight > 0`.
3. **`.rv-label` looking `--tint` even when `.active` is `--paper`.** It IS `rgb(240,237,228)`
   (confirmed via `getComputedStyle`) — Chathura is just a thin display face; at 19–22px
   with wide tracking it reads faint. Mitigated by bumping to 26px / `.06em` tracking.
   Not a bug; don't chase it further without changing the type choice (which the design
   system constrains).
4. **`fitBackGraphs` with `offsetWidth`/`scrollWidth` measured in a single rAF.**
   Returned an undersized graph height (`scale(0.969)` when `~0.7` was needed) → the
   back-face graph overflowed the card. Fixed by (a) `getBoundingClientRect()`, (b)
   double-rAF via `fitBackGraphsSoon`, (c) a 0.94 safety factor, (d) sizing
   `.graph-wrap` to the scaled box so flex-centering works, (e) `transform-origin: top left`.
5. **Interaction tests selecting `document.querySelector('.pill.red')`** grabbed the
   topbar's "+ Add new" button (earlier in the DOM), not the "Save changes" button →
   test navigated to `#/new` and looked like a save bug. The save flow is correct;
   target the button **by text**. (Noted in `CLAUDE.md`.)
6. **Throwaway `.mjs` test scripts in `/tmp`** can't resolve `puppeteer-core` — must
   be written in the project root, run, then deleted. (Pre-existing `CLAUDE.md` note.)

---

## 6. Immediate Next Actions

The task is functionally complete. If resuming:

1. **Restart the server if needed:** `cd <project-root> && node serve.mjs`
   (it was started detached; may not survive a machine sleep). Confirm
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/index.html` → `200`.
2. **Visual sign-off** by the user on the recipe view:
   `http://localhost:3000/index.html#/recipe/r1` (and `#/recipe/r3`, `#/edit/r1`).
   Latest screenshots: `temporary screenshots/screenshot-114-recipe-final.png`,
   `-111-flip-fit2.png`.
3. **If the user approves — commit.** Suggested scope: `index.html` + `CLAUDE.md` +
   this handoff. Branch is `main`; per house rule, branch first if committing.
   Commit-message trailer: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
4. **Known-acceptable rough edges** (raise with user only if they care):
   - Short ingredient lists leave whitespace in the lower half of the label face.
   - Categories with 1 recipe show no carousel neighbours (expected).
   - Drinks / Sauce & Seasoning have no seeds, so `#/recipe/:id` for a recipe in
     those categories only appears after the user generates one.
   - Ink-bleed is very subtle at the current `scale=1.7` — bump the `feDisplacementMap`
     `scale` in the `#rv-inkbleed` filter if the user wants it more visible.
5. **Do NOT** re-introduce the paper PNG, re-add unconditional scroll masks, or move
   the recipe view onto React.
