# Styles: the contract, and how to bring your own

A **style** turns options into art. The engine animates whatever art it gets, so a style never deals with motion, timing or interaction.

```ts
interface AvatarStyle<O> {
  id: string; name: string; tier: "parts" | "picture";
  credit: { author; authorUrl?; source?; sourceUrl?; license; licenseUrl? };
  fields: Field[];                 // what an editor may change (identity only: hair, skin, clothes…)
  defaults(seed?: string): O;
  render(options: O): StyleArt | Promise<StyleArt>;
}
```

`render()` returns `StyleArt`:

| Field | What it is |
|---|---|
| `faces` | HTML/SVG per face name. Only `neutral` is required; missing faces fall back (`laughing → happy → neutral`, `angry → squinted → focused`, …). Add `talk` (mouth open) and the avatar talks while streaming. |
| `tier` | `"parts"`: parts are tagged `class="aav-part-<name>"` (eyes, mouth, eyebrows, nose, glasses, hair, head…) and move independently. `"picture"`: one image; it tilts, hops, wears props and plays every state, but cannot blink. |
| `parallax` | depth per tagged part in px on a 200 px stage (eyes ≈ 4–10, hair ≈ 1, ears negative). This is what makes flat art feel 2.5D. |
| `closedFaces` | faces whose art already has closed eyes, so lids are not drawn on top. |
| `anchors` | where worn props sit (headphones, hat, cape, crystal, blush, hand), as fractions of the art box. Leave it out for tagged styles: the engine measures eyes, mouth, hair and head. |
| `bust` | a head-and-shoulders picture: anchored below the frame so a tilt or hop never shows the cut edge. |
| `rot`, `tilt`, `lift` | how far flat art may turn (a flat card reads badly past ~15°), how much the head tilts toward the pointer, how high it hops. |
| `skin`, `sleeve` | colours for the app-drawn arm and hand. |
| `arm` | how the arm appears when waving or asking. `"forearm"` (default for 2D busts): a forearm rises from below the frame in front of the shoulder, elbow out of view, in your sleeve colour and line (it is kept over the measured `aav-part-clothes`). `"sprite"` (default when `armSprite` is set): a real raised arm cut from a matching picture, for 3D/picture styles. `"floating"` (default for other parts styles): a small hand beside the head, for abstract characters. `"none"` (default for pictures without a sprite). |
| `armSprite` | for picture styles: an image of the same character with a raised arm, plus clip polygons for the hand and sleeve, where it sits on the art box, the elbow pivot, and a `tint` that recolours the borrowed sleeve to the outfit. See `styles/fluent.ts`. |
| `outline` | `{ color, width }` so app-drawn limbs match the art's line (width in a 1000-unit art box; omit for unlined art). |

## Three ways to add a style

**1. Any picture** (PNG, SVG, WebP, a 3D render, your mascot):

```ts
import { pictureStyle } from "awesome-agent-avatars";
export const mascot = pictureStyle({
  id: "mascot", name: "Our mascot", src: "/mascot.png",
  faces: { happy: "/mascot-happy.png", sleepy: "/mascot-sleepy.png" }, // optional extra expressions
  credit: { author: "Our design team", license: "Proprietary" },
});
```

**2. Any DiceBear style.** DiceBear 10 styles are data-only JSON definitions, so the adapter can tag every component without forking the art:

```ts
import { dicebearStyle, variantField, colorField } from "awesome-agent-avatars/dicebear";
import lorelei from "@dicebear/styles/lorelei.json";

export const loreleiStyle = dicebearStyle({
  id: "lorelei", name: "Lorelei", definition: lorelei,
  fields: [variantField(lorelei, "hair", "Hair"), colorField(lorelei, "hair", "Hair colour"), variantField(lorelei, "glasses", "Glasses", { optional: true })],
  defaults: () => ({ seed: "Ada", hairVariant: "variant05", hairColor: "#2b2b2b", glassesVariant: "none" }),
  faces: { neutral: { mouthVariant: "happy01" }, happy: { mouthVariant: "happy08" }, sad: { mouthVariant: "sad03" }, talk: { mouthVariant: "happy05" } },
  art: { parallax: { eyes: 6, eyebrows: 4, mouth: 3, hair: 1 }, bust: true },
});
```

The credit (author, source, licence) is read from the definition's own metadata.

**3. From scratch.** Return SVG strings whose parts carry `class="aav-part-eyes"`, `aav-part-mouth`, and so on. That is the whole contract.

```ts
import { defineStyle } from "awesome-agent-avatars";
export const blob = defineStyle({
  id: "blob", name: "Blob", tier: "parts",
  credit: { author: "You", license: "MIT" },
  fields: [{ key: "color", label: "Colour", type: "color", swatches: ["#9cc8fb", "#fbabaf", "#9bd78d"] }],
  defaults: () => ({ color: "#9cc8fb" }),
  render: ({ color }) => {
    const face = (eyes: string) => `<svg viewBox="0 0 100 100"><rect class="aav-part-head" x="15" y="25" width="70" height="55" rx="27" fill="${color}"/><g class="aav-part-eyes">${eyes}</g></svg>`;
    return {
      id: "blob", tier: "parts", parallax: { eyes: 4 },
      faces: { neutral: face('<circle cx="38" cy="52" r="5"/><circle cx="62" cy="52" r="5"/>'), happy: face('<path d="M32 54q6-8 12 0M56 54q6-8 12 0" stroke="#000" stroke-width="3" fill="none"/>') },
    };
  },
});
```

## Sharing a style with the community

Publish it as an npm package named `awesome-agent-avatars-style-<name>` that exports an `AvatarStyle`, then open a pull request adding it to the community list in the README. Please:

- keep the original author's credit in `credit` and in your README (some licences, such as CC BY 4.0, require it);
- ship no art you do not have the right to redistribute;
- include at least `neutral`, ideally `happy`, `sleepy`, `surprised` and `talk`.

## The editing interface

`fields` is the whole editor contract. Each field is `select`, `color`, `toggle` or `text`, with an optional `group`. Helpers:

- `groupFields(style.fields)` → sections for your UI;
- `randomOptions(style, seed)` → a random look, deterministic per seed;
- `normalizeOptions(style, saved)` → drops unknown keys and invalid values (safe for recipes saved by older versions);
- `createStyleRegistry([...styles])` → `recipe(styleId, options)` and `render(recipe)`.

A saved avatar is a small JSON **recipe**: `{ "v": 1, "style": "micah", "options": { ... }, "name": "Stitch" }`. Store it with your user. See [examples/react-editor](https://github.com/Stitchable-ai/awesome-agent-avatars/tree/main/examples/react-editor) for a complete editor built only from this interface.
