# Motion packs

Behaviour is data. A motion pack is `{ clips, states, groups }`, and the default one ships 58 states and ~60 clips. Use `extendMotion` to change timings, add states or replace clips; pass the result as `motion` to `createAvatar` or `<AgentAvatar>`.

```ts
import { defaultMotion, extendMotion } from "awesome-agent-avatars";

const motion = extendMotion(defaultMotion, {
  states: {
    blocked: { hold: 30 },                          // drowsy after 30 s instead of 2 min
    deploying: { group: "Custom", clips: ["workA", "workC"], face: "focused", prop: ["laptop", "dock"], doc: ["Deploying", "types, an arrow rises", "deploy tool"] },
  },
});
createAvatar(el, art, { motion });
```

## A state

| Field | Meaning |
|---|---|
| `clips` | clip names. They play in a shuffled order and the same clip never plays twice in a row; repeat a name to weight it. |
| `compact` | gentler clips used when the avatar is under 56 px wide. |
| `face` | the state's face (styles fall back if they lack it). |
| `prop` / `wear` | props drawn beside the avatar / worn on it (headphones, hat, cape, crystal, hand…). |
| `next` + `hold` | hand off to `next` after `hold` seconds. With `next` and no `hold`, the clips play once in order, then hand off. |
| `pokes` | one-off motions on entry: `spin` (with `turns`), `bounce`, `nod`, `wiggle`, `shake`, `jolt`. |
| `talk` | the mouth moves (needs a `talk` face). |
| `follow` | how strongly the pointer pulls the gaze (0 for sleeping or being dragged). |
| `glance`, `dim`, `lid`, `wave` | idle glances, sleep/offline dimming, eyelid level, waving hand. |

## A clip

Keyframe tracks plus an optional procedural layer. Units: x/y in px on a 200 px stage (y down); `rot` is `[pitch, yaw, roll]` in degrees (pitch + looks up, yaw + looks to the viewer's right); `sq` is `[scaleX, scaleY]`; `gaze` is `[x, y]` in -1..1 (y + up); `lid` 0..1. A key's ease (`"io" | "in" | "out" | "lin" | [x1, y1, x2, y2]`) shapes the segment ending at that key.

```ts
const nodTwice = {
  dur: 1.6,
  tracks: {
    rot: [[0, [0, 0, 0]], [0.2, [-11, 0, 0], "out"], [0.42, [1, 0, 0]], [0.64, [-11, 0, 0], "out"], [0.9, [0, 0, 0]]],
    face: [[0.1, "happy"], [1.4, null]],          // null returns to the state's face; "blink" blinks
  },
  fn: (t) => ({ y: Math.sin(t * 8) }),            // optional: x/y/pitch/yaw/roll/gx/gy/lid add, sx/sy/zoom multiply
};
```

Clips start from wherever the avatar is: switching clips or states blends over ~0.3 s. Breathing, glances, pointer gaze, pokes, reactions and drag are layered on top by the engine, so clips stay simple.

## Props

Props are HTML snippets drawn by the app, the same for every style. Register your own:

```ts
import { registerProp } from "awesome-agent-avatars";
registerProp("coffee", { layer: "fx", html: '<div class="my-coffee">☕</div>' });   // fx = beside; front/back = worn
```

Worn props can position themselves with the CSS variables the engine sets from the style's anchors: `--cx`, `--ey`, `--hw`, `--crown`, `--my`, `--chin`, `--chest` (fractions of the art box).
