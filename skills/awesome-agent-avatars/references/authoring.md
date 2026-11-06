# Authoring: an agent that edits its own avatar, and makes new styles

A person changes their agent's look in an editor. An agent should be able to do the same from a chat ("blue hair, a hat, no glasses, red clothes"), say plainly what the current style cannot do, offer a way through, and, because it codes, go further than a person bothers to: make new styles from existing ones.

Everything here is one set of pure functions, `awesome-agent-avatars/author`, reached three ways that cannot disagree:

| Who | How |
|---|---|
| an agent with a shell (`run_command`) | the `aav` CLI over a file, `avatar.json` |
| an app's own editor or tool layer | `import { applyEdit, … } from "awesome-agent-avatars/author"` |
| a person | your editor UI, built from the same `fields` |

Showing avatars needs none of this: the runtime (`createAvatar`, styles, `agentPresence`) stays plain browser JavaScript with no dependencies.

## The recipe is a file

```json
{ "v": 1, "style": "micah", "name": "Stitch",
  "options": { "hairColor": "#3b82f6", "glassesVariant": "none", "shirtColor": "#dc2626" },
  "wear": ["cap"] }
```

`wear` lists props the engine draws on the avatar in every state, on any style: `cap`, `beanie`, `hat` (a party hat), `headphones`, `bow`, `cape`, `crystal`. Pass it to `createAvatar(el, art, { wear })` or call `avatar.setWear([...])`. The JSON Schema ships as `awesome-agent-avatars/schema/avatar.schema.json`.

A host watches the file and re-dresses its avatars (`setArt`, `setWear`) when it changes. That is the whole integration for an agent that edits by command.

## The CLI

```sh
aav describe avatar.json            # every field, which are free (any colour), options with plain-word tags, what is impossible
aav edit avatar.json --trait hairColor=blue --trait hat="a hat" --trait glasses=none --trait topColor=red --wear "a hat"
aav switch avatar.json avataaars    # move to another style; carries what carries, names what is lost
aav check avatar.json               # validate a hand-edited recipe
aav render avatar.json --face happy -o still.svg   # look at the result (PNG with the optional @resvg/resvg-js)
aav styles --styles ./styles        # built-in styles plus your own style packages
aav style new ./styles/sunset --derive gaze        # scaffold a new style; also --compose micah, --module
aav lint ./styles/sunset --styles ./styles         # before registering it
```

Every command takes `--json` for machine output. `edit` never drops anything silently. Each ask either lands in `applied` or comes back in `rejected` with a reason and the nearest alternatives. When a trait is impossible in this style, `switchable` names the styles that have it:

```
✓ Hair colour → #3b82f6
✓ Glasses → None
✓ Top colour → #dc2626
✓ wearing cap
✗ hat: Micah cannot change hat: headwear drawn by the art: cap, beanie, hijab, turban…
    try: wear: cap (drawn by the engine on this style)
→ switch to Avataaars (avataaars) for hat: aav switch avatar.json avataaars
```

That output is what the agent tells the person, in its own words: what changed, what could not, and the way through.

## Traits: one vocabulary across styles

"Hair colour" is `hairColor` in Micah, `hairColor` in Avataaars, absent in Gaze. Styles declare `traits` (trait → field key), and edits may name traits instead of fields:

`skin`, `hairStyle`, `hairColor`, `facialHair`, `glasses`, `hat`, `hatColor`, `topStyle`, `topColor`, `eyeColor`, `earrings`, `shape`, `bodyColor`.

- **Colours are free.** A colour field takes any hex. A colour word works too ("blue", "dark blue"), and so do the host's own names through `palette` (`--palette "brand purple=#7C3AED"`).
- **Selects resolve by value, label, or tags.** Options carry plain-word `tags`, so "short swept back" finds Micah's `fonze` and "beanie" finds an Avataaars winter hat. `variantField(def, component, label, { tags })` sets them for a DiceBear style; the name's own words are used otherwise.
- **`carryTraits(from, options, to)`** is what a style switch should always do, in a person's editor too: keep the look, report the losses.

## New styles, three ways

Prefer data over code: a data style is inert JSON, so a host can accept it without running anything.

**1. Derive: a style from one style, with a few decisions made** (`deriveStyle`, or `{ "kind": "derive" }`):

```json
{ "kind": "derive", "id": "brand-blob", "name": "Brand blob", "from": "gaze",
  "drop": ["bodyColor"], "set": { "bodyColor": "#7c3aee", "inkColor": "#ffffff" },
  "gradient": { "replace": "#7c3aee", "stops": ["#7C3AED", "#EC4899"], "angle": 135 } }
```

`fillGradient(art, color, stops)` swaps one flat colour for a gradient in every face. Gradient ids stay unique per avatar, because the engine suffixes every SVG id.

**2. Compose: parts of several styles on one head** (`composeStyle`, or `{ "kind": "compose" }`):

```json
{ "kind": "compose", "id": "micah-hats", "name": "Micah with hats", "base": "micah",
  "layers": [{ "from": "avataaars", "part": "top", "field": "topVariant", "key": "hat", "label": "Hat",
               "only": ["hat", "winterHat1", "winterHat02", "hijab", "turban"], "fit": "crown", "hides": ["hair"], "trait": "hat" }] }
```

A layer takes a tagged part (`aav-part-<name>`) from another style and places it head to head on the base. The foreign head is mapped onto the base head (same width, centres and crowns aligned), so a hat sits on the new head as it sat on its own. `fit: "eyes"` maps eyes to eyes instead, which is the right rule for glasses. `hides` removes base parts while the layer is worn, the way a hat covers hair. Credits are the union of every source. This fits things that sit on a face: headwear, glasses, accessories. Faces, heads and bodies do not move between styles this way.

**3. Module: a style from scratch** (`style.mjs` exporting an `AvatarStyle`): SVG strings whose parts carry `class="aav-part-eyes"`, `aav-part-mouth` and so on. See [styles.md](styles.md). This runs code, so a host should load it only in a sandbox (a Worker with no DOM or network) and pass its art through `sanitizeArt`.

Check every new style before registering it:

- `lintStyle(style)` (or `aav lint`) refuses scripts, `foreignObject`, event handlers, external references and a missing credit or licence. It warns about faces the engine cannot animate: no tagged eyes means no blink and no gaze, and no mouth or `talk` face means it cannot talk.
- `sanitizeArt(art)` strips what the lint forbids. Run it on any art you did not write.
- `renderStill(style, options, face)` lets the agent look at the faces before it calls the style done.

## The host contract

1. Keep the agent's recipe as a file it may write, and re-dress live avatars when the file changes.
2. Never put the avatar's look in the system prompt. It changes, and a stale description of oneself is worse than none. One static line is enough: *"You appear as an animated avatar; to see or change it, use `aav describe` / `aav edit` on <path>."*
3. Show the person what changed (before and after, with an undo), and offer the `switchable` styles as choices, not a lecture.
4. Load data styles freely. Load module styles only sandboxed, sanitized, and with the person's approval.
5. Keep credits visible. A composite carries the union of its sources' licences.
