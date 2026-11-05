# API summary

## `bot-styles` (core, no dependencies)

| Export | |
|---|---|
| `createAvatar(el, art, opts?) → BotAvatar` | mount a living avatar. `opts`: `state`, `seed`, `motion`, `interactions` (`true` \| `false` \| `{ follow: "hover" \| "page" \| "none", reach, click, doubleClick, drag, pet, annoy }`), `autoSleep` (`{ bored: 45 }` or `false`), `reducedMotion` (`"auto"` \| boolean), `injectStyles`, `static`, `onState`. |
| `agentPresence(target, opts?)` | `typing()`, `dictating(on)`, `sent()`, `thinking()`, `tool(name, state?)`, `streaming()`, `waiting()`, `needsInput()`, `approved()`, `done()`, `error()`, `idle()`, `offline()`, `online()`, `react(name)`, `set(state)`. `target`: an avatar, an array, or `(state) => void`. |
| `stateForTool(name)` | guess a state from a tool name. |
| `defaultMotion`, `extendMotion(base, patch)`, `GROUPS` | the motion pack (58 states, ~60 clips) and how to change it. |
| `REACTIONS`, `POKES`, `LOOK`, `FACES`, `FACE_FALLBACK` | the built-in vocabularies. |
| `PROPS`, `registerProp(id, def)` | app-drawn props. |
| `defineStyle(style)`, `pictureStyle(cfg)` | write a style. |
| `randomOptions`, `normalizeOptions`, `createStyleRegistry`, `groupFields` | the editing interface. |
| `injectStyles(doc?)`, `stylesheet` | CSS (also `bot-styles/styles.css`). |

## `BotAvatar`

`state`, `setState(id, { quiet? })`, `react(name, seconds?)`, `poke("spin" | "bounce" | "nod" | "wiggle" | "shake" | "jolt", { turns? })`, `look("left" | "right" | "up" | "down" | "center", seconds?)`, `moment(face, seconds?)`, `holdFace(face | null)`, `setPointer(x, y, weight)`, `grab(x, y)`, `dragTo(x, y)`, `release()`, `attend()`, `setGlow(on)`, `setReducedMotion(on)`, `setArt(art)` (hot-swap, keeps the state), `flash(prop, seconds?)`, `simulate(seconds)`, `destroy()`.

## `bot-styles/react`

`<AgentAvatar art state? glow? size? className? style? onStateChange? …createAvatar options />` (ref → `BotAvatar`), `useStyleArt(style, options?)`, `useRecipeArt(registry, recipe)`.

## Styles

`bot-styles/styles/micah`, `/avataaars`, `/gaze` (peer: `@dicebear/core`, `@dicebear/styles`), `/nice` (peer: `react`, `react-dom`, `react-nice-avatar`), `/fluent` (`fluentStyle({ baseUrl })` to self-host). Adapter: `bot-styles/dicebear` → `dicebearStyle`, `variantField`, `colorField`, `creditOf`.
