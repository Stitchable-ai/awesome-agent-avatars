# API summary

## `awesome-agent-avatars` (core, no dependencies)

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
| `injectStyles(doc?)`, `stylesheet` | CSS (also `awesome-agent-avatars/styles.css`). |

## `BotAvatar`

`state`, `setState(id, { quiet? })`, `react(name, seconds?)`, `poke("spin" | "bounce" | "nod" | "wiggle" | "shake" | "jolt", { turns? })`, `look("left" | "right" | "up" | "down" | "center", seconds?)`, `moment(face, seconds?)`, `holdFace(face | null)`, `setPointer(x, y, weight)`, `grab(x, y)`, `dragTo(x, y)`, `release()`, `attend()`, `setGlow(on)`, `setReducedMotion(on)`, `setArt(art)` (hot-swap, keeps the state), `flash(prop, seconds?)`, `simulate(seconds)`, `destroy()`.

## `awesome-agent-avatars/react`

`<AgentAvatar art state? glow? size? className? style? onStateChange? …createAvatar options />` (ref → `BotAvatar`), `useStyleArt(style, options?)`, `useRecipeArt(registry, recipe)`.

## Types

All exported from `awesome-agent-avatars`. The engine is strict TypeScript and the vocabularies are closed types: `StateName` (the 58 built-in names, plus anything you add to `CustomStateNames`), `BuiltinStateName`, `AnyStateName` (what setters accept: a known name autocompletes, any string is allowed), `ReactionName`, `AnyReactionName` (a reaction, or a face shown as a moment), `PokeName`, `PokeParams`, `FaceName`, `LookDirection`. `POKES` is `Record<PokeName, PokeDef>`, `REACTIONS` is `Record<ReactionName, ReactionDef>`, `LOOK` is `Record<LookDirection, Partial<Pose>>`, `STATE_NAMES` is the readonly list the pack is built from.

Add your own state names to autocomplete (a plain string works without this):

```ts
declare module "awesome-agent-avatars" { interface CustomStateNames { deploying: true } }
```

Also: `BotAvatar`, `AvatarOptions`, `InteractionOptions`, `AgentPresence`, `StyleArt`, `AvatarStyle<O>`, `StyleOptions`, `AvatarRecipe`, `Field`, `Credit`, `Anchors`, `StyleRegistry`, `PictureStyleConfig`, `PropDef`, `MotionPack`, `StateRecipe`, `Clip`, `Key<V>`, `Ease`, `Pose`; `DicebearDefinition`, `DicebearPreset<O>` from `awesome-agent-avatars/dicebear`; `AgentAvatarProps` from `awesome-agent-avatars/react`.

## Styles

`awesome-agent-avatars/styles/micah`, `/avataaars`, `/gaze` (peer: `@dicebear/core`, `@dicebear/styles`), `/nice` (peer: `react`, `react-dom`, `react-nice-avatar`), `/fluent` (`fluentStyle({ baseUrl })` to self-host). Adapter: `awesome-agent-avatars/dicebear` → `dicebearStyle`, `variantField`, `colorField`, `creditOf`.
