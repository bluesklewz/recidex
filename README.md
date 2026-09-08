# Recidex

A recipe library that treats a recipe less like a block of text and more like an
object worth designing — a bracket-style process diagram, a physical library you
move through in three-dimensional space, and a card that looks and feels like
something pulled off a shelf rather than rendered in a browser.

**Live at:** _[add your deployed URL here once live]_

---

## What this project actually is

Recidex is an experiment in **vibe coding as a real practice** — using an AI
coding agent (Claude Code) as the implementation layer for a project driven
entirely by interaction-design intuition rather than a written spec. The goal
wasn't "build a recipe app." It was: can a cohesive, considered interaction
model — one with a real point of view about motion, depth, and material —
be built by *directing* an agent well, rather than writing every line by hand?

The product idea sitting underneath that experiment: bridge the traditional,
physical experience of a recipe card or cookbook with something that only
makes sense in a digital, spatial context — a "liminal space" reading of a
recipe library — while still landing on a genuinely useful way to browse,
filter, and read recipes.

## What it does

- **A 3D ring library**, built with React Three Fiber, where recipes sit
  around a rotating circle grouped by category. The ring responds to scroll
  and to cursor position, with a hover-to-preview interaction that surfaces
  a recipe without ever occluding the rest of the shelf.
- **A bracket-matrix recipe graph** — think Cooking-for-Engineers-style
  process diagrams — generated automatically from plain-text ingredients and
  steps. Ingredients are parsed, matched to the step that uses them, and laid
  out as a column graph showing how prep converges into a finished dish.
- **A physical card metaphor** — each recipe renders as a printed label card
  (paper texture, ink-bleed text treatment, batch numbering) that flips to
  reveal its process graph on the back.
- **A continuous scene transition** from the 3D library into a per-recipe
  reading view, designed so the handoff between a WebGL scene and the page's
  real DOM content reads as one continuous motion rather than a page cut.

## Why this is worth a look, beyond the visuals

The interesting part of this project isn't any single animation — it's the
process of getting an AI agent to build something with a consistent point of
view, iteration by iteration, without the result drifting into something
generic. A few decisions that came out of that process:

- **Treating ambiguity as the actual risk.** Early on, a loosely-worded prompt
  asking the agent to "match a reference site's interaction" resulted in the
  agent quietly replacing a custom 3D ring with a conventional flat grid — the
  more common, "safer" interpretation of an ambiguous instruction. The fix
  wasn't scrapping the idea; it was learning to separate *structural*
  requirements ("the ring must stay a ring") from *stylistic* ones ("borrow
  this hover treatment"), and to state the former as non-negotiable.
- **Choosing the cheaper architecture on purpose.** When deciding how to hand
  off between the WebGL library scene and the DOM-based recipe view, the
  "more correct" solution (a single persistent 3D scene across both views)
  was deliberately set aside in favor of a freeze-frame crossfade — weighing
  perceived seamlessness against real costs (accessibility, battery,
  debugging surface, browser fallback) rather than defaulting to the more
  technically impressive option.
- **Git hygiene as part of the workflow, not an afterthought.** Structural
  rebuilds were snapshotted before being torn out; unrelated changes (a
  security cleanup vs. a feature rewrite vs. new seed data) were kept in
  separate, individually revertible commits; and a pre-publish audit caught
  hardcoded local file paths and a personal username in tracked docs before
  the repo went to GitHub.
- **Verifying against evidence, not memory.** Every iteration was checked
  against an actual screen recording or screenshot before the next prompt was
  written — treating "does this look right" as a question to answer visually,
  not to assume.

## Tech

Deliberately minimal: **no framework, no bundler, no build step** for the
core app — a single `index.html` with vanilla JS and CSS. The one exception
is the 3D library view, which loads React and `@react-three/fiber` as ES
modules directly from a CDN, mounted as an isolated island inside the page —
an explicit, scoped exception rather than a full framework migration.

- Vanilla JS/CSS/HTML (no build tooling)
- React Three Fiber (via CDN ESM import map) for the 3D library scene
- `localStorage` for persistence — no backend
- A small Node dev server and a Puppeteer-based screenshot script for
  local iteration

## Running it locally

```bash
node serve.mjs
# → http://localhost:3000
```

No install step beyond `npm install` for the dev-only screenshot tooling
(`puppeteer-core`) — the app itself has zero runtime dependencies.

## Status

This is a personal experiment, not a production product — there's no user
accounts, no server, and no data leaves the browser it's opened in. Treat it
as a working sketch of an interaction idea, not a finished consumer app.
